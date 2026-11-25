// Ember Skillet — render.js
// Every pixel of the game: the kitchen, the top bar, the order board, the
// counter bins, the assembly plate, the serve bell, the title and results
// screens, plus particles and floating score popups.

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, DISHES, INGREDIENTS, LAYOUT,
  MAX_STARS, ingredientById,
} from './config.js';
import { drawIngredient } from './ingredients.js';
import { findMatchingTicket, findPrefixTicket } from './orders.js';

const FONT = "'Trebuchet MS', 'Verdana', sans-serif";

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return m + ':' + String(rest).padStart(2, '0');
}

function formatNumber(n) {
  return Math.round(n).toLocaleString('en-US');
}

function drawStar(ctx, cx, cy, r, filled, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color || COLORS.emberHot;
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- main entry

export function drawGame(ctx, game, now) {
  ctx.save();
  if (game.shake > 0.2) {
    const mag = game.shake;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawBackground(ctx, now);
  drawTopBar(ctx, game, now);
  drawOrderBoard(ctx, game, now);
  drawCounter(ctx, game, now);
  drawPlateArea(ctx, game, now);
  drawParticles(ctx, game);
  drawPopups(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game, now);
  if (game.screen === 'results') drawResults(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = 'rgba(229, 72, 77, ' + (game.flash * 0.9).toFixed(3) + ')';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- background

function drawBackground(ctx, now) {
  // Tiled kitchen wall.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.wallTile;
  const tile = 64;
  for (let row = 0; row < 4; row++) {
    for (let col = -1; col < 21; col++) {
      const off = row % 2 === 0 ? 0 : tile / 2;
      ctx.fillRect(col * tile + off + 2, row * tile + 2, tile - 4, tile - 4);
    }
  }
  // Warm glow from the grill, pulsing gently.
  const glow = 0.10 + 0.04 * Math.sin(now / 700);
  const grad = ctx.createRadialGradient(640, 240, 40, 640, 240, 620);
  grad.addColorStop(0, 'rgba(255, 150, 40, ' + glow.toFixed(3) + ')');
  grad.addColorStop(1, 'rgba(255, 150, 40, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Wooden counter band.
  ctx.fillStyle = COLORS.counterWood;
  ctx.fillRect(0, 212, CANVAS_WIDTH, 200);
  ctx.fillStyle = COLORS.counterWoodDark;
  ctx.fillRect(0, 212, CANVAS_WIDTH, 6);
  ctx.fillRect(0, 406, CANVAS_WIDTH, 6);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 2;
  for (let y = 250; y < 406; y += 38) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  // Darker worktop where the plate sits.
  ctx.fillStyle = COLORS.worktop;
  ctx.fillRect(0, 412, CANVAS_WIDTH, CANVAS_HEIGHT - 412);
  ctx.fillStyle = COLORS.worktopDark;
  ctx.fillRect(0, 412, CANVAS_WIDTH, 6);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
  for (let x = 160; x < CANVAS_WIDTH; x += 320) {
    ctx.beginPath();
    ctx.moveTo(x, 418);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  // Vignette.
  const vig = ctx.createRadialGradient(640, 400, 260, 640, 400, 820);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// ---------------------------------------------------------------- top bar

function drawTopBar(ctx, game, now) {
  const bar = LAYOUT.topBar;
  ctx.fillStyle = COLORS.topBar;
  ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
  ctx.fillStyle = COLORS.topBarEdge;
  ctx.fillRect(bar.x, bar.y + bar.h - 3, bar.w, 3);
  text(ctx, 'EMBER SKILLET', 24, 37, 'bold 30px ' + FONT, COLORS.ember);
  text(ctx, 'DAY 1  •  GRILL & BURGERS', 268, 36, 'bold 13px ' + FONT, COLORS.muted);
  // Shift timer, big and central.
  const low = game.timeLeft <= 30 && game.screen === 'playing';
  const timerColor = low ? COLORS.bad : COLORS.cream;
  const pulse = low ? 1 + 0.06 * Math.sin(now / 120) : 1;
  ctx.save();
  ctx.translate(640, 36);
  ctx.scale(pulse, pulse);
  text(ctx, formatTime(game.timeLeft), 0, 0, 'bold 36px ' + FONT, timerColor, 'center');
  ctx.restore();
  text(ctx, 'SHIFT', 640, 51, 'bold 9px ' + FONT, COLORS.muted, 'center');
  // Score, coins, combo.
  text(ctx, 'SCORE', 800, 22, 'bold 11px ' + FONT, COLORS.muted);
  text(ctx, formatNumber(game.score), 800, 44, 'bold 22px ' + FONT, COLORS.cream);
  text(ctx, 'COINS', 930, 22, 'bold 11px ' + FONT, COLORS.muted);
  text(ctx, formatNumber(game.coins), 930, 44, 'bold 22px ' + FONT, '#ffd76a');
  const comboColor = game.combo > 1 ? COLORS.emberHot : COLORS.muted;
  text(ctx, 'COMBO', 1042, 22, 'bold 11px ' + FONT, COLORS.muted);
  text(ctx, 'x' + game.combo, 1042, 44, 'bold 22px ' + FONT, comboColor);
  // Stars (lives) top-right.
  for (let i = 0; i < MAX_STARS; i++) {
    drawStar(ctx, 1168 + i * 34, 28, 13, i < game.stars);
  }
}

// ---------------------------------------------------------------- order board

function drawOrderBoard(ctx, game, now) {
  text(ctx, 'ORDER BOARD', LAYOUT.boardLabel.x, LAYOUT.boardLabel.y + 8, 'bold 13px ' + FONT, COLORS.muted);
  const ready = game.screen === 'playing' ? findMatchingTicket(game.orders, game.plate) : null;
  const building = game.screen === 'playing' ? findPrefixTicket(game.orders, game.plate) : null;
  for (let i = 0; i < game.orders.slots.length; i++) {
    const ticket = game.orders.slots[i];
    const rect = LAYOUT.ticket(i);
    if (!ticket) {
      // Empty slot: a dashed outline waiting for the next order.
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255, 243, 214, 0.28)';
      ctx.lineWidth = 2;
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.stroke();
      ctx.restore();
      text(ctx, 'next order soon…', rect.x + rect.w / 2, rect.y + 70, 'italic 15px ' + FONT, 'rgba(255, 243, 214, 0.45)', 'center');
      continue;
    }
    drawTicket(ctx, game, ticket, rect, now, ready, building);
  }
}

function drawTicket(ctx, game, ticket, rect, now, ready, building) {
  // Print-in animation: the ticket slides down from the rail as it arrives.
  const age = Math.max(0, (now - ticket.born) / 1000);
  const prog = Math.min(1, age / 0.35);
  const ease = 1 - Math.pow(1 - prog, 3);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.translate(cx, cy);
  ctx.scale(0.85 + 0.15 * ease, 0.85 + 0.15 * ease);
  ctx.translate(-cx, -cy);
  // Shadow + paper.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  rr(ctx, rect.x + 3, rect.y + 5, rect.w, rect.h, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.ticketPaper;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.ticketPaperEdge;
  ctx.lineWidth = 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.stroke();
  // Highlight: green when the plate matches, orange while building it.
  if (ready && ready.id === ticket.id) {
    ctx.strokeStyle = COLORS.good;
    ctx.lineWidth = 4;
    rr(ctx, rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4, 12);
    ctx.stroke();
  } else if ((building && building.id === ticket.id) || game.highlightTicketId === ticket.id) {
    ctx.strokeStyle = COLORS.ember;
    ctx.lineWidth = 3;
    rr(ctx, rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4, 12);
    ctx.stroke();
  }
  // Dish name + ticket number.
  text(ctx, ticket.dish.name.toUpperCase(), rect.x + 16, rect.y + 27, 'bold 19px ' + FONT, COLORS.ticketInk);
  text(ctx, '#' + ticket.id, rect.x + rect.w - 14, rect.y + 25, 'bold 13px ' + FONT, '#a07c46', 'right');
  // Ingredient icons with labels.
  const recipe = ticket.dish.recipe;
  const slotW = (rect.w - 24) / recipe.length;
  for (let k = 0; k < recipe.length; k++) {
    const ing = ingredientById(recipe[k]);
    const ix = rect.x + 12 + slotW * k + slotW / 2;
    drawIngredient(ctx, ing.id, ix, rect.y + 62, 52, 24);
    text(ctx, ing.short, ix, rect.y + 94, '11px ' + FONT, '#7a5a34', 'center');
  }
  // Countdown bar.
  const frac = Math.max(0, ticket.timeLeft / ticket.totalTime);
  const barX = rect.x + 14;
  const barY = rect.y + rect.h - 20;
  const barW = rect.w - 28;
  ctx.fillStyle = '#e0c9a0';
  rr(ctx, barX, barY, barW, 10, 5);
  ctx.fill();
  const barColor = frac > 0.5 ? COLORS.good : frac > 0.25 ? '#e8a13a' : COLORS.bad;
  if (frac > 0) {
    ctx.fillStyle = barColor;
    rr(ctx, barX, barY, Math.max(10, barW * frac), 10, 5);
    ctx.fill();
  }
  if (ticket.timeLeft <= 10) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 130);
    ctx.strokeStyle = 'rgba(229, 72, 77, ' + pulse.toFixed(3) + ')';
    ctx.lineWidth = 2;
    rr(ctx, barX - 2, barY - 2, barW + 4, 14, 6);
    ctx.stroke();
  }
  // Ready check badge.
  if (ready && ready.id === ticket.id) {
    ctx.fillStyle = COLORS.good;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w - 22, rect.y + 52, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w - 29, rect.y + 52);
    ctx.lineTo(rect.x + rect.w - 24, rect.y + 57);
    ctx.lineTo(rect.x + rect.w - 15, rect.y + 46);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- counter

function drawCounter(ctx, game, now) {
  text(ctx, 'THE COUNTER  —  click a bin or press 1–6', LAYOUT.counterLabel.x, LAYOUT.counterLabel.y + 2, 'bold 13px ' + FONT, COLORS.muted);
  // Grill strip with glowing coals behind the bins.
  const grill = LAYOUT.grill;
  ctx.fillStyle = '#2a160c';
  rr(ctx, grill.x, grill.y, grill.w, grill.h, 7);
  ctx.fill();
  for (let i = 0; i < 10; i++) {
    const gx = grill.x + 60 + i * 122;
    const pulse = 0.55 + 0.35 * Math.sin(now / 420 + i * 1.7);
    const grad = ctx.createRadialGradient(gx, grill.y + 7, 1, gx, grill.y + 7, 26);
    grad.addColorStop(0, 'rgba(255, 140, 30, ' + pulse.toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(255, 140, 30, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, grill.y + 7, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < INGREDIENTS.length; i++) {
    drawBin(ctx, game, INGREDIENTS[i], LAYOUT.bin(i), i);
  }
}

function drawBin(ctx, game, ing, rect, index) {
  const hovered = game.hover === 'bin:' + index;
  const lift = hovered ? -4 : 0;
  ctx.save();
  ctx.translate(0, lift);
  // Wooden bin box.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  rr(ctx, rect.x + 3, rect.y + 5, rect.w, rect.h, 12);
  ctx.fill();
  ctx.fillStyle = hovered ? '#b57a44' : '#a06a38';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = hovered ? COLORS.emberHot : '#7a4a22';
  ctx.lineWidth = hovered ? 3 : 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  // Inner tray.
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 56, 8);
  ctx.fill();
  // Ingredient art.
  drawIngredient(ctx, ing.id, rect.x + rect.w / 2, rect.y + 58, 128, 62);
  // Name + hotkey badge.
  text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 132, 'bold 16px ' + FONT, COLORS.cream, 'center');
  ctx.fillStyle = COLORS.brass;
  ctx.beginPath();
  ctx.arc(rect.x + 20, rect.y + 20, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6e4a12';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, ing.key, rect.x + 20, rect.y + 25, 'bold 14px ' + FONT, '#2a1a08', 'center');
  ctx.restore();
}

// ---------------------------------------------------------------- plate area

const LAYER_HEIGHTS = {
  'bun-bottom': 28,
  patty: 30,
  lettuce: 22,
  tomato: 24,
  cheese: 26,
  'bun-top': 46,
};

function drawPlateArea(ctx, game, now) {
  const plate = LAYOUT.plate;
  text(ctx, 'YOUR PLATE', LAYOUT.plateLabel.x, LAYOUT.plateLabel.y, 'bold 14px ' + FONT, COLORS.muted);
  // Plate shadow + plate.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(plate.cx, plate.baseY + 8, 195, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(plate.cx, plate.baseY, 188, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.plateEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#f4f0e6';
  ctx.beginPath();
  ctx.ellipse(plate.cx, plate.baseY - 2, 148, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  // Burger stack, bottom to top.
  if (game.plate.length === 0) {
    text(ctx, 'Stack ingredients here', plate.cx, plate.baseY - 60, 'italic 16px ' + FONT, 'rgba(255, 233, 196, 0.5)', 'center');
  } else {
    let y = plate.baseY - 16;
    const labels = [];
    for (let i = 0; i < game.plate.length; i++) {
      const id = game.plate[i];
      const h = LAYER_HEIGHTS[id] || 26;
      y -= h / 2;
      const w = id === 'patty' ? 336 : id === 'lettuce' ? 344 : 326;
      drawIngredient(ctx, id, plate.cx, y, w, h);
      labels.push({ name: ingredientById(id).name, y });
      y -= h / 2;
    }
    // Layer names beside the stack (left side, clear of the serve button).
    for (const label of labels) {
      text(ctx, label.name, plate.cx - 208, label.y + 5, '13px ' + FONT, COLORS.cream, 'right');
    }
  }
  drawServeBell(ctx, game, now);
  drawClearButton(ctx, game);
  text(ctx, '1–6 add  •  SPACE serve  •  BKSP clear  •  right-click clear  •  M mute', LAYOUT.hint.x, LAYOUT.hint.y, '13px ' + FONT, COLORS.muted, 'center');
}

function drawServeBell(ctx, game, now) {
  const bell = LAYOUT.bell;
  const ready = game.screen === 'playing' && findMatchingTicket(game.orders, game.plate) !== null;
  // Glow when the plate matches a ticket.
  if (ready) {
    const pulse = 0.5 + 0.3 * Math.sin(now / 240);
    const grad = ctx.createRadialGradient(bell.cx, bell.cy, 10, bell.cx, bell.cy, bell.r + 50);
    grad.addColorStop(0, 'rgba(255, 207, 92, ' + pulse.toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(255, 207, 92, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bell.cx, bell.cy, bell.r + 50, 0, Math.PI * 2);
    ctx.fill();
  }
  const hovered = game.hover === 'bell';
  const wobble = ready ? Math.sin(now / 120) * 0.03 : 0;
  ctx.save();
  ctx.translate(bell.cx, bell.cy);
  ctx.rotate(wobble);
  ctx.translate(-bell.cx, -bell.cy);
  // Base.
  ctx.fillStyle = '#8a6414';
  ctx.beginPath();
  ctx.ellipse(bell.cx, bell.cy + 58, 96, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dome.
  const domeGrad = ctx.createLinearGradient(bell.cx - 80, bell.cy - 60, bell.cx + 80, bell.cy + 60);
  domeGrad.addColorStop(0, hovered || ready ? '#f2c14e' : '#e0aa3e');
  domeGrad.addColorStop(0.55, COLORS.brass);
  domeGrad.addColorStop(1, COLORS.brassDark);
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(bell.cx, bell.cy + 56, 82, 108, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 35, 5, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Shine.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(bell.cx - 38, bell.cy - 12, 12, 34, 0.35, 0, Math.PI * 2);
  ctx.fill();
  // Button on top.
  ctx.fillStyle = '#6e4a12';
  ctx.beginPath();
  ctx.arc(bell.cx, bell.cy - 54, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffcf5c';
  ctx.beginPath();
  ctx.arc(bell.cx, bell.cy - 54, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, 'SERVE', LAYOUT.bellLabel.x, LAYOUT.bellLabel.y, 'bold 24px ' + FONT, ready ? COLORS.emberHot : COLORS.cream, 'center');
  text(ctx, ready ? 'READY!  ring it!' : '(SPACE)', LAYOUT.bellLabel.x, LAYOUT.bellLabel.y + 24, 'bold 13px ' + FONT, ready ? COLORS.good : COLORS.muted, 'center');
}

function drawClearButton(ctx, game) {
  const btn = LAYOUT.clearButton;
  const hovered = game.hover === 'clear';
  ctx.fillStyle = hovered ? '#a33d40' : '#7c2f32';
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#e8b4b4';
  ctx.lineWidth = 1.5;
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 10);
  ctx.stroke();
  text(ctx, 'CLEAR PLATE', btn.x + btn.w / 2, btn.y + 20, 'bold 15px ' + FONT, '#ffe9e9', 'center');
  text(ctx, '(BKSP)', btn.x + btn.w / 2, btn.y + 38, '11px ' + FONT, '#e8b4b4', 'center');
}

// ---------------------------------------------------------------- particles

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    const age = p.age / p.life;
    if (age >= 1) continue;
    ctx.globalAlpha = (1 - age) * p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - age * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx, game) {
  for (const pop of game.popups) {
    const age = pop.age / pop.life;
    if (age >= 1) continue;
    ctx.globalAlpha = 1 - age * age;
    text(ctx, pop.text, pop.x, pop.y - 46 * age, 'bold 26px ' + FONT, pop.color, 'center');
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- title screen

function drawTitle(ctx, game, now) {
  ctx.fillStyle = 'rgba(16, 8, 4, 0.62)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const panel = LAYOUT.titlePanel;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  rr(ctx, panel.x + 5, panel.y + 7, panel.w, panel.h, 18);
  ctx.fill();
  ctx.fillStyle = '#2a170c';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 18);
  ctx.stroke();
  const cx = panel.x + panel.w / 2;
  text(ctx, 'EMBER SKILLET', cx, panel.y + 92, 'bold 58px ' + FONT, COLORS.ember, 'center');
  text(ctx, 'a burger-rush cooking game', cx, panel.y + 128, 'italic 20px ' + FONT, COLORS.cream, 'center');
  const lines = [
    '1.  Click the bins or press 1–6 to stack ingredients on the plate.',
    '2.  Match a ticket exactly, then ring the bell (SPACE) to serve it.',
    '3.  Serve fast for bonus points — a burnt ticket costs a star.',
  ];
  for (let i = 0; i < lines.length; i++) {
    text(ctx, lines[i], cx, panel.y + 196 + i * 36, '17px ' + FONT, COLORS.cream, 'center');
  }
  // Start button.
  const btn = LAYOUT.startButton;
  const hovered = game.hover === 'start';
  const pulse = 0.85 + 0.15 * Math.sin(now / 300);
  ctx.save();
  ctx.globalAlpha = hovered ? 1 : pulse;
  ctx.fillStyle = hovered ? '#f2c14e' : COLORS.brass;
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#6e4a12';
  ctx.lineWidth = 2;
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 14);
  ctx.stroke();
  text(ctx, 'START SHIFT', btn.x + btn.w / 2, btn.y + 42, 'bold 28px ' + FONT, '#2a1a08', 'center');
  ctx.restore();
  text(ctx, 'or press ENTER', cx, btn.y + 92, '15px ' + FONT, COLORS.muted, 'center');
  if (game.bestScore > 0) {
    text(ctx, 'BEST SCORE: ' + formatNumber(game.bestScore), cx, panel.y + panel.h - 24, 'bold 16px ' + FONT, '#ffd76a', 'center');
  }
  text(ctx, 'Original art drawn in code  •  sounds made with WebAudio', cx, panel.y + panel.h - 52, '12px ' + FONT, COLORS.muted, 'center');
}

// ---------------------------------------------------------------- results

function drawResults(ctx, game) {
  ctx.fillStyle = 'rgba(16, 8, 4, 0.66)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const panel = LAYOUT.resultsPanel;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  rr(ctx, panel.x + 5, panel.y + 7, panel.w, panel.h, 18);
  ctx.fill();
  ctx.fillStyle = '#2a170c';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 18);
  ctx.stroke();
  const cx = panel.x + panel.w / 2;
  const r = game.results || { score: 0, served: 0, bestCombo: 1, coins: 0, accuracy: 0 };
  text(ctx, 'SHIFT OVER', cx, panel.y + 78, 'bold 48px ' + FONT, COLORS.ember, 'center');
  text(ctx, game.endReason === 'stars' ? 'Out of stars — the kitchen burned you out.' : "Time's up — the shift is done.", cx, panel.y + 112, 'italic 17px ' + FONT, COLORS.cream, 'center');
  const rows = [
    ['FINAL SCORE', formatNumber(r.score)],
    ['DISHES SERVED', String(r.served)],
    ['BEST COMBO', 'x' + r.bestCombo],
    ['COINS EARNED', formatNumber(r.coins)],
    ['ACCURACY', r.accuracy + '%'],
  ];
  for (let i = 0; i < rows.length; i++) {
    const y = panel.y + 168 + i * 44;
    text(ctx, rows[i][0], panel.x + 60, y, 'bold 18px ' + FONT, COLORS.muted);
    text(ctx, rows[i][1], panel.x + panel.w - 60, y, 'bold 22px ' + FONT, COLORS.cream, 'right');
  }
  if (game.bestScore > 0) {
    text(ctx, 'BEST SCORE: ' + formatNumber(game.bestScore), cx, panel.y + 412, 'bold 17px ' + FONT, '#ffd76a', 'center');
  }
  text(ctx, 'Press R to play again', cx, panel.y + 462, 'bold 20px ' + FONT, COLORS.emberHot, 'center');
}

// Keep the DISHES import used: dish names also appear on the menu strip.
export function dishNames() {
  return DISHES.map((dish) => dish.name);
}
