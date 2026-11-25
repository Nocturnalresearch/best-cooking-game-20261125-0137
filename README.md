# Ember Skillet

[![best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Nocturnalresearch/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Nocturnalresearch/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A timed burger-assembly cooking game. You run the grill at Ember Skillet: tickets roll in on the order board, you stack buns, patties, lettuce, tomato and cheese on the plate in exactly the right order, then ring the brass bell to serve. Serve fast and the timer bonus stacks with your combo; serve the wrong stack and the plate is cleared, the combo resets and points come off. Let a ticket burn and you lose a star — lose all three and the shift ends early. Four original dishes, a three-minute shift, sizzling patties, floating score popups and a glowing grill, all drawn in code on a 2D canvas with WebAudio beeps for sound.

## How to play

- **Click a bin or press 1–6** to add an ingredient to the plate: 1 Bottom Bun, 2 Beef Patty, 3 Lettuce, 4 Tomato, 5 Cheese, 6 Top Bun.
- **SPACE or click the bell** to serve the plate. The bell glows and the matching ticket gets a green check when the stack is exactly right.
- **Backspace or right-click** clears the plate.
- **M** mutes the sounds. **R** starts a new shift from the results screen.

## Run locally

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests — the game is plain static files under `game/`.
