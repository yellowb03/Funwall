/**
 * Funwall semantic audio service — sample-backed Web Audio engine.
 * No game imports URLs; emit(event) only.
 */

import {
  type SemanticAudioEventName,
  type SemanticAudioParams,
  isSemanticAudioEvent,
} from "@/services/audio/semantic-audio";
import {
  getCueDefinition,
  resolveCountdownCue,
} from "@/services/audio/cue-packs";
import {
  clampVolume,
  loadAudioPreferences,
  saveAudioPreferences,
} from "@/services/audio/preferences";
import type {
  AudioBusId,
  AudioPackId,
  AudioServiceOptions,
  CueDefinition,
  FunwallAudioService,
} from "@/services/audio/types";

type ActiveVoice = {
  event: SemanticAudioEventName;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startedAt: number;
  cancellable: boolean;
};

type BusGraph = {
  master: GainNode;
  effects: GainNode;
  ambience: GainNode;
  voice: GainNode;
};

const CLASS_LIMITS: Record<string, { maxVoices: number; minIntervalMs: number }> =
  {
    ui: { maxVoices: 6, minIntervalMs: 30 },
    tick: { maxVoices: 8, minIntervalMs: 12 },
    feedback: { maxVoices: 4, minIntervalMs: 60 },
    stinger: { maxVoices: 3, minIntervalMs: 100 },
    loop: { maxVoices: 1, minIntervalMs: 0 },
  };

function resolveBus(graph: BusGraph, bus: AudioBusId | undefined): GainNode {
  switch (bus) {
    case "ambience":
      return graph.ambience;
    case "voice":
      return graph.voice;
    case "master":
      return graph.master;
    case "effects":
    default:
      return graph.effects;
  }
}

/**
 * Create the production audio service. Safe on SSR (no-op until unlock in browser).
 */
export function createFunwallAudioService(
  options: AudioServiceOptions = {},
): FunwallAudioService {
  const now = options.now ?? (() => performance.now());
  const cueBaseUrl = (options.cueBaseUrl ?? "/audio/cues").replace(/\/$/, "");
  const persistenceKey =
    options.persistenceKey === undefined
      ? "funwall.audio"
      : options.persistenceKey;

  const prefs = loadAudioPreferences(persistenceKey);
  let muted = options.muted ?? prefs.muted;
  let volume = clampVolume(options.volume ?? prefs.volume);
  let pack: AudioPackId = options.pack ?? prefs.pack;
  let unlocked = false;
  let disposed = false;
  let context: AudioContext | null = null;
  let buses: BusGraph | null = null;

  const buffers = new Map<string, AudioBuffer | null>();
  const inflight = new Map<string, Promise<AudioBuffer | null>>();
  const active: ActiveVoice[] = [];
  const lastPlayed = new Map<string, number>();
  const classLastPlayed = new Map<string, number>();

  function applyMasterGain(): void {
    if (!buses || !context) return;
    const target = muted ? 0 : volume;
    try {
      buses.master.gain.setTargetAtTime(target, context.currentTime, 0.01);
    } catch {
      buses.master.gain.value = target;
    }
  }

  function ensureGraph(): AudioContext | null {
    if (disposed) return null;
    if (typeof window === "undefined" && !options.createContext) {
      return null;
    }
    if (!context) {
      try {
        const Ctor =
          options.createContext ??
          (() => {
            const AC =
              window.AudioContext ||
              (
                window as unknown as {
                  webkitAudioContext?: typeof AudioContext;
                }
              ).webkitAudioContext;
            if (!AC) throw new Error("AudioContext unavailable");
            return new AC();
          });
        context = Ctor();
        const master = context.createGain();
        const effects = context.createGain();
        const ambience = context.createGain();
        const voice = context.createGain();
        effects.gain.value = 1;
        ambience.gain.value = 0.85;
        voice.gain.value = 1;
        master.gain.value = muted ? 0 : volume;
        effects.connect(master);
        ambience.connect(master);
        voice.connect(master);
        master.connect(context.destination);
        buses = { master, effects, ambience, voice };
      } catch {
        return null;
      }
    }
    return context;
  }

  async function decodeFile(file: string): Promise<AudioBuffer | null> {
    if (buffers.has(file)) return buffers.get(file) ?? null;
    if (inflight.has(file)) return inflight.get(file)!;

    const job = (async () => {
      if (options.dryRun) {
        buffers.set(file, null);
        return null;
      }
      const ctx = ensureGraph();
      if (!ctx) {
        buffers.set(file, null);
        return null;
      }
      try {
        const url = `${cueBaseUrl}/${file}`;
        const res = await fetch(url);
        if (!res.ok) {
          buffers.set(file, null);
          return null;
        }
        const raw = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(raw.slice(0));
        buffers.set(file, buffer);
        return buffer;
      } catch {
        buffers.set(file, null);
        return null;
      } finally {
        inflight.delete(file);
      }
    })();

    inflight.set(file, job);
    return job;
  }

  function pruneActive(): void {
    for (let i = active.length - 1; i >= 0; i--) {
      // Voices remove themselves onended; keep array tight.
      if (!active[i]) active.splice(i, 1);
    }
  }

  function stopVoice(voice: ActiveVoice, fadeMs = 30): void {
    if (!context) return;
    try {
      const t = context.currentTime;
      voice.gain.gain.cancelScheduledValues(t);
      voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), t);
      voice.gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t + fadeMs / 1000,
      );
      voice.source.stop(t + fadeMs / 1000 + 0.01);
    } catch {
      try {
        voice.source.stop();
      } catch {
        /* already stopped */
      }
    }
    const idx = active.indexOf(voice);
    if (idx >= 0) active.splice(idx, 1);
  }

  function enforceConcurrency(
    event: SemanticAudioEventName,
    def: CueDefinition,
  ): void {
    pruneActive();
    const cls = def.class ?? "feedback";
    const classLimit = CLASS_LIMITS[cls] ?? CLASS_LIMITS.feedback;
    const maxVoices = def.maxVoices ?? classLimit.maxVoices;

    const sameEvent = active.filter((v) => v.event === event);
    while (sameEvent.length >= maxVoices) {
      const victim = sameEvent.shift()!;
      if (def.stealOldest !== false) stopVoice(victim, 20);
      else break;
    }

    const sameClass = active.filter((v) => {
      const d = getCueDefinition(pack, v.event);
      return (d.class ?? "feedback") === cls;
    });
    while (sameClass.length >= classLimit.maxVoices) {
      const victim = sameClass.shift()!;
      stopVoice(victim, 15);
    }
  }

  function rateLimited(
    event: SemanticAudioEventName,
    def: CueDefinition,
  ): boolean {
    const t = now();
    const cls = def.class ?? "feedback";
    const classLimit = CLASS_LIMITS[cls] ?? CLASS_LIMITS.feedback;
    const minEvent = def.minIntervalMs ?? classLimit.minIntervalMs;
    const minClass = classLimit.minIntervalMs;

    const lastE = lastPlayed.get(event) ?? -Infinity;
    if (t - lastE < minEvent) return true;

    const lastC = classLastPlayed.get(cls) ?? -Infinity;
    // Ticks share a class but allow denser per-event spacing; only soft-cap class.
    if (cls === "tick") {
      if (t - lastC < Math.min(minClass, 8)) return true;
    } else if (t - lastC < minClass * 0.5) {
      return true;
    }

    return false;
  }

  function playBuffer(
    event: SemanticAudioEventName,
    def: CueDefinition,
    buffer: AudioBuffer,
    params?: SemanticAudioParams,
  ): void {
    const ctx = ensureGraph();
    if (!ctx || !buses || disposed) return;
    if (muted) return;

    enforceConcurrency(event, def);

    const intensity = Math.min(1, Math.max(0, params?.intensity ?? 0.85));
    const exp = def.intensityExponent ?? 1;
    const baseGain = (def.gain ?? 0.7) * intensity ** exp;
    const rate = Math.min(
      2.5,
      Math.max(0.5, (def.baseRate ?? 1) * (params?.rate ?? 1)),
    );

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const g = ctx.createGain();
    // Soft attack to avoid clicks at high concurrency
    const attack = def.class === "tick" ? 0.002 : 0.008;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(
      Math.max(baseGain, 0.0001),
      ctx.currentTime + attack,
    );

    const dest = resolveBus(buses, def.bus);
    source.connect(g);
    g.connect(dest);

    const voice: ActiveVoice = {
      event,
      source,
      gain: g,
      startedAt: now(),
      cancellable: def.cancellable !== false,
    };
    active.push(voice);

    source.onended = () => {
      const idx = active.indexOf(voice);
      if (idx >= 0) active.splice(idx, 1);
      try {
        source.disconnect();
        g.disconnect();
      } catch {
        /* ignore */
      }
    };

    try {
      source.start(0);
    } catch {
      const idx = active.indexOf(voice);
      if (idx >= 0) active.splice(idx, 1);
    }

    lastPlayed.set(event, now());
    classLastPlayed.set(def.class ?? "feedback", now());
  }

  async function emitAsync(
    event: SemanticAudioEventName,
    params?: SemanticAudioParams,
  ): Promise<void> {
    if (disposed || muted) return;
    if (!unlocked && !options.dryRun) return;

    let def: CueDefinition =
      event === "countdown.tick"
        ? resolveCountdownCue(pack, params?.intensity ?? 0.5)
        : getCueDefinition(pack, event);

    // Dynamic wheel tick: slightly higher rate at high intensity without runaway gain
    if (event === "wheel.tick") {
      const intensity = params?.intensity ?? 0.5;
      const rate = params?.rate ?? 1;
      def = {
        ...def,
        gain: (def.gain ?? 0.28) * (0.75 + 0.35 * intensity),
        baseRate: Math.min(1.8, 0.85 + rate * 0.4),
      };
    }

    // Wordsearch trace: pitch may rise gently with path length via params.rate.
    // Must not imply correctness (no success timbre swap).
    if (event === "wordsearch.trace") {
      const intensity = params?.intensity ?? 0.2;
      const rate = params?.rate ?? 1;
      def = {
        ...def,
        gain: (def.gain ?? 0.22) * (0.7 + 0.3 * intensity),
        baseRate: Math.min(1.35, 0.92 + (rate - 1) * 0.25),
      };
    }

    // Image reveal already rate-limited in pack; intensity softens further
    if (event === "imageQuiz.reveal") {
      const intensity = params?.intensity ?? 0.3;
      def = { ...def, gain: (def.gain ?? 0.14) * (0.5 + 0.5 * intensity) };
    }

    if (rateLimited(event, def)) return;

    if (options.dryRun) {
      lastPlayed.set(event, now());
      classLastPlayed.set(def.class ?? "feedback", now());
      return;
    }

    const buffer = await decodeFile(def.src);
    if (!buffer || disposed || muted) return;
    // Re-check rate limit after await (burst of wheel ticks)
    if (rateLimited(event, def)) return;
    playBuffer(event, def, buffer, params);
  }

  const service: FunwallAudioService = {
    emit(event, params) {
      if (disposed) return;
      if (!isSemanticAudioEvent(event)) return;
      // Fire-and-forget; never throw into game logic
      void emitAsync(event, params).catch(() => {
        /* swallow decode/autoplay races */
      });
    },

    setMuted(value) {
      muted = Boolean(value);
      applyMasterGain();
      if (muted) {
        // Immediate silence of active voices
        for (const v of [...active]) stopVoice(v, 15);
      }
      saveAudioPreferences({ muted }, persistenceKey);
    },

    isMuted() {
      return muted;
    },

    async unlock() {
      if (disposed) return;
      if (options.dryRun) {
        unlocked = true;
        return;
      }
      const ctx = ensureGraph();
      if (!ctx) {
        unlocked = false;
        return;
      }
      try {
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        // Silent one-shot buffer to fully unlock on iOS Safari
        const silent = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = silent;
        src.connect(ctx.destination);
        src.start(0);
        unlocked = ctx.state === "running" || ctx.state === "suspended";
        // If still suspended, mark unlocked optimistically after gesture attempt
        unlocked = true;
        applyMasterGain();
      } catch {
        unlocked = false;
      }
    },

    setVolume(value) {
      volume = clampVolume(value);
      // Sliding to 0 acts as soft mute without flipping mute preference;
      // sliding up from 0 restores audible master gain when not hard-muted.
      applyMasterGain();
      saveAudioPreferences({ volume }, persistenceKey);
    },

    getVolume() {
      return volume;
    },

    setPack(next, options) {
      pack = next;
      if (options?.persist) {
        saveAudioPreferences({ pack }, persistenceKey);
      }
    },

    getPack() {
      return pack;
    },

    async preload(events) {
      if (disposed || options.dryRun) return;
      ensureGraph();
      const names: readonly SemanticAudioEventName[] =
        events && events.length > 0
          ? events
          : ([
              "ui.press",
              "countdown.tick",
              "answer.correct",
              "answer.incorrect",
              "game.complete",
              "game.over",
              "wheel.tick",
              "wheel.selected",
              "pairs.flip",
              "pairs.match",
              "pairs.miss",
              "gameshow.lifeline",
              "gameshow.bonusStart",
              "gameshow.bonusReward",
              "wordsearch.trace",
              "wordsearch.found",
              "imageQuiz.reveal",
              "imageQuiz.buzzer",
              "trueFalse.enter",
              "trueFalse.resolve",
            ] as const);

      const files = new Set<string>();
      for (const name of names) {
        files.add(getCueDefinition(pack, name).src);
        if (name === "countdown.tick") {
          files.add("countdown-urgent.ogg");
        }
      }
      await Promise.all([...files].map((f) => decodeFile(f)));
    },

    stopAll() {
      for (const v of [...active]) {
        if (v.cancellable) stopVoice(v, 40);
      }
    },

    dispose() {
      disposed = true;
      for (const v of [...active]) stopVoice(v, 10);
      active.length = 0;
      buffers.clear();
      inflight.clear();
      if (context) {
        void context.close().catch(() => {
          /* ignore */
        });
      }
      context = null;
      buses = null;
    },

    isUnlocked() {
      return unlocked;
    },
  };

  return service;
}

/**
 * Browser helper: create service or fall back to dry-run when AudioContext missing.
 */
export function createBrowserAudioService(
  options: AudioServiceOptions = {},
): FunwallAudioService {
  if (typeof window === "undefined") {
    return createFunwallAudioService({ ...options, dryRun: true, persistenceKey: null });
  }
  return createFunwallAudioService(options);
}
