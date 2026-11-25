// Ember Skillet — config.js
// Every tunable constant for the game: dishes, ingredients, timings, colours,
// scoring and the on-canvas layout rectangles shared by render and input.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;

export const SHIFT_SECONDS = 180; // a 3:00 shift
export const ORDER_SLOTS = 3; // tickets on the board at once
export const ORDER_SPAWN_SECONDS = 12; // a new ticket every ~12 s while a slot is free
export const ORDER_TIME_SECONDS = 45; // how long a ticket lives before it burns
export const MAX_PLATE_LAYERS = 6;
export const MAX_COMBO = 5;
export const MAX_STARS = 3;

export const SCORE_BASE = 100; // points for a served dish, before the timer bonus
export const SCORE_PER_SECOND_LEFT = 10; // bonus per second left on the ticket
export const WRONG_SERVE_PENALTY = 25;
export const COINS_PER_SERVE = 5; // plus one coin per layer served

// ---------------------------------------------------------------- ingredients

export const INGREDIENTS = [
  { id: 'bun-bottom', name: 'Bottom Bun', short: 'Bun', key: '1' },
  { id: 'patty', name: 'Beef Patty', short: 'Patty', key: '2' },
  { id: 'lettuce', name: 'Lettuce', short: 'Lettuce', key: '3' },
  { id: 'tomato', name: 'Tomato', short: 'Tomato', key: '4' },
  { id: 'cheese', name: 'Cheese', short: 'Cheese', key: '5' },
  { id: 'bun-top', name: 'Top Bun', short: 'Top Bun', key: '6' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id) || null;
}

export function ingredientByKey(key) {
  return INGREDIENTS.find((ing) => ing.key === key) || null;
}

// ---------------------------------------------------------------- dishes
// Each recipe lists ingredients bottom to top, exactly as the plate must hold.

export const DISHES = [
  {
    id: 'classic-ember',
    name: 'Classic Ember',
    recipe: ['bun-bottom', 'patty', 'lettuce', 'bun-top'],
  },
  {
    id: 'cheesy-melt',
    name: 'Cheesy Melt',
    recipe: ['bun-bottom', 'patty', 'cheese', 'bun-top'],
  },
  {
    id: 'garden-stack',
    name: 'Garden Stack',
    recipe: ['bun-bottom', 'lettuce', 'tomato', 'cheese', 'bun-top'],
  },
  {
    id: 'double-trouble',
    name: 'Double Trouble',
    recipe: ['bun-bottom', 'patty', 'patty', 'cheese', 'bun-top'],
  },
];

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id) || null;
}

// ---------------------------------------------------------------- palette

export const COLORS = {
  wall: '#4a2c1c',
  wallTile: '#5a3823',
  wallGrout: '#3c2415',
  topBar: '#1d110a',
  topBarEdge: '#f08c1e',
  counterWood: '#8a5a33',
  counterWoodDark: '#6e4525',
  worktop: '#7a4e2c',
  worktopDark: '#5f3a1f',
  ticketPaper: '#fff3d6',
  ticketPaperEdge: '#d9b06a',
  ticketInk: '#3a2415',
  plate: '#e8e4da',
  plateEdge: '#b9b2a2',
  brass: '#d9a441',
  brassDark: '#a87c22',
  cream: '#ffe9c4',
  ember: '#f08c1e',
  emberHot: '#ffcf5c',
  good: '#58c96b',
  bad: '#e5484d',
  muted: '#c9a37e',
};

// ---------------------------------------------------------------- layout
// Every rectangle the game draws and clicks, in canvas coordinates.

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: CANVAS_WIDTH, h: 56 },
  boardLabel: { x: 24, y: 64 },
  ticket: (i) => ({ x: 24 + i * 416, y: 80, w: 392, h: 128 }),
  counterLabel: { x: 24, y: 222 },
  grill: { x: 24, y: 230, w: 1232, h: 14 },
  bin: (i) => ({ x: 24 + i * 210, y: 252, w: 196, h: 152 }),
  plateLabel: { x: 270, y: 436 },
  plate: { cx: 430, baseY: 736, w: 340 },
  bell: { cx: 962, cy: 606, r: 96 },
  bellLabel: { x: 962, y: 726 },
  clearButton: { x: 648, y: 664, w: 150, h: 48 },
  hint: { x: 640, y: 788 },
  startButton: { x: 490, y: 440, w: 300, h: 64 },
  titlePanel: { x: 290, y: 130, w: 700, h: 500 },
  resultsPanel: { x: 340, y: 120, w: 600, h: 520 },
};

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function pointInCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
