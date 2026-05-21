const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('reset');

let width, height, cols, rows, scale;
let snake, direction, food, palette, frameCount, hue;
let pointer = { x: null, y: null, active: false };

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  width = rect.width;
  height = rect.height;
  scale = Math.max(20, Math.floor(width / 40));
  cols = Math.floor(width / scale);
  rows = Math.floor(height / scale);
}

function reset() {
  resize();
  snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  direction = { x: 1, y: 0 };
  food = { x: randInt(cols), y: randInt(rows) };
  palette = ['#6ee7ff', '#f78fb3', '#ffde59', '#73ffca'];
  frameCount = 0;
  hue = 200;
  ctx.clearRect(0, 0, width, height);
}

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function drawCell(x, y, color, alpha = 1) {
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
}

function parseHex(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function blend(a, b, t) {
  return a + (b - a) * t;
}

function drawBackground() {
  ctx.fillStyle = 'rgba(0, 4, 9, 0.18)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(110, 231, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < cols; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, height);
    ctx.stroke();
  }
  for (let y = 0; y < rows; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * scale);
    ctx.lineTo(width, y * scale);
    ctx.stroke();
  }
}

function update() {
  frameCount += 1;
  if (frameCount % 8 === 0) {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0) head.x = cols - 1;
    if (head.x >= cols) head.x = 0;
    if (head.y < 0) head.y = rows - 1;
    if (head.y >= rows) head.y = 0;
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      placeFood();
    } else {
      snake.pop();
    }
  }

  if (pointer.active && pointer.x != null) {
    const targetX = Math.floor(pointer.x / scale);
    const targetY = Math.floor(pointer.y / scale);
    const head = snake[0];
    const dx = targetX - head.x;
    const dy = targetY - head.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = { x: dx > 0 ? 1 : -1, y: 0 };
    } else if (dy !== 0) {
      direction = { x: 0, y: dy > 0 ? 1 : -1 };
    }
  }
}

function placeFood() {
  food = { x: randInt(cols), y: randInt(rows) };
}

function draw() {
  drawBackground();

  const alpha = 0.35 + 0.65 * Math.sin(frameCount / 30);
  const paletteRgb = palette.map(parseHex);

  for (let i = 0; i < snake.length; i++) {
    const pos = snake[i];
    const ratio = i / Math.max(1, snake.length - 1);
    const base = paletteRgb[i % paletteRgb.length];
    const color = paletteRgb[(i + 1) % paletteRgb.length];
    drawCell(pos.x, pos.y, [
      Math.round(blend(base[0], color[0], ratio)),
      Math.round(blend(base[1], color[1], ratio)),
      Math.round(blend(base[2], color[2], ratio)),
    ], alpha);
  }

  ctx.fillStyle = `hsl(${(hue + frameCount * 0.4) % 360}, 100%, 65%)`;
  ctx.fillRect(food.x * scale + 2, food.y * scale + 2, scale - 4, scale - 4);

  if (pointer.active && pointer.x != null) {
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, width, height);
}

function animate() {
  update();
  draw();
  requestAnimationFrame(animate);
}

function setDirection(key) {
  const up = key === 'ArrowUp' || key === 'w' || key === 'W';
  const down = key === 'ArrowDown' || key === 's' || key === 'S';
  const left = key === 'ArrowLeft' || key === 'a' || key === 'A';
  const right = key === 'ArrowRight' || key === 'd' || key === 'D';

  if (up && direction.y === 0) direction = { x: 0, y: -1 };
  if (down && direction.y === 0) direction = { x: 0, y: 1 };
  if (left && direction.x === 0) direction = { x: -1, y: 0 };
  if (right && direction.x === 0) direction = { x: 1, y: 0 };
}

window.addEventListener('keydown', (event) => setDirection(event.key));
window.addEventListener('resize', () => resize());

canvas.addEventListener('pointerdown', (event) => {
  pointer.active = true;
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
});
canvas.addEventListener('pointermove', (event) => {
  if (!pointer.active) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
});
canvas.addEventListener('pointerup', () => {
  pointer.active = false;
});
canvas.addEventListener('pointerleave', () => {
  pointer.active = false;
});

resetBtn.addEventListener('click', () => reset());

reset();
animate();
