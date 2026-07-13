# Workstream 10: original audio, motion, and sensory parity

Recommended model: a UI motion engineer with Web Audio/Howler experience and strong sound-design judgment.

## Mission

Create the original semantic audio system and consistent motion language that make Funwall feel as lively and responsive as Wordwall without copying its files, melodies, recordings, or branded theme art.

## Starts when

- Shared semantic audio event names are frozen.
- At least Wheel, Matching Pairs, and Gameshow emit events in test harnesses.
- Product/reference agent has supplied theme boards and reduced-motion behavior.

## Owned scope

- `src/services/audio/**`
- Shared motion tokens/utilities assigned by integration lead
- Original or explicitly licensed audio assets under the approved public asset boundary
- Audio/motion tests and provenance documentation

Do not edit game scoring, state transitions, timers, or answer logic.

## Clean-room rule

- Do not download, isolate, inspect, trace, pitch-shift, or remix Wordwall audio assets.
- Listening to public gameplay for high-level event function is allowed; document the observation as duration/energy/envelope, not a transcription.
- Every cue must be original synthesis/recording or carry a compatible license recorded in `THIRD_PARTY_NOTICES.md`.
- Similarity target is interaction role and emotional energy, not waveform or composition.

## Deliverables

### A. Semantic audio engine

- One service implementing shared event vocabulary.
- Master/effects/ambience/voice bus model, even if only effects ship initially.
- Browser unlock after first user gesture.
- Mute and volume persistence.
- Theme/sound-pack mapping.
- Cue concurrency limits and rate limiting.
- Cleanup on route/unmount/restart.
- No game imports raw audio URLs.

### B. Launch cue set

Create, mix, and document all master-plan events:

- UI press.
- Countdown normal/final urgency.
- Correct/incorrect.
- Complete/game over.
- Wheel tick/selected.
- Pair flip/match/miss.
- Gameshow lifeline/bonus start/reward.
- Wordsearch trace/found.
- Image reveal/buzzer.
- True/False enter/resolve.

For every cue record source, synthesis/recording method, duration, peak level, semantic event, theme variants, and license/provenance.

### C. Dynamic cues

- Wheel tick rate follows boundary events; engine prevents clipping at high speed.
- Countdown changes character in final five seconds without doubling event volume.
- Image reveal plinks are sparse/rate-limited; 96 tiles must not become noise.
- Wordsearch trace may change pitch/texture with path length but cannot imply correctness before resolution.
- Bonus suspense/reward can be layered but must stop immediately on restart/exit.

### D. Motion system

- Shared duration/easing tokens.
- Press, panel, feedback, overlay, card flip, tile reveal, result, and celebration patterns.
- Template-specific hooks that do not own lifecycle truth.
- Reduced-motion substitutions for every pattern.
- Particle/celebration budget and cleanup.
- Motion never delays input readiness without an explicit state-machine lock.

### E. Asset optimization

- Prefer synthesis for short cues when it sounds good and remains stable.
- If samples are used, ship modern compressed formats with fallback only when needed.
- Avoid a giant audio sprite if it complicates independent preload/error handling; record the decision.
- Preload only the selected template's cue pack.

## Acceptance criteria

- Muting before and during play silences all new cues immediately.
- No cue plays before user gesture or produces console errors when autoplay is blocked.
- Rapid wheel/image events stay below clipping/concurrency limits.
- Route change/restart stops loops and scheduled sounds.
- Audio communicates no information unavailable visually.
- Reduced-motion removes spatially intense effects and leaves timing/state correct.
- Each cue has provenance and no Wordwall asset dependence.
- Human review judges the set cohesive, cheerful, classroom-safe, and close in energy to the reference.

## Required tests

- Event-to-cue mapping.
- Mute/volume/persistence.
- Browser unlock failure/retry.
- Concurrency/rate limits.
- Scheduled cue cancellation.
- Theme pack fallback.
- Reduced-motion token selection.
- Game harness assertions that events emit once at correct lifecycle points.

## Human verification

- Laptop speakers at 25%, 50%, and 100% system volume.
- Headphones at safe level.
- Classroom display/projector if available.
- Chrome/Safari/Firefox or supported browser matrix.
- Run a full Gameshow round and a 100-item Wheel without fatigue/clipping.
- Blindly compare functional energy to the Wordwall reference without attempting exact melodic recall.

## Stop rule

Stop before changing game state timing to fit a cue, copying a reference asset, or adding unlicensed samples. If a game emits the wrong lifecycle event, file it back to that workstream rather than patching game logic here.

## Copy-ready assignment prompt

> Recommended model: a UI motion/Web Audio engineer. Read the master audio/motion spec, shared semantic event contract, and this packet. Build the central audio service, original launch cue set, motion tokens, reduced-motion substitutions, concurrency/cleanup, provenance, and tests. Tune against public reference energy only; do not copy or transform Wordwall files/melodies. Verify mute/unlock/restart, high-rate wheel/image events, laptop/headphone/classroom mix, and all six harnesses. Stop before modifying game logic to fit effects.

