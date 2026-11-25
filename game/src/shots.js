// Ember Skillet — shots.js
// Staged states for the screenshots (?shot=start|mid|serve|end). Each one
// puts the game into a fixed, attractive state without any user input, so a
// screenshot shows the kitchen at its best. These states are only for
// screenshots; real play never uses them.

import { createOrderQueue, makeTicket } from './orders.js';

// Fill the board with three named tickets at fixed countdowns.
function stageTickets(game, specs) {
  const queue = createOrderQueue();
  for (let i = 0; i < specs.length && i < queue.slots.length; i++) {
    queue.slots[i] = makeTicket(queue, specs[i][0], specs[i][1]);
  }
  queue.spawnIn = 12;
  game.orders = queue;
}

// The shared base for the playing shots: a running shift, kitchen visible.
function stagePlaying(game, timeLeft, score, combo) {
  game.screen = 'playing';
  game.timeLeft = timeLeft;
  game.score = score;
  game.coins = Math.round(score / 12);
  game.combo = combo;
  game.bestCombo = combo;
  game.stars = 3;
  game.served = 2;
  game.wrongServes = 0;
  game.expired = 0;
  game.particles = [];
  game.popups = [];
  game.flash = 0;
  game.shake = 0;
  game.highlightTicketId = null;
}

export function applyShot(game, name) {
  if (name === 'start') {
    // Fresh shift: 3 tickets, empty plate, timer at 3:00, score 0.
    stagePlaying(game, 180, 0, 1);
    game.coins = 0;
    game.served = 0;
    game.plate = [];
    stageTickets(game, [
      ['classic-ember', 44],
      ['cheesy-melt', 38],
      ['garden-stack', 30],
    ]);
    return true;
  }
  if (name === 'mid') {
    // One dish mid-assembly: bun + patty + lettuce, top bun still missing.
    stagePlaying(game, 151, 120, 2);
    game.coins = 14;
    game.plate = ['bun-bottom', 'patty', 'lettuce'];
    stageTickets(game, [
      ['classic-ember', 28],
      ['cheesy-melt', 38],
      ['double-trouble', 42],
    ]);
    game.highlightTicketId = game.orders.slots[0].id;
    return true;
  }
  if (name === 'serve') {
    // A complete Cheesy Melt on the plate, matching ticket ready to ring.
    stagePlaying(game, 107, 340, 3);
    game.coins = 31;
    game.served = 3;
    game.plate = ['bun-bottom', 'patty', 'cheese', 'bun-top'];
    stageTickets(game, [
      ['cheesy-melt', 22],
      ['garden-stack', 36],
      ['double-trouble', 41],
    ]);
    game.highlightTicketId = game.orders.slots[0].id;
    return true;
  }
  if (name === 'end') {
    // Results screen after a finished shift, over the dimmed kitchen.
    game.screen = 'results';
    game.timeLeft = 0;
    game.score = 1240;
    game.coins = 86;
    game.stars = 2;
    game.combo = 1;
    game.bestCombo = 4;
    game.plate = ['bun-bottom', 'patty', 'cheese'];
    game.particles = [];
    game.popups = [];
    game.flash = 0;
    game.shake = 0;
    game.endReason = 'time';
    game.results = { score: 1240, served: 9, bestCombo: 4, coins: 86, accuracy: 82 };
    game.bestScore = 1240;
    stageTickets(game, [
      ['classic-ember', 30],
      ['cheesy-melt', 18],
      ['garden-stack', 40],
    ]);
    return true;
  }
  return false;
}
