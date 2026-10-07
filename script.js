const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const timeLeftEl = document.querySelector('#time-left');
const scoreEl = document.querySelector('#score');
const restartButton = document.querySelector('#restart');

const GAME_DURATION = 20;
const PLAYER_X = canvas.width / 2;
const PLAYER_Y = canvas.height - 52;
const MAX_BULLETS = 8;
const MAX_SHELLS = 10;

const state = {
  gameOver: false,
  gameClear: false,
  timeLeft: GAME_DURATION,
  score: 0,
  pointerX: PLAYER_X,
  pointerY: PLAYER_Y - 180,
  lastTime: 0,
  shellTimer: 0,
  bullets: [],
  shells: [],
};

function createBullet(x, y, targetX, targetY) {
  const angle = Math.atan2(targetY - y, targetX - x);
  const speed = 8.5;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 5,
  };
}

function createShell() {
  const x = 60 + Math.random() * (canvas.width - 120);
  const speed = 1.8 + Math.random() * 0.9;

  return {
    x,
    y: -18,
    radius: 14,
    speed,
    drift: (Math.random() - 0.5) * 0.9,
  };
}

function shoot() {
  if (state.gameOver || state.gameClear || state.bullets.length >= MAX_BULLETS) {
    return;
  }

  const bullet = createBullet(PLAYER_X, PLAYER_Y, state.pointerX, state.pointerY);
  state.bullets.push(bullet);
}

function resetGame() {
  state.gameOver = false;
  state.gameClear = false;
  state.timeLeft = GAME_DURATION;
  state.score = 0;
  state.lastTime = 0;
  state.shellTimer = 0;
  state.bullets = [];
  state.shells = [];
  updateHud();
}

function updateHud() {
  timeLeftEl.textContent = state.timeLeft.toFixed(1);
  scoreEl.textContent = String(state.score);
}

function update(delta) {
  if (state.gameOver || state.gameClear) {
    return;
  }

  state.timeLeft = Math.max(0, state.timeLeft - delta);
  state.shellTimer -= delta;

  if (state.shellTimer <= 0 && state.shells.length < MAX_SHELLS) {
    state.shells.push(createShell());
    state.shellTimer = 0.55 + Math.random() * 0.55;
  }

  state.bullets.forEach((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  });

  state.shells.forEach((shell) => {
    shell.x += shell.drift;
    shell.y += shell.speed;

    if (shell.x < shell.radius || shell.x > canvas.width - shell.radius) {
      shell.drift *= -1;
      shell.x = Math.min(Math.max(shell.x, shell.radius), canvas.width - shell.radius);
    }
  });

  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    if (
      bullet.x < -10 ||
      bullet.x > canvas.width + 10 ||
      bullet.y < -10 ||
      bullet.y > canvas.height + 10
    ) {
      state.bullets.splice(i, 1);
    }
  }

  for (let i = state.shells.length - 1; i >= 0; i -= 1) {
    const shell = state.shells[i];
    const hit = state.bullets.some((bullet) => {
      const dx = bullet.x - shell.x;
      const dy = bullet.y - shell.y;
      return dx * dx + dy * dy <= (bullet.radius + shell.radius) ** 2;
    });

    if (hit) {
      state.shells.splice(i, 1);
      state.score += 1;
      state.bullets = state.bullets.filter((bullet) => {
        const dx = bullet.x - shell.x;
        const dy = bullet.y - shell.y;
        return dx * dx + dy * dy > (bullet.radius + shell.radius) ** 2;
      });
      continue;
    }

    if (shell.y + shell.radius >= canvas.height) {
      state.shells.splice(i, 1);
      state.gameOver = true;
    }
  }

  if (state.timeLeft <= 0 && !state.gameOver) {
    state.gameClear = true;
  }

  updateHud();
}

function drawBackground() {
  ctx.fillStyle = '#061426';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(107, 166, 224, 0.18)';
  ctx.lineWidth = 1;
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawGround() {
  const groundY = canvas.height - 28;
  ctx.fillStyle = '#425d78';
  ctx.fillRect(0, groundY, canvas.width, 28);

  ctx.fillStyle = '#8db7d8';
  ctx.fillRect(0, groundY + 12, canvas.width, 4);
}

function drawPlayer() {
  const angle = Math.atan2(state.pointerY - PLAYER_Y, state.pointerX - PLAYER_X);
  const barrelLength = 46;
  const endX = PLAYER_X + Math.cos(angle) * barrelLength;
  const endY = PLAYER_Y + Math.sin(angle) * barrelLength;

  ctx.strokeStyle = '#d9e7f8';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(PLAYER_X, PLAYER_Y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = '#9dbfdd';
  ctx.beginPath();
  ctx.arc(PLAYER_X, PLAYER_Y, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#6ea8dc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(PLAYER_X, PLAYER_Y, 22, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBullets() {
  ctx.fillStyle = '#ffd166';
  state.bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawShells() {
  state.shells.forEach((shell) => {
    ctx.fillStyle = '#f76c5e';
    ctx.beginPath();
    ctx.arc(shell.x, shell.y, shell.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffb0a4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shell.x - 7, shell.y);
    ctx.lineTo(shell.x + 7, shell.y);
    ctx.stroke();
  });
}

function drawPointer() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(state.pointerX, state.pointerY, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(state.pointerX - 16, state.pointerY);
  ctx.lineTo(state.pointerX + 16, state.pointerY);
  ctx.moveTo(state.pointerX, state.pointerY - 16);
  ctx.lineTo(state.pointerX, state.pointerY + 16);
  ctx.stroke();
}

function drawMessage() {
  if (!state.gameOver && !state.gameClear) {
    return;
  }

  const message = state.gameOver ? 'GAME OVER' : 'GAME CLEAR';
  ctx.fillStyle = 'rgba(3, 11, 23, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = state.gameOver ? '#ff6b6b' : '#7af7bf';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#dfeaf8';
  ctx.fillText('クリックしてもう一度', canvas.width / 2, canvas.height / 2 + 40);
}

function render() {
  drawBackground();
  drawGround();
  drawPlayer();
  drawBullets();
  drawShells();
  drawPointer();
  drawMessage();
}

function gameLoop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.05);
  state.lastTime = timestamp;

  update(delta);
  render();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  state.pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  state.pointerY = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('click', shoot);
canvas.addEventListener('pointerdown', shoot);
restartButton.addEventListener('click', resetGame);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

updateHud();
resetGame();
requestAnimationFrame(gameLoop);
