// Ember Skillet — input.js
// Mouse and keyboard handling. Hit-testing uses the same LAYOUT rectangles
// the renderer draws, so a click always lands where the art shows it.

import { INGREDIENTS, LAYOUT, ingredientByKey, pointInCircle, pointInRect } from './config.js';

// What the pointer is over right now, for hover highlights and the cursor.
export function hitTest(game, px, py) {
  if (game.screen === 'title') {
    if (pointInRect(px, py, LAYOUT.startButton)) return 'start';
    return null;
  }
  if (game.screen === 'results') return null;
  // Playing: bins, serve bell, clear button.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (pointInRect(px, py, LAYOUT.bin(i))) return 'bin:' + i;
  }
  if (pointInCircle(px, py, LAYOUT.bell.cx, LAYOUT.bell.cy, LAYOUT.bell.r)) return 'bell';
  if (pointInRect(px, py, LAYOUT.clearButton)) return 'clear';
  return null;
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

// actions: { startGame, addIngredient, serve, clearPlate, restart, toggleMute }
export function attachInput(canvas, game, actions) {
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(canvas, event);
    game.hover = hitTest(game, p.x, p.y);
    canvas.style.cursor = game.hover ? 'pointer' : 'default';
  });

  canvas.addEventListener('mouseleave', () => {
    game.hover = null;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('click', (event) => {
    const p = canvasPoint(canvas, event);
    const hit = hitTest(game, p.x, p.y);
    if (!hit) return;
    if (hit === 'start') {
      actions.startGame();
      return;
    }
    if (hit.startsWith('bin:')) {
      const index = Number(hit.slice(4));
      actions.addIngredient(INGREDIENTS[index].id);
      return;
    }
    if (hit === 'bell') {
      actions.serve();
      return;
    }
    if (hit === 'clear') {
      actions.clearPlate();
    }
  });

  canvas.addEventListener('contextmenu', (event) => {
    // Right-click clears the plate, as the brief promises.
    if (game.screen === 'playing' && game.plate.length > 0) {
      event.preventDefault();
      actions.clearPlate();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (game.screen === 'title') {
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        actions.startGame();
      }
      return;
    }
    if (game.screen === 'results') {
      if (key === 'r' || key === 'R' || key === 'Enter') {
        actions.restart();
      }
      return;
    }
    // Playing.
    const ingredient = ingredientByKey(key);
    if (ingredient) {
      actions.addIngredient(ingredient.id);
      return;
    }
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      actions.serve();
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      actions.clearPlate();
      return;
    }
    if (key === 'm' || key === 'M') {
      actions.toggleMute();
    }
  });
}
