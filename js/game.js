// Moto Racer — Offline (Vanilla JS + Canvas)
// Fully fixed and working student-friendly endless dodger.

(function() {
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const scoreEl = document.getElementById('score');
const bestEl  = document.getElementById('best');
const pauseBtn = document.getElementById('pauseBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const boostBtn = document.getElementById('boostBtn');
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('playBtn');
const stateTitle = document.getElementById('stateTitle');
const stateSubtitle = document.getElementById('stateSubtitle');

const BEST_KEY = 'moto_racer_best_v1';
let best = Number(localStorage.getItem(BEST_KEY) || 0);
bestEl.textContent = best;

let running = false, paused = false;
let time = 0, score = 0, speed = 220, boost = 0;
let laneCount = 3;
let laneW = W * 0.20;
let roadW = laneW * laneCount + 40;
let roadX = (W - roadW) / 2;
let obstacles = [], coins = [], lines = [];

const player = {
w: laneW * 0.6,
h: laneW * 1.1,
x: 0,
y: H - 140,
vx: 0,
lane: 1,
color: '#66f6a1',
alive: true,
};

const keys = { left: false, right: false, boost: false };
const rand = (min, max) => Math.random() * (max - min) + min;
const choice = arr => arr[(Math.random() * arr.length) | 0];

let lastTs = 0;
let nextObstacle = 0, nextCoin = 0;

function reset() {
running = false; paused = false;
time = 0; score = 0; speed = 220; boost = 0;
obstacles = []; coins = []; lines = [];
player.lane = 1;
player.x = roadX + 20 + player.lane * laneW + (laneW - player.w)/2;
player.y = H - 140; player.vx = 0; player.alive = true;

for (let i = -10; i < 20; i++) {
  for (let l = 1; l < laneCount; l++) {
    lines.push({ x: roadX + 20 + l * laneW - 4, y: i * 48, w: 8, h: 28 });
  }
}

drawSplash();

}

function start() {
overlay.classList.add('hidden');
running = true; paused = false;
lastTs = performance.now();
requestAnimationFrame(loop);
}

function gameOver() {
running = false; player.alive = false;
if (score > best) {
best = score;
localStorage.setItem(BEST_KEY, best);
}
bestEl.textContent = best;
stateTitle.textContent = 'Game Over';
stateSubtitle.textContent = Score: ${score} • Best: ${best};
overlay.classList.remove('hidden');
playBtn.textContent = 'Play Again';
}

function update(dt) {
if (!running || paused) return;

time += dt;
speed += dt * 6;

const steerSpeed = 260;
player.vx = keys.left ? -steerSpeed : keys.right ? steerSpeed : 0;
player.x += player.vx * dt;
player.x = Math.max(roadX + 20, Math.min(roadX + roadW - 20 - player.w, player.x));

boost += ((keys.boost ? 140 : 0) - boost) * Math.min(1, dt * 8);
const forward = speed + boost;

lines.forEach(ln => ln.y += forward * dt * 0.9);
lines.forEach(ln => { if (ln.y > H + 30) ln.y -= (Math.ceil((ln.y + 30) / 48)) * 48; });

nextObstacle -= dt;
if (nextObstacle <= 0) {
  nextObstacle = rand(0.7, 1.3) * Math.max(0.5, 1.6 - time * 0.03);
  const lane = (Math.random() * laneCount) | 0;
  const ow = laneW * rand(0.55, 0.7);
  const oh = laneW * rand(1.0, 1.3);
  const ox = roadX + 20 + lane * laneW + (laneW - ow)/2;
  const color = choice(['#ff6b6b','#6bc9ff','#ffd166','#b28dff']);
  obstacles.push({x: ox, y: -oh, w: ow, h: oh, color});
}

nextCoin -= dt;
if (nextCoin <= 0) {
  nextCoin = rand(0.8, 1.6);
  const lane = (Math.random() * laneCount) | 0;
  coins.push({x: roadX + 20 + lane * laneW + laneW/2, y: -20, r: 8});
}

obstacles.forEach(o => o.y += forward * dt);
coins.forEach(c => c.y += forward * dt);

obstacles = obstacles.filter(o => o.y <= H + 60);
coins = coins.filter(c => c.y <= H + 20);

if (obstacles.some(o => rectsOverlap(player, o))) gameOver();

for (let i = coins.length - 1; i >= 0; i--) {
  if (circleRectOverlap(coins[i].x, coins[i].y, coins[i].r, player)) {
    score += 25; coins.splice(i, 1);
  }
}

score += Math.floor(forward * dt * 0.15);
scoreEl.textContent = score;

}

function draw() {
ctx.fillStyle = '#0e1116';
ctx.fillRect(0, 0, W, H);

roundedRect(ctx, roadX, -10, roadW, H + 20, 18, '#1a1f27');
lines.forEach(ln => roundedRect(ctx, ln.x, ln.y, ln.w, ln.h, 4, '#aaa'));
obstacles.forEach(o => roundedRect(ctx, o.x, o.y, o.w, o.h, 6, o.color));
coins.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fillStyle = '#ffd700'; ctx.fill(); });
if (player.alive) roundedRect(ctx, player.x, player.y, player.w, player.h, 8, player.color);

}

function loop(ts) {
const dt = Math.min(1, (ts - lastTs)/1000);
lastTs = ts;
update(dt);
draw();
if (running) requestAnimationFrame(loop);
}

function drawSplash() {
ctx.fillStyle = '#0e1116';
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#fff';
ctx.font = '28px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Moto Racer', W/2, H/2 - 20);
ctx.font = '16px sans-serif';
ctx.fillText('Tap Play to Start', W/2, H/2 + 20);
}

function roundedRect(ctx, x, y, w, h, r, color) {
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.lineTo(x + w - r, y);
ctx.quadraticCurveTo(x + w, y, x + w, y + r);
ctx.lineTo(x + w, y + h - r);
ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
ctx.lineTo(x + r, y + h);
ctx.quadraticCurveTo(x, y + h, x, y + h - r);
ctx.lineTo(x, y + r);
ctx.quadraticCurveTo(x, y, x + r, y);
ctx.closePath();
ctx.fillStyle = color;
ctx.fill();
}

function rectsOverlap(a, b) {
return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(cx, cy, r, rect) {
const rx = rect.x, ry = rect.y, rw = rect.w, rh = rect.h;
const closestX = Math.max(rx, Math.min(cx, rx + rw));
const closestY = Math.max(ry, Math.min(cy, ry + rh));
const dx = cx - closestX, dy = cy - closestY;
return dxdx + dydy < r*r;
}

document.addEventListener('keydown', e => {
if(e.code === 'ArrowLeft') keys.left = true;
if(e.code === 'ArrowRight') keys.right = true;
if(e.code === 'Space') keys.boost = true;
});
document.addEventListener('keyup', e => {
if(e.code === 'ArrowLeft') keys.left = false;
if(e.code === 'ArrowRight') keys.right = false;
if(e.code === 'Space') keys.boost = false;
});

leftBtn.addEventListener('mousedown', () => keys.left = true);
leftBtn.addEventListener('mouseup', () => keys.left = false);
rightBtn.addEventListener('mousedown', () => keys.right = true);
rightBtn.addEventListener('mouseup', () => keys.right = false);
boostBtn.addEventListener('mousedown', () => keys.boost = true);
boostBtn.addEventListener('mouseup', () => keys.boost = false);

pauseBtn.addEventListener('click', () => {
paused = !paused;
pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

playBtn.addEventListener('click', () => { reset(); start(); });

reset();
})();

