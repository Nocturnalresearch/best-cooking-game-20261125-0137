// Ember Skillet — main.js
// The game loop, the state machine (title -> playing -> results) and all the
// wiring between input, orders, audio and rendering. This is the module
// index.html loads; everything else is imported from here.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, SHIFT_SECONDS, MAX_PLATE_LAYERS, MAX_COMBO,
  MAX_STARS, SCORE_BASE, SCORE_PER_SECOND_LEFT, WRONG_SERVE_PENALTY,
  COINS_PER_SERVE, LAYOUT,
} from './config.js';
import {
  createOrderQueue, spawnOrder, updateOrders, findMatchingTicket,
  makeTicket,
} from './orders.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { createSoundBank } from './audio.js';
import { applyShot } from './shots.js';

const BEST_KEY = 'ember-skillet-best';

function loadBestScore() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch (err) {
    return 0; // localStorage unavailable: the game still plays.
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch (err) {
    // Best score is a nicety; losing it never breaks a shift.
  }
}

function createGame() {
  return {
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 1,
    bestCombo: 1,
    stars: MAX_STARS,
    served: 0,
    wrongServes: 0,
    expired: 0,
    plate: [],
    orders: createOrderQueue(),
    particles: [],
    popups: [],
    hover: null,
    highlightTicketId: null,
    results: null,
    endReason: 'time',
    bestScore: loadBestScore(),
    flash: 0,
    shake: 0,
    lastTickSecond: -1,
    emberTimer: 0,
    muted: false,
  };
}

// ---------------------------------------------------------------- actions

function addPopup(game, text, x, y, color) {
  game.popups.push({ text, x, y, color, age: 0, life: 1.0 });
  if (game.popups.length > 8) game.popups.shift();
}

function spawnSizzle(game) {
  const plate = LAYOUT.plate;
  for (let i = 0; i < 14; i++) {
    game.particles.push({
      x: plate.cx + (Math.random() - 0.5) * 260,
      y: plate.baseY - 40 - Math.random() * 30,
      vx: (Math.random() - 0.5) * 24,
      vy: -30 - Math.random() * 50,
      size: 2 + Math.random() * 3.5,
      color: Math.random() < 0.5 ? '#e8e4da' : '#c9c2b2',
      alpha: 0.85,
      age: 0,
      life: 0.7 + Math.random() * 0.5,
    });
  }
}

function startGame(game, sounds) {
  game.screen = 'playing';
  game.timeLeft = SHIFT_SECONDS;
  game.score = 0;
  game.coins = 0;
  game.combo = 1;
  game.bestCombo = 1;
  game.stars = MAX_STARS;
  game.served = 0;
  game.wrongServes = 0;
  game.expired = 0;
  game.plate = [];
  game.orders = createOrderQueue();
  game.particles = [];
  game.popups = [];
  game.highlightTicketId = null;
  game.results = null;
  game.flash = 0;
  game.shake = 0;
  game.lastTickSecond = -1;
  // Two tickets on the board from the first second, the third follows soon.
  spawnOrder(game.orders);
  spawnOrder(game.orders);
  game.orders.spawnIn = 6;
  sounds.resume();
  sounds.start();
}

function addIngredient(game, sounds, ingredientId) {
  if (game.screen !== 'playing') return;
  if (game.plate.length >= MAX_PLATE_LAYERS) return;
  game.plate.push(ingredientId);
  sounds.add(ingredientId);
  if (ingredientId === 'patty') {
    spawnSizzle(game);
    sounds.sizzle();
  }
}

function clearPlate(game, sounds) {
  if (game.screen !== 'playing') return;
  if (game.plate.length === 0) return;
  game.plate = [];
  sounds.click();
}

function serve(game, sounds) {
  if (game.screen !== 'playing') return;
  if (game.plate.length === 0) return;
  const ticket = findMatchingTicket(game.orders, game.plate);
  const plate = LAYOUT.plate;
  if (ticket) {
    const secondsLeft = Math.ceil(ticket.timeLeft);
    const points = (SCORE_BASE + SCORE_PER_SECOND_LEFT * secondsLeft) * game.combo;
    game.score += points;
    game.coins += COINS_PER_SERVE + ticket.dish.recipe.length;
    game.served += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    game.combo = Math.min(game.combo + 1, MAX_COMBO);
    addPopup(game, '+' + points, plate.cx, plate.baseY - 190, '#7ee787');
    addPopup(game, ticket.dish.name + ' served!', plate.cx, plate.baseY - 230, '#ffe9c4');
    game.orders.slots[game.orders.slots.indexOf(ticket)] = null;
    game.plate = [];
    sounds.bell();
    sounds.serveGood();
  } else {
    game.wrongServes += 1;
    game.score = Math.max(0, game.score - WRONG_SERVE_PENALTY);
    game.combo = 1;
    game.plate = [];
    game.flash = 0.35;
    game.shake = 7;
    addPopup(game, 'WRONG ORDER  -' + WRONG_SERVE_PENALTY, plate.cx, plate.baseY - 190, '#ff7b7b');
    sounds.serveBad();
  }
}

function endShift(game, sounds, reason) {
  game.screen = 'results';
  game.endReason = reason;
  const attempts = game.served + game.wrongServes + game.expired;
  const accuracy = attempts === 0 ? 100 : Math.round((game.served / attempts) * 100);
  game.results = {
    score: game.score,
    served: game.served,
    bestCombo: game.bestCombo,
    coins: game.coins,
    accuracy,
  };
  if (game.score > game.bestScore) {
    game.bestScore = game.score;
    saveBestScore(game.score);
  }
  sounds.gameOver();
}

function onTicketExpired(game, sounds, ticket) {
  game.expired += 1;
  game.combo = 1;
  game.stars -= 1;
  game.flash = 0.22;
  addPopup(game, ticket.dish.name + ' burned!', 640, 250, '#ff9a7b');
  sounds.expire();
  if (game.stars <= 0) endShift(game, sounds, 'stars');
}

// ---------------------------------------------------------------- update

function update(game, sounds, dt) {
  // Particles and popups animate on every screen.
  for (const p of game.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 12 * dt;
  }
  game.particles = game.particles.filter((p) => p.age < p.life);
  for (const pop of game.popups) pop.age += dt;
  game.popups = game.popups.filter((pop) => pop.age < pop.life);
  if (game.flash > 0) game.flash = Math.max(0, game.flash - dt * 1.4);
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 26);

  if (game.screen !== 'playing') return;

  // Ambient embers rising off the grill strip.
  game.emberTimer -= dt;
  if (game.emberTimer <= 0) {
    game.emberTimer = 0.35;
    game.particles.push({
      x: 60 + Math.random() * 1160,
      y: 244,
      vx: (Math.random() - 0.5) * 8,
      vy: -22 - Math.random() * 18,
      size: 1.5 + Math.random() * 2,
      color: '#ff9a2e',
      alpha: 0.8,
      age: 0,
      life: 0.9,
    });
  }

  game.timeLeft -= dt;
  const whole = Math.ceil(game.timeLeft);
  if (game.timeLeft <= 10 && whole !== game.lastTickSecond && game.timeLeft > 0) {
    game.lastTickSecond = whole;
    sounds.tick();
  }
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    endShift(game, sounds, 'time');
    return;
  }
  updateOrders(game.orders, dt, (ticket) => onTicketExpired(game, sounds, ticket));
}

// ---------------------------------------------------------------- self-test
// ?selftest=1 plays one scripted serve in-page and reports PASS/FAIL in the
// document title and in the #selftest node, for automated verification.

function runSelfTest(game, sounds) {
  let reason = '';
  try {
    startGame(game, sounds);
    // Clear the randomly spawned tickets so the scripted serve is exact.
    game.orders.slots = [null, null, null];
    game.orders.slots[0] = makeTicket(game.orders, 'classic-ember', 40);
    const before = game.score;
    addIngredient(game, sounds, 'bun-bottom');
    addIngredient(game, sounds, 'patty');
    addIngredient(game, sounds, 'lettuce');
    addIngredient(game, sounds, 'bun-top');
    serve(game, sounds);
    if (game.served !== 1) reason = 'served=' + game.served;
    else if (game.score <= before) reason = 'score did not rise';
    else if (game.plate.length !== 0) reason = 'plate not cleared after serve';
  } catch (err) {
    reason = 'exception: ' + (err && err.message ? err.message : String(err));
  }
  const text = reason === ''
    ? 'SELFTEST PASS score=' + game.score
    : 'SELFTEST FAIL ' + reason;
  document.title = text;
  const node = document.getElementById('selftest');
  if (node) node.textContent = text;
}

// ---------------------------------------------------------------- boot

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const game = createGame();
  const sounds = createSoundBank();

  const actions = {
    startGame: () => startGame(game, sounds),
    addIngredient: (id) => addIngredient(game, sounds, id),
    serve: () => serve(game, sounds),
    clearPlate: () => clearPlate(game, sounds),
    restart: () => startGame(game, sounds),
    toggleMute: () => {
      sounds.muted = !sounds.muted;
      game.muted = sounds.muted;
    },
  };
  attachInput(canvas, game, actions);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot && applyShot(game, shot)) {
    // Staged screenshot state: no self-test, just render the scene.
  } else if (params.get('selftest') === '1') {
    runSelfTest(game, sounds);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    update(game, sounds, dt);
    drawGame(ctx, game, now);
    requestAnimationFrame(frame);
  }
  // One synchronous first paint, so a screenshot never catches a blank frame.
  drawGame(ctx, game, performance.now());
  requestAnimationFrame(frame);
}

boot();
