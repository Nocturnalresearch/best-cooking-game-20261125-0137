// Ember Skillet — ingredients.js
// Canvas drawing for every ingredient. All art is drawn from flat shapes here:
// no images, no copied art. One draw function serves the burger layers, the
// counter bins and the little icons on the order tickets.

function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function ellipsePath(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
}

// Draw one ingredient centred at (cx, cy) inside a box w wide and h tall.
// Used for burger layers (tall box), bin art (square box) and ticket icons.
export function drawIngredient(ctx, id, cx, cy, w, h) {
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun-bottom') drawBottomBun(ctx, w, h);
  else if (id === 'patty') drawPatty(ctx, w, h);
  else if (id === 'lettuce') drawLettuce(ctx, w, h);
  else if (id === 'tomato') drawTomato(ctx, w, h);
  else if (id === 'cheese') drawCheese(ctx, w, h);
  else if (id === 'bun-top') drawTopBun(ctx, w, h);
  ctx.restore();
}

function drawBottomBun(ctx, w, h) {
  // A shallow golden bowl: flat top, softly rounded bottom.
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#f0b45c');
  grad.addColorStop(1, '#c07f2e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.quadraticCurveTo(w / 2, h / 2, 0, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, -h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 50, 10, 0.55)';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.stroke();
  // Toasted top edge.
  ctx.fillStyle = '#e8a94f';
  roundedRectPath(ctx, -w / 2 + 2, -h / 2, w - 4, h * 0.28, h * 0.12);
  ctx.fill();
}

function drawTopBun(ctx, w, h) {
  // A glossy dome with sesame seeds.
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#f7c46a');
  grad.addColorStop(0.55, '#e8a94f');
  grad.addColorStop(1, '#c07f2e');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.quadraticCurveTo(-w / 2, -h / 2, 0, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(90, 50, 10, 0.55)';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.stroke();
  // Sesame seeds.
  ctx.fillStyle = '#fff2cf';
  const seeds = [
    [-0.28, -0.18, -0.4], [0.05, -0.32, 0.3], [0.3, -0.12, 0.9],
    [-0.08, -0.02, 0.15], [0.18, 0.22, -0.5], [-0.32, 0.18, 0.6],
  ];
  for (const [sx, sy, rot] of seeds) {
    ctx.save();
    ctx.translate(sx * w, sy * h);
    ctx.rotate(rot);
    ellipsePath(ctx, 0, 0, w * 0.035, h * 0.09);
    ctx.fill();
    ctx.restore();
  }
}

function drawPatty(ctx, w, h) {
  // A charred patty: dark brown, wavy edges, grill marks.
  ctx.fillStyle = '#5d2f16';
  ctx.beginPath();
  const top = -h / 2;
  const bottom = h / 2;
  ctx.moveTo(-w / 2, top + h * 0.15);
  for (let i = 0; i <= 8; i++) {
    const x = -w / 2 + (i / 8) * w;
    ctx.lineTo(x, top + (i % 2 === 0 ? 0 : h * 0.22));
  }
  ctx.lineTo(w / 2, bottom - h * 0.15);
  for (let i = 8; i >= 0; i--) {
    const x = -w / 2 + (i / 8) * w;
    ctx.lineTo(x, bottom - (i % 2 === 0 ? 0 : h * 0.22));
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4522';
  roundedRectPath(ctx, -w / 2 + w * 0.04, -h * 0.22, w * 0.92, h * 0.44, h * 0.2);
  ctx.fill();
  // Grill marks.
  ctx.strokeStyle = 'rgba(30, 12, 4, 0.7)';
  ctx.lineWidth = Math.max(1.5, h * 0.09);
  for (const gx of [-0.25, 0, 0.25]) {
    ctx.beginPath();
    ctx.moveTo(gx * w - w * 0.05, -h * 0.32);
    ctx.lineTo(gx * w + w * 0.05, h * 0.32);
    ctx.stroke();
  }
}

function drawLettuce(ctx, w, h) {
  // A ruffled green leaf strip.
  ctx.fillStyle = '#5da83c';
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  const bumps = 7;
  for (let i = 0; i <= bumps; i++) {
    const x = -w / 2 + (i / bumps) * w;
    const y = -h / 2 + (i % 2 === 0 ? 0 : h * 0.55);
    ctx.lineTo(x, y);
  }
  for (let i = bumps; i >= 0; i--) {
    const x = -w / 2 + (i / bumps) * w;
    const y = h / 2 - (i % 2 === 0 ? h * 0.55 : 0);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8ed35f';
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h * 0.08);
  for (let i = 0; i <= bumps; i++) {
    const x = -w / 2 + (i / bumps) * w;
    ctx.lineTo(x, -h * 0.08 + (i % 2 === 0 ? 0 : h * 0.3));
  }
  for (let i = bumps; i >= 0; i--) {
    const x = -w / 2 + (i / bumps) * w;
    ctx.lineTo(x, h * 0.08 - (i % 2 === 0 ? h * 0.3 : 0));
  }
  ctx.closePath();
  ctx.fill();
}

function drawTomato(ctx, w, h) {
  // A juicy red slice with a lighter core.
  ctx.fillStyle = '#d94f3d';
  roundedRectPath(ctx, -w / 2, -h / 2, w, h, h * 0.45);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 20, 10, 0.5)';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#f2826f';
  roundedRectPath(ctx, -w * 0.32, -h * 0.22, w * 0.64, h * 0.44, h * 0.2);
  ctx.fill();
  ctx.fillStyle = '#f6b8a8';
  ellipsePath(ctx, -w * 0.18, 0, w * 0.05, h * 0.12);
  ctx.fill();
  ellipsePath(ctx, w * 0.18, 0, w * 0.05, h * 0.12);
  ctx.fill();
}

function drawCheese(ctx, w, h) {
  // A melted yellow slice, corners drooping into drips.
  ctx.fillStyle = '#f6c945';
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2, h * 0.1);
  ctx.lineTo(w * 0.3, h * 0.1);
  ctx.lineTo(w * 0.22, h / 2);
  ctx.lineTo(w * 0.1, h / 2);
  ctx.lineTo(0, h * 0.05);
  ctx.lineTo(-w * 0.18, h * 0.42);
  ctx.lineTo(-w * 0.3, h * 0.42);
  ctx.lineTo(-w * 0.36, h * 0.05);
  ctx.lineTo(-w / 2, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160, 100, 10, 0.5)';
  ctx.lineWidth = Math.max(1.5, h * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#ffdf7a';
  roundedRectPath(ctx, -w * 0.42, -h * 0.38, w * 0.84, h * 0.3, h * 0.12);
  ctx.fill();
}
