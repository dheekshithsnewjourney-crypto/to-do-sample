# How I built this with AI

This project was built with AI assistance (Claude). This doc shows how I directed it and what I did to make sure the result actually works.

## 1. Starting prompt
> _Paste your real first prompt here, including the assignment text you gave it._

## 2. How I steered it
- Decision: _e.g. "Started with vanilla JS, then asked for a React + TypeScript version once I saw the job needed it."_
- Decision: _e.g. "Asked for the state logic to be a pure reducer so it could be unit tested."_
- Follow-up prompts that changed the output: _list 2-3 real ones._

## 3. What I verified myself
Not trusting a single pass from the AI:
- [ ] Ran `npm test` and read the tests, to check they assert real behaviour and aren't just passing
- [ ] Ran `npm run build` and fixed type errors
- [ ] Manually tested: add, edit, delete, filter, refresh persistence, empty input, very long input
- [ ] Tried to break it: _what did you try?_

## 4. Bugs and problems I found
| Problem | How I found it | How it was fixed |
|---|---|---|
| _real bug 1_ | _e.g. browser console, failing test_ | _prompt or manual fix_ |
| _real bug 2_ | | |

## 5. What I changed by hand
_Anything you edited yourself rather than prompting: styling, copy, logic._

## 6. What I'd do differently
_One or two honest points._

## Takeaways
- Diagnose first, then fix: I list what's wrong before asking the AI to change anything.
- A passing test means nothing if the AI weakened the assertion to get it green, so I read the diffs.
- Summarise progress before continuing a long session, so the AI doesn't drift.
