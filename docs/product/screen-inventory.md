# Funwall screen and state inventory

Viewport review targets: **1440×900**, **1024×768**, **390×844**.

Conventions:

- **Primary** — default submit / forward action
- **Secondary** — supporting navigation or alternate path
- **Destructive** — irreversible or soft-delete actions
- **Empty / Error** — explicit UI when no data or failure
- **Responsive** — how layout collapses

Domain persistence details that are still provisional are marked **[contract-open]**; implementers should follow `CONTRACTS.md` and escalate to Workstream 13 rather than inventing backend behavior.

---

## 1. Login (`/login`)

### Purpose
Owner sign-in and password reset entry. Only authenticated owners reach dashboard/editor chrome.

### Layout
Centered white surface card on canvas. Funwall wordmark/title, email, password, primary Sign in. Link row: Forgot password. No public play entry required here (players arrive via `/play/[slug]`).

### States

| State | Behavior |
|---|---|
| Default | Empty fields, Sign in enabled only when email+password non-empty (or always enabled with client validation on submit) |
| Submitting | Button shows loading, fields disabled |
| Invalid credentials | Inline error under form; password cleared or retained per auth provider policy **[contract-open]** |
| Network error | Recoverable banner: “Could not sign in. Check your connection and try again.” |
| Password reset request | Email-only form; success is confirmation message without revealing whether email exists |
| Already signed in | Redirect to `/activities` |

### Actions
| Kind | Actions |
|---|---|
| Primary | Sign in |
| Secondary | Forgot password, (optional) magic link if product enables it later — out of v1 scope unless foundation adds it |
| Destructive | None |

### Responsive
Single column; card max-width ~400px; full-bleed padding 16px on phone.

### A11y
Labeled inputs, error linked via `aria-describedby`, focus on first error field after failed submit.

---

## 2. My Activities (`/activities`)

### Purpose
Default owner home: find, open, organize, create activities.

### Card content
Thumbnail (template illustration), title, template label, updated date, folder name, play count.

### 2.1 Populated

| Element | Detail |
|---|---|
| Header | “My Activities”, search field, filter (template, folder), sort (updated / created / title / most played), Create activity |
| Grid | Cards, most recently updated by default |
| Card primary click | Open owner activity page `/activities/[id]` |
| Overflow menu | Play, Edit content, Duplicate, Rename, Move to folder, Share, Delete |

**Actions**
| Kind | Actions |
|---|---|
| Primary | Create activity → `/activities/new` |
| Secondary | Search, filter, sort, open card, overflow items |
| Destructive | Delete (soft → Trash) |

**Responsive**
- Desktop: 3–4 card columns
- Tablet: 2 columns
- Phone: 1 column; filters collapse into a bottom sheet or expandable filter row; Create stays sticky or header-right

### 2.2 Empty (no activities)

| Element | Detail |
|---|---|
| Headline | Create your first activity |
| Body | Short helper from copy deck |
| Content | Six compact template cards (recommended order) + primary CTA |

**Actions:** Create your first activity; each compact template card → editor for that template.

### 2.3 Searching

| State | Behavior |
|---|---|
| Typing | Debounced filter of title + normalized content |
| Results | Matching cards only; result count meta |
| No matches | Empty search state: “No activities match…” + clear search |

### 2.4 Filtered

Template and/or folder chips active; clear filters control; empty filtered state distinct from global empty.

### 2.5 Trash (`/trash`)

List soft-deleted activities with deleted date.

| Kind | Actions |
|---|---|
| Primary | Restore |
| Secondary | Open read-only summary if allowed **[contract-open]** |
| Destructive | Permanent delete (if v1 includes it; otherwise retention-only cleanup job) |

Empty trash: “Trash is empty.”

**Error:** restore failure → toast with retry.

---

## 3. Template picker (`/activities/new`)

### Purpose
Select exactly one of six templates. No locked/fake templates.

### Layout
- Progress strip: **Pick a template > Enter content > Play** (step 1 active)
- Search top-right: placeholder “Search templates”
- Sort: Recommended | Alphabetical
- Grid of six cards: pale-blue icon pane + title + one-sentence description

### Recommended order
1. Spin the wheel  
2. Matching pairs  
3. Gameshow quiz  
4. Wordsearch  
5. Image quiz  
6. True or false  

### States

| State | Behavior |
|---|---|
| Default | Six cards visible |
| Search matches | Subset of cards |
| Search empty | “No templates match your search.” Clear search |
| Keyboard focus | Visible focus ring; Enter/Space selects |
| Selecting | Immediate navigation to `/activities/new/[template]` |

### Actions
| Kind | Actions |
|---|---|
| Primary | Select template (card click) |
| Secondary | Search, sort, back to My Activities |
| Destructive | None |

### Responsive
- Desktop: 3 columns  
- Tablet: 2 columns  
- Phone: 1 column; search full width above sort  

### A11y
Cards are buttons or links with accessible name = title + description; focus order left-to-right, top-to-bottom.

---

## 4. Shared editor frame

Routes: `/activities/new/[template]`, `/activities/[id]/edit`

### Chrome (all templates)
- Progress strip: Enter content active
- Template icon + name top-right
- Autosave status left of template name
- Activity title field first
- Optional + Instruction
- Template-specific rows in centered white panel
- Row controls: reorder, duplicate, delete
- Add item/question/pair/word below rows
- Quiet min/max helper text
- Sticky blue **Done**

### Autosave states
`clean` → `dirty` → `saving` → `saved` | `error` | `conflict`

| State | UI |
|---|---|
| clean | No status or quiet “Saved” |
| dirty | Subtle “Unsaved changes” optional; usually silent until debounce |
| saving | “Saving…” |
| saved | “Saved” |
| error | “Save failed” + Retry; local edits retained |
| conflict | Dialog: keep local vs server **[contract-open exact copy resolution]** |

### Shared Done behavior
Flush draft → playable validation → finalize → navigate to owner activity page. Failures keep owner on editor with summary near Done.

### Shared error/empty patterns
- Blank draft: title placeholder, zero or one empty starter row per template rules
- Partially valid: Done disabled or blocked with summary
- Valid: Done enabled
- Row error: inline message on row
- Network: autosave error; Done may still attempt flush

### Responsive
- Desktop: centered editor max-width ~720–800px  
- Phone: full width; row controls collapse into overflow menu; Done sticky bottom  

---

## 5. Six editor layouts

### 5.1 Spin the wheel (`list` family)

| Area | Spec |
|---|---|
| Fields | Title; optional instruction; ordered items (text / image / both; optional audio) |
| Limits | 2–100 items; warn above 30 |
| Add | Add item; bulk-paste (one per line) |
| States | blank (0–1 empty item), partial (<2 non-empty), valid (≥2), row empty error on Done, autosaving, save error, label stress (many short labels) |

**Primary:** Done  
**Secondary:** Add item, bulk paste, image, reorder  
**Destructive:** Delete item  

### 5.2 Matching pairs (`pairs`)

| Area | Spec |
|---|---|
| Mode | Identical pairs | Related/different pairs |
| Fields | Left/right rich content; identical mode mirrors at play |
| Limits | 2–30 pairs; guide 6–12 |
| Add | Add pair; bulk TSV left/right |

**States:** blank, one incomplete side, valid (≥2 complete), row error, autosaving, save error.

### 5.3 Gameshow quiz (`quiz`)

| Area | Spec |
|---|---|
| Fields | Question prompt; 2–6 answers; exactly one correct |
| Limits | 1–100 questions; recommend ≥5 |
| Add | Add question; per-question add answer up to 6 |

**States:** blank, missing correct, <2 answers, valid, row error, autosaving, save error, shuffle preview (does not mutate save order).

### 5.4 Wordsearch (`wordsearch`)

| Area | Spec |
|---|---|
| Mode | Words only | Words + clues |
| Fields | Display word; normalized grid value; optional clue |
| Limits | 2–40; recommend 6–16 |
| Validation | Unsupported characters, duplicate normalized values, impossible length, placement failure listing problematic words |

**States:** blank, partial, valid, placement error, accent/non-Latin policy note, autosaving, save error.

### 5.5 Image quiz (`imageQuiz`)

| Area | Spec |
|---|---|
| Fields | Optional prompt; **required** reveal image; 2–6 answers; one correct; optional answer images |
| Limits | 1–100 questions |

**States:** blank, missing reveal image, valid, broken image warning, crop preview, autosaving, save error.

### 5.6 True or false (`statements`)

| Area | Spec |
|---|---|
| Fields | Statement rich content + explicit True/False value |
| Limits | 2–200 statements |
| UX | Optional visual grouping True/False; storage is ordered list; imbalance warning (non-blocking) |

**States:** blank, partial, valid, imbalance warning, long statement layout, autosaving, save error.

---

## 6. Media modal

Opened from any image affordance with a precise field target.

### Tabs
**Search** (default) | **Upload** | **My images**

### Shared chrome
Modal title “Add image”, Close, optional field context label. Focus trap; restore focus to opener on close.

### 6.1 Search

| State | UI |
|---|---|
| Idle | Suggested query from nearest field text; does not auto-search until confirm |
| Loading | Skeleton grid |
| Results | Dense thumbnail grid + attribution available |
| No results | “No images found…” |
| Rate limited | “Too many searches. Try again in a moment.” + Upload / My images tips |
| Provider error | Recoverable message; do not leak API details |

### 6.2 Confirmation / crop

After selecting a result or upload: Contain | Cover | crop; focal point; editable alt text; **Use image**.

### 6.3 Upload

| State | UI |
|---|---|
| Idle | Dropzone + file picker |
| Uploading | Progress |
| Rejected | Type/size/MIME errors from copy deck |
| Success | Proceed to crop/confirm |

Accept: JPEG, PNG, WebP; max 10 MB. SVG rejected in v1.

### 6.4 My images

Owner library grid; empty library state; soft-deleted assets not shown.

### Actions
| Kind | Actions |
|---|---|
| Primary | Use image |
| Secondary | Search, tab switch, cancel/close |
| Destructive | Remove from field (on editor, not necessarily in modal) |

### Responsive
Full-screen sheet on phone; centered modal max-width ~720px on desktop.

---

## 7. Owner activity page (`/activities/[id]`)

### Purpose
Stage + configuration after Done. Play, share, restyle, switch template, view results.

### Layout
- Large **16:9** stage left
- **Switch template** right (desktop); drawer on narrow
- Below stage: title, share, edit content, duplicate, results
- **Visual style** and **Options** panels; preview immediate; persist on **Apply to this activity**

### Sub-states

| State | Behavior |
|---|---|
| Intro | Overlay: template name, title, one-line instruction, large Play |
| Playing | Game in shell; owner chrome still available outside stage if design allows; avoid editing mid-play |
| Settings open | Style/options drawers; Apply / Reset |
| Template switch | Compatibility matrix; blocked / reviewable / safe conversions |
| Result (owner preview) | Local completion inside stage; link to full results |
| Share | Public link copy, regenerate, disable **[contract-open UI for regenerate]** |

### Stage controls
Sound, fullscreen, restart, exit (exit → leave play overlay / confirm abandon if mid-run).

### Actions
| Kind | Actions |
|---|---|
| Primary | Play |
| Secondary | Share, Edit content, Duplicate, Results, Apply settings, Switch template |
| Destructive | Disable link; Delete activity (via menu) |

### Responsive
Stage full width; switch template becomes bottom sheet; actions wrap into overflow menu on phone.

### Error
Activity not found, unauthorized → owner-safe message; public-style 404 if wrong account **[contract-open]**.

---

## 8. Public player

Routes:

- `/play/[publicSlug]` — start
- `/play/[publicSlug]/run/[sessionId]` — active/recoverable
- `/play/[publicSlug]/result/[sessionId]` — result

No owner edit controls. No enumerable internal IDs in UI.

### Lifecycle shell states
`loading → ready → playing → paused → feedback → playing → completed | gameOver → review`

| State | UI |
|---|---|
| Loading | Stage skeleton / progress; no game logic yet |
| Intro / ready | Title, instruction, Play; sound unlock on first gesture |
| Playing | Template stage + HUD (score/lives/timer as applicable; **no score for Wheel**) |
| Feedback | Brief lock; correct/incorrect presentation |
| Paused | Overlay Pause; Resume; optional Restart/Exit |
| Completed | Celebrate; continue to review |
| Game over | Gentle end; continue to review |
| Invalid / disabled link | Generic unavailable message (no existence leak beyond necessary) |
| Fatal error | Restart + diagnostic ID (bounded) |

### Actions
| Kind | Actions |
|---|---|
| Primary | Play / Resume / Continue |
| Secondary | Mute, fullscreen, restart |
| Destructive | Exit/abandon (confirms if mid-session) |

### Responsive
Stage scales; HUD compresses to icon+value; answer buttons stack; min touch 44px.

### A11y
Keyboard play paths; live regions for timer thresholds, correctness, matches, found words, completion; reduced-motion alternatives per template.

---

## 9. Result review and leaderboard

### Scored templates
Matching pairs, Gameshow quiz, Wordsearch, Image quiz, True or false.

### Unscored
**Wheel** — session summary of selected items / eliminated path only; **no leaderboard**, no score.

### Result review (player)

| Element | Detail |
|---|---|
| Headline | Completed / Game over copy |
| Metrics | Score (if any), correct/incorrect/unanswered, accuracy, duration |
| Detail | Template-specific review (questions, pairs, words, statements) |
| Name submit | Optional display name for leaderboard (scored + completed only) |
| Play again | New session |

### Leaderboard

| Element | Detail |
|---|---|
| List | Display name, score, duration, relative time |
| Empty | “Be the first on the board.” |
| Owner view | `/activities/[id]/results` — attempts list + leaderboard; no public PII beyond submitted names |

### Actions
| Kind | Actions |
|---|---|
| Primary | Submit name (when eligible) / Play again |
| Secondary | Review answers toggle, back to intro |
| Destructive | None for player; owner may moderate later (out of v1 unless specified) |

### Error
Submit validation (empty name, too long); network retry; rejected invalid sessions.

### Responsive
Metrics stack; review accordion on phone.

---

## 10. Settings (`/settings`)

Account, defaults, sound, reduced-motion preferences. Per-template default settings reset.

| Kind | Actions |
|---|---|
| Primary | Save preferences |
| Secondary | Reset template defaults |
| Destructive | Sign out; account deletion out of scope unless foundation adds |

---

## 11. Global patterns

### Confirmations (modal)
Delete activity, restore, abandon draft/session, reset public link, replace template (lossy), conversion confirm.

### Toasts
Autosave failed, link copied, restored, duplicated (“… copy”).

### Navigation guard
Dirty editor: confirm leave if local recovery not yet acknowledged **[contract-open exact policy]**.

### Responsive collapse summary

| Chrome | Desktop | Tablet | Phone |
|---|---|---|---|
| Dashboard grid | 3–4 col | 2 col | 1 col |
| Template picker | 3 col | 2 col | 1 col |
| Editor | Centered panel | Centered | Full + sticky Done |
| Owner stage | Stage + side panel | Stage + collapsible | Stage + sheets |
| Media modal | Modal | Modal | Full-screen sheet |
| Player HUD | Horizontal | Compact | Icon row |

---

## 12. Template-specific player notes (inventory)

| Template | Distinct states | Distinct actions |
|---|---|---|
| Wheel | idle, spinning, decelerating, selected | Spin, Resume, Spin again, Eliminate, Reset when one left |
| Matching pairs | oneSelected, checking, matched, mismatch | Flip tile; keyboard grid |
| Gameshow | questionEnter, answering, locked, bonusMaybe | Answer, lifelines 50:50 / x2 / extra time / reveal |
| Wordsearch | selecting, found, miss | Drag/tap modes; keyboard start+direction+length |
| Image quiz | revealing, buzzed, answering | Buzzer (Space), answers |
| True/False | itemEntering, answerWindow, itemLeaving | True, False; reduced-motion stationary card |

---

## 13. Out of inventory (v1 non-goals)

Community library, payments, AI generation, live multiplayer rooms, LMS, social profiles, native apps, additional templates.
