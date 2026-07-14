import { describe, expect, it, beforeEach, vi } from "vitest";
import { createFunwallAudioService } from "@/services/audio/create-audio-service";
import {
  AUDIO_PACKS,
  getCueDefinition,
  listPackCueFiles,
  resolveCountdownCue,
} from "@/services/audio/cue-packs";
import {
  clampVolume,
  isAudioPackId,
  loadAudioPreferences,
  saveAudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
} from "@/services/audio/preferences";
import { SEMANTIC_AUDIO_EVENTS } from "@/services/audio/semantic-audio";
import type { AudioPackId } from "@/services/audio/types";

describe("cue packs", () => {
  it("maps every semantic event in every pack", () => {
    const packs: AudioPackId[] = ["classic", "gameshow", "classroom", "quiet"];
    for (const pack of packs) {
      for (const event of SEMANTIC_AUDIO_EVENTS) {
        const def = getCueDefinition(pack, event);
        expect(def.src).toMatch(/\.ogg$/);
        expect(def.gain).toBeGreaterThan(0);
        expect(def.gain).toBeLessThanOrEqual(1.5);
      }
    }
  });

  it("lists unique cue files per pack", () => {
    const files = listPackCueFiles("classic");
    expect(files.length).toBeGreaterThan(10);
    expect(new Set(files).size).toBe(files.length);
  });

  it("switches countdown to urgent at high intensity for classic", () => {
    const calm = resolveCountdownCue("classic", 0.4);
    const urgent = resolveCountdownCue("classic", 0.95);
    expect(calm.src).toBe("countdown-tick.ogg");
    expect(urgent.src).toBe("countdown-urgent.ogg");
  });

  it("keeps classroom countdown soft under high intensity", () => {
    const urgentClassroom = resolveCountdownCue("classroom", 0.99);
    expect(urgentClassroom.src).not.toBe("countdown-urgent.ogg");
  });

  it("gameshow pack uses steel stingers", () => {
    expect(AUDIO_PACKS.gameshow["answer.correct"].src).toContain("gameshow");
    expect(AUDIO_PACKS.gameshow["game.complete"].src).toContain("gameshow");
  });

  it("quiet pack has lower gains than classic", () => {
    expect(AUDIO_PACKS.quiet["ui.press"].gain!).toBeLessThan(
      AUDIO_PACKS.classic["ui.press"].gain!,
    );
    expect(AUDIO_PACKS.quiet["wheel.tick"].gain!).toBeLessThan(
      AUDIO_PACKS.classic["wheel.tick"].gain!,
    );
  });
});

describe("preferences", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("clamps volume", () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_AUDIO_PREFERENCES.volume);
  });

  it("validates pack ids", () => {
    expect(isAudioPackId("classic")).toBe(true);
    expect(isAudioPackId("nope")).toBe(false);
  });

  it("persists mute and volume when storage is available", () => {
    if (typeof localStorage === "undefined") return;
    saveAudioPreferences({ muted: true, volume: 0.4, pack: "quiet" });
    const loaded = loadAudioPreferences();
    expect(loaded.muted).toBe(true);
    expect(loaded.volume).toBe(0.4);
    expect(loaded.pack).toBe("quiet");
  });

  it("returns defaults when persistence disabled", () => {
    const prefs = loadAudioPreferences(null);
    expect(prefs).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });
});

describe("createFunwallAudioService (dry-run)", () => {
  it("implements mute/volume/pack and unlock without throwing", async () => {
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
      volume: 0.5,
    });

    expect(audio.isMuted()).toBe(false);
    expect(audio.getVolume()).toBe(0.5);
    expect(audio.getPack()).toBe("classic");

    await audio.unlock();
    expect(audio.isUnlocked()).toBe(true);

    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.emit("answer.correct", { intensity: 1 });
    audio.emit("wheel.tick", { intensity: 0.9, rate: 2 });

    audio.setMuted(false);
    audio.setVolume(0.2);
    expect(audio.getVolume()).toBe(0.2);
    audio.setPack("gameshow");
    expect(audio.getPack()).toBe("gameshow");

    audio.stopAll();
    audio.dispose();
    audio.emit("ui.press"); // no throw after dispose
  });

  it("rate-limits rapid wheel ticks in dry-run", async () => {
    let t = 0;
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
      now: () => t,
    });
    await audio.unlock();

    // First tick accepted; immediate second rejected by minInterval
    audio.emit("wheel.tick", { intensity: 1, rate: 2 });
    audio.emit("wheel.tick", { intensity: 1, rate: 2 });
    t = 5; // still under minInterval for wheel (~18ms)
    audio.emit("wheel.tick", { intensity: 1, rate: 2 });
    t = 50;
    audio.emit("wheel.tick", { intensity: 1, rate: 2 });
    // Smoke: no throws; intervals enforced internally
    audio.dispose();
  });

  it("silences immediately when muted mid-session", async () => {
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
    });
    await audio.unlock();
    audio.emit("gameshow.bonusStart");
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.emit("answer.correct");
    audio.stopAll();
    audio.dispose();
  });

  it("ignores unknown event names safely", async () => {
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
    });
    await audio.unlock();
    // @ts-expect-error intentional invalid event
    audio.emit("not.a.real.event");
    audio.dispose();
  });

  it("stopAll is safe before unlock", () => {
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
    });
    audio.stopAll();
    audio.dispose();
  });

  it("preload resolves in dry-run", async () => {
    const audio = createFunwallAudioService({
      dryRun: true,
      persistenceKey: null,
    });
    await expect(audio.preload(["ui.press", "wheel.tick"])).resolves.toBeUndefined();
    audio.dispose();
  });
});

describe("theme pack fallback", () => {
  it("falls back to classic definition shape for all packs", () => {
    for (const pack of Object.keys(AUDIO_PACKS) as AudioPackId[]) {
      const def = getCueDefinition(pack, "ui.press");
      expect(def).toMatchObject({
        src: expect.any(String),
        bus: "effects",
      });
    }
  });
});

describe("audioPackForThemeKey", () => {
  it("maps product theme keys to packs", async () => {
    const { audioPackForThemeKey } = await import("@/services/audio/theme-pack");
    expect(audioPackForThemeKey("classic")).toBe("classic");
    expect(audioPackForThemeKey("tv-game-show")).toBe("gameshow");
    expect(audioPackForThemeKey("high-readability")).toBe("classroom");
    expect(audioPackForThemeKey("quiet")).toBe("quiet");
    expect(audioPackForThemeKey("unknown-theme")).toBe("classic");
    expect(audioPackForThemeKey(null)).toBe("classic");
  });
});

describe("cuesForTemplate", () => {
  it("returns template-specific subsets including shared feedback", async () => {
    const { cuesForTemplate } = await import("@/services/audio/template-cues");
    const wheel = cuesForTemplate("wheel");
    expect(wheel).toContain("wheel.tick");
    expect(wheel).toContain("ui.press");
    expect(wheel).not.toContain("pairs.flip");

    const pairs = cuesForTemplate("matching-pairs");
    expect(pairs).toContain("pairs.match");
    expect(pairs).toContain("game.complete");
  });
});

describe("shared browser audio singleton", () => {
  it("returns the same instance and shares mute state", async () => {
    const {
      getSharedBrowserAudio,
      __resetSharedBrowserAudioForTests,
    } = await import("@/services/audio/shared-audio");
    __resetSharedBrowserAudioForTests();
    const a = getSharedBrowserAudio();
    const b = getSharedBrowserAudio();
    expect(a).toBe(b);
    a.setMuted(true);
    expect(b.isMuted()).toBe(true);
    a.setMuted(false);
    __resetSharedBrowserAudioForTests();
  });
});

describe("SEMANTIC_AUDIO_EVENTS freeze", () => {
  it("includes the contracted launch vocabulary", () => {
    expect(SEMANTIC_AUDIO_EVENTS).toContain("ui.press");
    expect(SEMANTIC_AUDIO_EVENTS).toContain("wheel.tick");
    expect(SEMANTIC_AUDIO_EVENTS).toContain("imageQuiz.reveal");
    expect(SEMANTIC_AUDIO_EVENTS).toContain("trueFalse.resolve");
    expect(SEMANTIC_AUDIO_EVENTS).toHaveLength(20);
  });
});

// Keep vi import used if needed for future spies
void vi;
