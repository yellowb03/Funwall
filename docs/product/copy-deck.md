# Funwall copy deck

Source of truth for user-facing English strings at launch. Implementers should not invent alternate labels for shared shell chrome.

Placeholders use `{name}` syntax.

---

## 1. Product and navigation

| Key | Copy |
|---|---|
| app.name | Funwall |
| nav.myActivities | My Activities |
| nav.trash | Trash |
| nav.settings | Settings |
| nav.create | Create activity |
| nav.signOut | Sign out |
| nav.back | Back |

---

## 2. Login and account

| Key | Copy |
|---|---|
| login.title | Sign in to Funwall |
| login.email | Email |
| login.password | Password |
| login.submit | Sign in |
| login.submitting | Signing in… |
| login.forgot | Forgot password? |
| login.error.invalid | That email or password did not work. Try again. |
| login.error.network | Could not sign in. Check your connection and try again. |
| login.reset.title | Reset password |
| login.reset.help | Enter your email and we will send reset instructions if an account exists. |
| login.reset.submit | Send reset link |
| login.reset.sent | If an account exists for that email, reset instructions are on the way. |

---

## 3. Template names and descriptions

Recommended picker order.

| Key | Name | Description |
|---|---|---|
| template.wheel.name | Spin the wheel | Spin to pick a random item from your list—great for names, topics, or prompts. |
| template.matching-pairs.name | Matching pairs | Flip tiles to find matching or related pairs. |
| template.gameshow-quiz.name | Gameshow quiz | Timed multiple-choice rounds with lives, lifelines, and bonus energy. |
| template.wordsearch.name | Wordsearch | Hide words in a letter grid; players hunt by drag or tap. |
| template.image-quiz.name | Image quiz | Reveal a picture tile by tile, then buzz in to answer. |
| template.true-false.name | True or false | Decide whether each statement is true or false before time runs out. |

Short labels (cards, filters):

| Key | Copy |
|---|---|
| template.wheel.short | Wheel |
| template.matching-pairs.short | Matching pairs |
| template.gameshow-quiz.short | Gameshow |
| template.wordsearch.short | Wordsearch |
| template.image-quiz.short | Image quiz |
| template.true-false.short | True or false |

---

## 4. My Activities

| Key | Copy |
|---|---|
| activities.title | My Activities |
| activities.search.placeholder | Search activities |
| activities.sort.updated | Last updated |
| activities.sort.created | Date created |
| activities.sort.title | Title |
| activities.sort.plays | Most played |
| activities.filter.template | Template |
| activities.filter.folder | Folder |
| activities.filter.all | All |
| activities.filter.clear | Clear filters |
| activities.empty.title | Create your first activity |
| activities.empty.body | Pick a template, add your content, and you will be ready to play in about a minute. |
| activities.empty.cta | Create your first activity |
| activities.search.empty | No activities match “{query}”. |
| activities.search.clear | Clear search |
| activities.filter.empty | No activities match these filters. |
| activities.card.updated | Updated {date} |
| activities.card.plays | {count} plays |
| activities.menu.play | Play |
| activities.menu.edit | Edit content |
| activities.menu.duplicate | Duplicate |
| activities.menu.rename | Rename |
| activities.menu.move | Move to folder |
| activities.menu.share | Share |
| activities.menu.delete | Delete |
| activities.renamed | Renamed |
| activities.duplicated | Duplicated as “{title}” |
| activities.deleted | Moved to Trash |
| activities.delete.confirm.title | Delete this activity? |
| activities.delete.confirm.body | “{title}” will move to Trash. You can restore it later. |
| activities.delete.confirm.action | Move to Trash |
| activities.delete.cancel | Cancel |
| activities.duplicate.suffix | copy |
| activities.duplicate.titlePattern | {title} copy |

---

## 5. Trash

| Key | Copy |
|---|---|
| trash.title | Trash |
| trash.empty | Trash is empty. |
| trash.restore | Restore |
| trash.restored | Activity restored |
| trash.deletedOn | Deleted {date} |
| trash.permanent | Delete permanently |
| trash.permanent.confirm.title | Delete permanently? |
| trash.permanent.confirm.body | This cannot be undone. |
| trash.permanent.confirm.action | Delete permanently |

---

## 6. Template picker

| Key | Copy |
|---|---|
| picker.progress.template | Pick a template |
| picker.progress.content | Enter content |
| picker.progress.play | Play |
| picker.search.placeholder | Search templates |
| picker.sort.recommended | Recommended |
| picker.sort.alphabetical | Alphabetical |
| picker.search.empty | No templates match your search. |
| picker.back | Back to My Activities |

---

## 7. Shared editor

| Key | Copy |
|---|---|
| editor.title.label | Activity title |
| editor.title.placeholder | Enter an activity title |
| editor.instruction.add | + Instruction |
| editor.instruction.label | Instruction |
| editor.instruction.placeholder | Optional instructions for players |
| editor.done | Done |
| editor.add.item | Add an item |
| editor.add.pair | Add a pair |
| editor.add.question | Add a question |
| editor.add.word | Add a word |
| editor.add.statement | Add a statement |
| editor.row.duplicate | Duplicate |
| editor.row.delete | Delete |
| editor.row.reorder | Drag to reorder |
| editor.image.add | Add image |
| editor.image.replace | Replace image |
| editor.image.remove | Remove image |
| editor.audio.add | Add audio |
| editor.audio.remove | Remove audio |
| editor.bulk.paste | Paste list |
| editor.bulk.help.wheel | One item per line |
| editor.bulk.help.pairs | One pair per line, left and right separated by a tab |
| editor.autosave.saving | Saving… |
| editor.autosave.saved | Saved |
| editor.autosave.failed | Save failed |
| editor.autosave.retry | Retry |
| editor.autosave.conflict.title | This activity changed elsewhere |
| editor.autosave.conflict.body | Keep your version or load the newer saved version. Your other version will not be discarded until you choose. |
| editor.autosave.conflict.keepLocal | Keep my version |
| editor.autosave.conflict.useServer | Load saved version |
| editor.validation.summary | Fix {count} issue(s) before continuing. |
| editor.leave.confirm.title | Leave without finishing? |
| editor.leave.confirm.body | Your latest changes are kept as a draft when possible. |
| editor.leave.confirm.action | Leave |
| editor.leave.confirm.stay | Stay |

### Limits helpers

| Key | Copy |
|---|---|
| editor.limits.wheel | 2–100 items. Labels get hard to read above 30. |
| editor.limits.pairs | 2–30 pairs. 6–12 works well for most classes. |
| editor.limits.quiz | 1–100 questions. 2–6 answers each; mark one correct. |
| editor.limits.wordsearch | 2–40 words. 6–16 is a good classroom length. |
| editor.limits.imageQuiz | 1–100 questions. Each needs a reveal image and 2–6 answers. |
| editor.limits.trueFalse | 2–200 statements. Each must be marked true or false. |
| editor.warn.wheel.many | You have more than 30 items. Consider shortening labels. |
| editor.warn.trueFalse.imbalance | This set is mostly {dominant}. Players may learn the pattern. |

---

## 8. Validation errors

| Key | Copy |
|---|---|
| val.title.required | Add an activity title. |
| val.wheel.minItems | Add at least 2 items. |
| val.wheel.itemEmpty | This item needs text or an image. |
| val.pairs.min | Add at least 2 complete pairs. |
| val.pairs.sideEmpty | Each side needs text or an image. |
| val.quiz.minQuestions | Add at least 1 question. |
| val.quiz.answersRange | Each question needs 2 to 6 answers. |
| val.quiz.correctRequired | Mark one correct answer. |
| val.quiz.promptEmpty | Add question text or an image. |
| val.wordsearch.min | Add at least 2 words. |
| val.wordsearch.duplicate | “{word}” matches another word after normalization. |
| val.wordsearch.charset | “{word}” has characters this grid cannot use. |
| val.wordsearch.tooLong | “{word}” is too long for the grid. |
| val.wordsearch.placement | Could not place every word. Try shorter words or turn on more directions: {words}. |
| val.imageQuiz.revealRequired | Add a reveal image for this question. |
| val.imageQuiz.answers | Each question needs 2 to 6 answers and one correct answer. |
| val.trueFalse.min | Add at least 2 statements. |
| val.trueFalse.truthRequired | Choose True or False for this statement. |
| val.trueFalse.statementEmpty | Add statement text or an image. |
| val.image.altRequired | Describe this image for accessibility. |
| val.generic | Check the highlighted fields. |

---

## 9. Media modal

| Key | Copy |
|---|---|
| media.title | Add image |
| media.tab.search | Search |
| media.tab.upload | Upload |
| media.tab.library | My images |
| media.search.placeholder | Search images |
| media.search.submit | Search |
| media.search.suggested | Suggested: {query} |
| media.search.loading | Searching… |
| media.search.empty | No images found. Try another search. |
| media.search.rateLimit | Too many searches. Try again in a moment, or upload your own image. |
| media.search.error | Image search is unavailable right now. Try upload or My images. |
| media.attribution | {creator} · {license} |
| media.upload.help | JPEG, PNG, or WebP up to 10 MB. |
| media.upload.drop | Drop an image here or browse |
| media.upload.browse | Browse files |
| media.upload.uploading | Uploading… |
| media.upload.reject.type | Use JPEG, PNG, or WebP. |
| media.upload.reject.size | Images must be 10 MB or smaller. |
| media.upload.reject.generic | That file could not be uploaded. |
| media.library.empty | No saved images yet. Search or upload to build your library. |
| media.crop.contain | Contain |
| media.crop.cover | Cover |
| media.crop.alt | Alt text |
| media.crop.alt.placeholder | Describe what is in the image |
| media.use | Use image |
| media.cancel | Cancel |
| media.close | Close |

---

## 10. Owner activity page

| Key | Copy |
|---|---|
| activity.play | Play |
| activity.edit | Edit content |
| activity.duplicate | Duplicate |
| activity.share | Share |
| activity.results | Results |
| activity.switchTemplate | Switch template |
| activity.visualStyle | Visual style |
| activity.options | Options |
| activity.apply | Apply to this activity |
| activity.apply.defaults | Save as my default |
| activity.reset.personal | Revert to my default |
| activity.reset.template | Revert to template default |
| activity.share.title | Share link |
| activity.share.copy | Copy link |
| activity.share.copied | Link copied |
| activity.share.regenerate | Reset link |
| activity.share.regenerate.confirm.title | Reset public link? |
| activity.share.regenerate.confirm.body | The old link will stop working. |
| activity.share.regenerate.confirm.action | Reset link |
| activity.share.disable | Disable link |
| activity.share.disabled | Public link disabled |
| activity.conversion.preview | Preview conversion |
| activity.conversion.confirm | Create converted activity |
| activity.conversion.replace | Replace current template |
| activity.conversion.blocked | This content cannot become {template} without more information. |
| activity.conversion.reviewable | Review what will change before converting. |
| activity.notFound | Activity not found. |

### Settings labels (common)

| Key | Copy |
|---|---|
| settings.timer | Timer |
| settings.timer.none | None |
| settings.timer.countUp | Count up |
| settings.timer.countDown | Count down |
| settings.lives | Lives |
| settings.lives.unlimited | Unlimited |
| settings.shuffle | Shuffle order |
| settings.reviewAnswers | Show answers at end |
| settings.sound | Sound |
| settings.reducedMotion | Reduced motion |

Template-specific option labels should stay short; examples:

| Key | Copy |
|---|---|
| settings.wheel.spinPower | Spin power |
| settings.wheel.spinPower.low | Low |
| settings.wheel.spinPower.high | High |
| settings.wheel.allowEliminate | Allow eliminate |
| settings.wheel.shuffleItems | Shuffle items |
| settings.pairs.numberedBacks | Numbered tile backs |
| settings.pairs.removeMatched | Remove matched tiles |
| settings.pairs.autoProceed | Auto-proceed after match |
| settings.pairs.layout | Layout |
| settings.pairs.layout.mixed | Mixed |
| settings.pairs.layout.separated | Separated |
| settings.gameshow.seconds | Seconds per question |
| settings.gameshow.bonusEvery | Bonus every N questions |
| settings.gameshow.lifeline5050 | 50:50 |
| settings.gameshow.lifelineX2 | x2 score |
| settings.gameshow.lifelineTime | Extra time |
| settings.gameshow.lifelineReveal | Reveal answer |
| settings.wordsearch.diagonal | Allow diagonal |
| settings.wordsearch.reverse | Allow reverse |
| settings.wordsearch.showList | Show word list |
| settings.wordsearch.selectionMode | Selection mode |
| settings.wordsearch.selection.drag | Drag full word |
| settings.wordsearch.selection.tapFirst | Tap first letter |
| settings.wordsearch.selection.tapAny | Tap any letter |
| settings.imageQuiz.revealDuration | Reveal duration |
| settings.imageQuiz.layout.together | Image and answers together |
| settings.imageQuiz.layout.separate | Image then answers |
| settings.trueFalse.speed | Speed |
| settings.trueFalse.repeatUntilTime | Repeat until time runs out |

---

## 11. Public player shell

| Key | Copy |
|---|---|
| player.loading | Loading activity… |
| player.play | Play |
| player.resume | Resume |
| player.pause | Pause |
| player.restart | Restart |
| player.exit | Exit |
| player.sound.on | Sound on |
| player.sound.off | Sound off |
| player.fullscreen | Fullscreen |
| player.fullscreen.exit | Exit fullscreen |
| player.restart.confirm.title | Restart this attempt? |
| player.restart.confirm.body | Your current progress will be lost. |
| player.exit.confirm.title | Leave this game? |
| player.exit.confirm.body | Your current attempt will end. |
| player.invalid | This activity is unavailable. |
| player.disabled | This play link is turned off. |
| player.error.fatal | Something went wrong. You can restart. Reference: {id} |
| player.hud.score | Score |
| player.hud.lives | Lives |
| player.hud.time | Time |
| player.hud.progress | {current} of {total} |

---

## 12. Player instructions (intro one-liners)

| Key | Copy |
|---|---|
| play.wheel.intro | Press Spin and see where the wheel lands. |
| play.pairs.intro | Flip two tiles at a time to find every pair. |
| play.gameshow.intro | Answer each question before time runs out. Use lifelines wisely. |
| play.wordsearch.intro | Find every hidden word in the grid. |
| play.imageQuiz.intro | Watch the image appear, buzz in, then choose your answer. |
| play.trueFalse.intro | Choose True or False for each statement. |

### In-run prompts

| Key | Copy |
|---|---|
| play.wheel.spin | Spin |
| play.wheel.spinAgain | Spin again |
| play.wheel.eliminate | Eliminate |
| play.wheel.resume | Resume |
| play.wheel.complete | Only one item left. Reset to play again. |
| play.wheel.reset | Reset wheel |
| play.pairs.attempts | Attempts: {count} |
| play.gameshow.lifeline.5050 | 50:50 |
| play.gameshow.lifeline.x2 | x2 |
| play.gameshow.lifeline.time | +Time |
| play.gameshow.lifeline.reveal | Reveal |
| play.gameshow.bonus | Bonus round! |
| play.gameshow.timeout | Time’s up |
| play.wordsearch.found | Found: {word} |
| play.wordsearch.wordsLeft | {count} words left |
| play.imageQuiz.buzzer | Buzzer |
| play.imageQuiz.buzzHint | Press Buzzer or Space when you know it |
| play.trueFalse.true | True |
| play.trueFalse.false | False |
| play.feedback.correct | Correct |
| play.feedback.incorrect | Incorrect |
| play.feedback.miss | Not a match |
| play.feedback.match | Match! |
| play.complete.title | Nice work! |
| play.gameover.title | Game over |
| play.continue | Continue |

---

## 13. Results and leaderboard

| Key | Copy |
|---|---|
| result.completed | Completed |
| result.gameOver | Game over |
| result.abandoned | Attempt ended |
| result.score | Score |
| result.accuracy | Accuracy |
| result.correct | Correct |
| result.incorrect | Incorrect |
| result.unanswered | Unanswered |
| result.duration | Time |
| result.attempts | Attempts |
| result.pairsFound | Pairs found |
| result.wordsFound | Words found |
| result.review | Review answers |
| result.hideReview | Hide review |
| result.playAgain | Play again |
| result.yourAnswer | Your answer |
| result.correctAnswer | Correct answer |
| result.skipped | Skipped |
| result.wheel.summary | Items selected this session |
| result.wheel.noLeaderboard | This activity has no score or leaderboard. |
| result.name.label | Display name |
| result.name.placeholder | Enter a name for the board |
| result.name.submit | Submit score |
| result.name.thanks | You are on the board! |
| result.name.error | Enter a name between 1 and 24 characters. |
| result.name.network | Could not submit. Try again. |
| leaderboard.title | Leaderboard |
| leaderboard.empty | Be the first on the board. |
| leaderboard.you | You |
| owner.results.title | Results |
| owner.results.empty | No plays yet. Share the link to get started. |
| owner.results.attempts | Attempts |
| owner.results.score | Score |
| owner.results.when | When |

---

## 14. Settings page

| Key | Copy |
|---|---|
| settings.title | Settings |
| settings.account | Account |
| settings.preferences | Preferences |
| settings.sound.default | Default sound on |
| settings.motion.default | Prefer reduced motion |
| settings.templateDefaults | Template defaults |
| settings.save | Save changes |
| settings.saved | Settings saved |

---

## 15. Generic system

| Key | Copy |
|---|---|
| action.cancel | Cancel |
| action.close | Close |
| action.confirm | Confirm |
| action.retry | Retry |
| action.apply | Apply |
| error.network | Network problem. Try again. |
| error.unknown | Something went wrong. |
| error.unauthorized | Sign in to continue. |
| error.forbidden | You do not have access. |
| error.notFound | We could not find that. |
| error.validation | Check your input and try again. |

---

## 16. Tone guidelines

- Friendly, concise, classroom-safe.
- Prefer “activity” over “game” in owner chrome; “play” is fine for actions.
- Do not use Wordwall’s name in UI.
- Errors explain how to fix; never dump stack traces or provider payloads.
- Avoid shame language on incorrect answers (“Not quite” optional later; v1 uses “Incorrect”).
