# Funwall parity checklist

QA and implementers use this without requiring signed-in Wordwall screenshots. It separates **required experiential parity**, **intentional Funwall differences**, and **prohibited copies**.

Review at **1440×900**, **1024×768**, and **390×844**. Mark each item Pass / Fail / N/A.

---

## A. Required experiential parity

These must feel like the same product class: fast create → save → play loop, airy classroom UI, content-first editors, lively but clear players.

### A1. Owner workflow

| ID | Criterion | Pass? |
|---|---|---|
| A1.1 | Signed-in owner lands on My Activities as home | |
| A1.2 | Create activity → template picker → editor → Done → owner activity page in one continuous flow | |
| A1.3 | Progress strip shows Pick a template → Enter content → Play with correct active step | |
| A1.4 | Template picker shows **only** the six launch templates | |
| A1.5 | Template search and Recommended / Alphabetical sort work | |
| A1.6 | Recommended order: Wheel, Matching pairs, Gameshow quiz, Wordsearch, Image quiz, True or false | |
| A1.7 | Template cards use split icon/copy layout, pale-blue icon pane, thin border, compact description | |
| A1.8 | Desktop picker is three columns; tablet two; phone one | |
| A1.9 | Entire template card is clickable; keyboard Enter/Space selects with visible focus | |
| A1.10 | Editor is content-first (title, rows), not a free design canvas | |
| A1.11 | Autosave shows Saving… / Saved / Save failed; failed saves retain local edits | |
| A1.12 | Done validates playable content, saves, and opens activity page | |
| A1.13 | Incomplete drafts can autosave; Done blocked until playable | |
| A1.14 | My Activities supports search, sort, template/folder filter | |
| A1.15 | Card overflow: Play, Edit, Duplicate, Rename, Move, Share, Delete | |
| A1.16 | Duplicate suffixes title with “copy” and does not mutate source | |
| A1.17 | Soft delete → Trash → Restore | |
| A1.18 | Empty dashboard offers six compact templates + create CTA | |
| A1.19 | Owner activity page: 16:9 stage, Play overlay, share/edit/duplicate/results | |
| A1.20 | Visual style and options preview before Apply to this activity | |
| A1.21 | Switch template respects compatibility (safe / reviewable / blocked)—no silent data loss | |
| A1.22 | Public play link is unguessable and shows no owner controls | |
| A1.23 | Images insert via in-app Search / Upload / My images without leaving editor | |
| A1.24 | Alt text editable; contain/cover/focal supported | |

### A2. Visual system

| ID | Criterion | Pass? |
|---|---|---|
| A2.1 | App canvas ≈ `#E7F3F9` (Classic) | |
| A2.2 | Primary actions ≈ `#0DA9FF`; coral accent ≈ `#FF4B63` for incorrect/playful detail | |
| A2.3 | Ink `#111111`, muted `#828282`, thin blue-gray borders, white surfaces | |
| A2.4 | Heading/body fonts: Reddit Sans + Open Sans or declared free equivalents | |
| A2.5 | Modest radii (5–8 px controls/cards); not pill-everything | |
| A2.6 | Minimal shadows; flat, teacher-friendly chrome | |
| A2.7 | Touch targets ≥ 44×44 px | |
| A2.8 | Four themes ship: Classic, TV Game Show, Classroom, High Readability | |
| A2.9 | Themes cover all six games (stage tokens sufficient) | |
| A2.10 | Original template thumbnails (not placeholders/emoji-only at polish gate) | |

### A3. Player shell

| ID | Criterion | Pass? |
|---|---|---|
| A3.1 | Shared lifecycle: loading → ready → playing → paused → feedback → completed/gameOver → review | |
| A3.2 | Fullscreen, sound on/off, restart, exit available | |
| A3.3 | Mute persists appropriately; no audio-only information | |
| A3.4 | Game-affecting randomness is seeded and replayable | |
| A3.5 | Responsive play on desktop, tablet, phone, classroom display sizes | |
| A3.6 | Keyboard operable paths for each game | |
| A3.7 | Reduced-motion alternatives usable for all six | |
| A3.8 | Scored games show local result summary; leaderboard name optional on completed scored runs | |
| A3.9 | **Wheel has no score and no leaderboard** | |
| A3.10 | Public invalid/disabled links fail safely without owner data leaks | |

### A4. Per-template behavior (essential)

| ID | Criterion | Pass? |
|---|---|---|
| A4.1 | **Wheel:** spin, decelerate 4–7s (or reduced-motion alt), selected matches pointer, eliminate session-only, spin again | |
| A4.2 | **Pairs:** two-tile check, lock during evaluate, match/mismatch feedback, completion stats | |
| A4.3 | **Gameshow:** timed MCQ, lives optional, lifelines, bonus not after final Q, review | |
| A4.4 | **Wordsearch:** deterministic grid, drag/tap modes, found highlighting, placement errors clear in editor | |
| A4.5 | **Image quiz:** tile reveal, buzzer pauses reveal, scoring from correctness + reveal fraction | |
| A4.6 | **True/False:** statement cards, fixed True/False targets, timeout handling, reduced-motion static card | |

### A5. Accessibility

| ID | Criterion | Pass? |
|---|---|---|
| A5.1 | Visible focus on all interactive controls | |
| A5.2 | Correct/incorrect not color-only | |
| A5.3 | Images have alt; audio has label/transcript when present | |
| A5.4 | Modal focus trap + restore | |
| A5.5 | Live regions for critical game events without chatter overload | |
| A5.6 | WCAG 2.2 AA target for owner + player chrome | |
| A5.7 | 200% zoom usable without loss of primary actions | |

### A6. Audio / motion character (functional parity)

| ID | Criterion | Pass? |
|---|---|---|
| A6.1 | Short UI feedback cues on press, correct, incorrect, complete | |
| A6.2 | Wheel ticks scale with motion; selection sting on land | |
| A6.3 | Pairs flip/match/miss cues | |
| A6.4 | Motion timings roughly match plan (UI <300 ms; feedback ~250–550 ms; wheel long) | |
| A6.5 | All cues original; semantic events from games | |

---

## B. Intentional Funwall differences

Do **not** fail QA for these.

| ID | Difference | Rationale |
|---|---|---|
| B1 | Product name, logo, and wordmark are Funwall originals | Clean-room brand |
| B2 | Exactly six templates; no marketplace, locked teaser templates, or upgrade upsells | Scope |
| B3 | No public community library, comments, or social profiles | Non-goal |
| B4 | No payments, plans, or artificial feature gates | Personal product |
| B5 | No AI activity generation | Non-goal |
| B6 | No printable worksheets / PDF export at v1 | Non-goal |
| B7 | No live multiplayer rooms | Non-goal |
| B8 | Auth may use Supabase email/password (or chosen stack) rather than Wordwall’s IdP | Implementation |
| B9 | Image search via Openverse (+ optional Pexels), not Wordwall’s media stack | Clean-room + licensing |
| B10 | Original illustrations, theme art, and audio (similar function, different melody/timbre) | Legal |
| B11 | Free font equivalents allowed (Nunito Sans, Source Sans 3, etc.) | Licensing flexibility |
| B12 | High Readability theme and explicit reduced-motion preference may exceed reference | Accessibility |
| B13 | Conversion matrix and explicit review steps may be clearer than reference UX | Safety |
| B14 | Diagnostic error IDs on fatal player errors | Operability |
| B15 | Fixture IDs and internal template keys (`wheel`, `matching-pairs`, …) are Funwall domain | Architecture |
| B16 | Stack is Next.js/Supabase greenfield—not a clone codebase | Clean-room |

---

## C. Prohibited copied elements

Any Pass on these is a **release blocker**.

| ID | Prohibition | Check method |
|---|---|---|
| C1 | Wordwall logo, wordmark, or “Wordwall” branding in UI/assets | Visual + asset search |
| C2 | Traced or exported Wordwall template illustrations | Visual compare + provenance |
| C3 | Copied proprietary theme backgrounds or character art | Asset audit |
| C4 | Redistributed Wordwall audio files or recognizable melodic clones intended to impersonate | Audio review |
| C5 | Scraped Google/Bing/Pinterest/Wordwall images in media pipeline | Code + network audit |
| C6 | Copied code from unlicensed wordwall-clone repositories | License/provenance review |
| C7 | Pixel-perfect recreation of proprietary marketing pages as product chrome | Design review |
| C8 | Using Wordwall trademarks in domain, titles, or meta tags | String search |
| C9 | Hotlinking Wordwall CDNs for icons/sounds | Network waterfall |
| C10 | Shipping emoji-only “temporary” thumbs as final if they mimic brand mascots | Polish gate |

---

## D. Fixture-driven checks

Run against canonical fixtures in `docs/product/fixtures/`.

| ID | Fixture | Expect |
|---|---|---|
| D1 | `wheel-small` | Creates, plays, no leaderboard UI |
| D2 | `wheel-stress` | 100 labels remain operable; abbreviations OK |
| D3 | `pairs-small` / `pairs-identical` | Match logic; identical mode works |
| D4 | `pairs-stress` | 30 pairs layout scales/paginates; playable |
| D5 | `gameshow-medium` | 2/4/6 answer questions; lifelines; game over path |
| D6 | `wordsearch-medium` | Clues, diagonal/reverse seeds stable |
| D7 | `wordsearch-stress` | Long-word / placement failure surfaces in editor |
| D8 | `image-quiz-medium` | Landscape/portrait/square; buzz and no-buzz paths |
| D9 | `image-quiz-stress` | Broken image blocks with repair guidance |
| D10 | `true-false-medium` | Balanced set plays cleanly |
| D11 | `true-false-stress` | Imbalance warning; long statements readable; repeat-until-time |

---

## E. Clean-room sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Workstream 00 | | | Reference pack complete |
| Integration lead | | | Tokens + fixture IDs approved |
| QA (WS11) | | | Checklist executed on wheel slice then full six |

---

## F. How to use on the first wheel vertical slice

1. Run section A1–A3 items that apply to Wheel only; mark others N/A.
2. Run A4.1, A5, A6 for wheel-relevant audio/motion.
3. Confirm B items are not filed as bugs.
4. Run full section C asset/string search.
5. Run D1–D2 fixtures.
6. Fail the slice if any C item fails or if Wheel shows a leaderboard/score.
