// Ember Skillet — orders.js
// The order board: spawning tickets, ticking their countdowns, expiring them,
// and matching the plate stack against the open tickets.

import { DISHES, ORDER_SLOTS, ORDER_SPAWN_SECONDS, ORDER_TIME_SECONDS, dishById } from './config.js';

// A ticket is { id, dish, timeLeft, totalTime, born }.
// `born` is a millisecond timestamp used for the print-in animation.

export function createOrderQueue() {
  return { slots: new Array(ORDER_SLOTS).fill(null), spawnIn: 5, nextId: 1 };
}

export function makeTicket(queue, dishId, timeLeft) {
  const dish = dishById(dishId);
  const ticket = {
    id: queue.nextId,
    dish,
    timeLeft: timeLeft === undefined ? ORDER_TIME_SECONDS : timeLeft,
    totalTime: ORDER_TIME_SECONDS,
    born: performance.now(),
  };
  queue.nextId += 1;
  return ticket;
}

function randomDishId(excludeId) {
  const pool = DISHES.filter((dish) => dish.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

// Put a fresh ticket in the first free slot, if any. Returns the ticket or null.
export function spawnOrder(queue) {
  const freeIndex = queue.slots.findIndex((slot) => slot === null);
  if (freeIndex === -1) return null;
  const neighbour = queue.slots.find((slot) => slot !== null);
  const ticket = makeTicket(queue, randomDishId(neighbour ? neighbour.dish.id : null));
  queue.slots[freeIndex] = ticket;
  return ticket;
}

// Advance the board clock. Calls onExpire(ticket) for each ticket that burns.
export function updateOrders(queue, dt, onExpire) {
  queue.spawnIn -= dt;
  if (queue.spawnIn <= 0) {
    if (spawnOrder(queue)) queue.spawnIn = ORDER_SPAWN_SECONDS;
    else queue.spawnIn = 2; // board full: check again soon
  }
  for (let i = 0; i < queue.slots.length; i++) {
    const ticket = queue.slots[i];
    if (!ticket) continue;
    ticket.timeLeft -= dt;
    if (ticket.timeLeft <= 0) {
      queue.slots[i] = null;
      if (onExpire) onExpire(ticket);
    }
  }
}

// The oldest open ticket whose recipe equals the plate, bottom to top.
export function findMatchingTicket(queue, plate) {
  let best = null;
  for (const ticket of queue.slots) {
    if (!ticket) continue;
    if (ticketMatchesPlate(ticket, plate)) {
      if (!best || ticket.id < best.id) best = ticket;
    }
  }
  return best;
}

// Does this ticket's recipe equal the plate exactly?
export function ticketMatchesPlate(ticket, plate) {
  const recipe = ticket.dish.recipe;
  if (recipe.length !== plate.length) return false;
  for (let i = 0; i < recipe.length; i++) {
    if (recipe[i] !== plate[i]) return false;
  }
  return true;
}

// Is the plate a correct start of this ticket's recipe (mid-assembly hint)?
export function ticketPrefixMatches(ticket, plate) {
  if (plate.length === 0 || plate.length >= ticket.dish.recipe.length) return false;
  for (let i = 0; i < plate.length; i++) {
    if (ticket.dish.recipe[i] !== plate[i]) return false;
  }
  return true;
}

// The ticket the plate is building towards, if any (for the highlight).
export function findPrefixTicket(queue, plate) {
  for (const ticket of queue.slots) {
    if (ticket && ticketPrefixMatches(ticket, plate)) return ticket;
  }
  return null;
}

export function openTicketCount(queue) {
  return queue.slots.filter((slot) => slot !== null).length;
}
