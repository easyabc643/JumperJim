const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
const startBtn = document.getElementById('start');
const levelEditBtn = document.getElementById('leveledit');

startBtn.style.position = 'absolute';
levelEditBtn.style.position = 'absolute';

startBtn.style.left = '200px';
startBtn.style.top = '50px';

levelEditBtn.style.left = '200px';
levelEditBtn.style.top = '120px';


levelEditBtn.style.zIndex = 10;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const fps = 60
// Spikes array
let spikes = [
  { x: 200, y: canvas.height - 30, width: 30, height: 30 },
  { x: 700, y: 320, width: 30, height: 30 },
];

// Constants
const GRAVITY = 0.3;
const JUMPHEIGHT = -10;
const runspeed = 5;

let keys = {};
let gameStarted = false;

const player = {
  x: 0, // world x position
  y: 0, // world y position
  length: 20,
  height: 20,
  fallspeed: 0,
};

let flags = [{ x: 0, y: 0, width: 100, height: 10 }];

// Fixed player screen position (centered)
const playerScreenX = canvas.width / 2 - player.length / 2;
const playerScreenY = canvas.height / 2 - player.height / 2;

// Platforms in world coordinates
let platforms = [
  { x: 0, y: 300, width: 100, height: 20 },
  { x: 350, y: 250, width: 120, height: 10 },
  { x: 600, y: 350, width: 150, height: 10 },
  { x: 850, y: 280, width: 100, height: 10 },
  { x: 850, y: 400, width: 100, height: 10 },
  { x: 850, y: 500, width: 100, height: 10 },
  { x: 850, y: 600, width: 100, height: 10 },
  { x: 850, y: 700, width: 100, height: 10 },
  { x: 850, y: 800, width: 100, height: 10 },
];

// Try to load saved level from localStorage
const savedLevelJSON = localStorage.getItem('savedLevel');
function jparse(){
  if (savedLevelJSON) {
  try {
      const savedLevel = JSON.parse(savedLevelJSON);
      if (savedLevel.platforms) platforms = savedLevel.platforms;
      if (savedLevel.spikes) spikes = savedLevel.spikes;
      if (savedLevel.flags) flags = savedLevel.flags;
      if(savedLevel.spawn){
        const sl = savedLevel.spawn;
        player.x = sl.x;
        player.y = sl.y;
      }
      console.log('Loaded saved level from localStorage');
    } catch (e) {
      console.error('Failed to parse saved level:', e);
    }
  }
}
jparse()
// Double jump variables
var jumpCount = 0;
const maxJumps = 2;

// Collision check helper
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.length > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Input handling
window.addEventListener('keydown', e => {
  keys[e.key] = true;

  if (e.key === 'ArrowUp' && jumpCount < maxJumps) {
    player.fallspeed = JUMPHEIGHT;
    jumpCount++;
  }
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

function checkCollisions(rect1, rect2) {
  // Check if rectangles overlap on the X-axis
  const xOverlap = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;

  // Check if rectangles overlap on the Y-axis
  const yOverlap = rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;

  return xOverlap;
}

// Draw function with vertical and horizontal camera offset
function draw() {
  c.clearRect(0, 0, canvas.width, canvas.height);

  const cameraOffsetX = player.x - playerScreenX;
  const cameraOffsetY = player.y - playerScreenY;

  // Draw platforms
  c.fillStyle = 'green';
  platforms.forEach(platform => {
    c.fillRect(
      platform.x - cameraOffsetX,
      platform.y - cameraOffsetY,
      platform.width,
      platform.height
    );
  });

  // Draw spikes
  c.fillStyle = 'red';
  spikes.forEach(spike => {
    c.fillRect(
      spike.x - cameraOffsetX,
      spike.y - cameraOffsetY,
      spike.width,
      spike.height
    );
  });

  // Draw flags
  c.fillStyle = 'white';
  flags.forEach(flag => {
    c.fillRect(flag.x - cameraOffsetX, flag.y - cameraOffsetY, flag.length, flag.height);
  });

  // Draw player
  c.fillStyle = 'blue';
  c.fillRect(playerScreenX, playerScreenY, player.length, player.height);
}

// Update game state
function update() {
  if (!gameStarted) {
    return; // Stop updating if game not started or ended
  }

  // Horizontal movement with collision
  if (keys['ArrowRight']) {
    let nextX = player.x + runspeed;
    // Create a hypothetical player rectangle at nextX
    const nextPlayerRect = { x: nextX, y: player.y, length: player.length, height: player.height };
    let collision = false;
    platforms.forEach(platform => {
      if (checkCollision(nextPlayerRect, platform)) {
        collision = true;
        // Snap player to platform edge
        nextX = platform.x - player.length;
      }
    });
    if (!collision) {
      player.x = nextX;
    } else {
      player.x = nextX; // snapped position
    }
  }

  if (keys['ArrowLeft']) {
    let nextX = player.x - runspeed;
    const nextPlayerRect = { x: nextX, y: player.y, length: player.length, height: player.height };
    let collision = false;
    platforms.forEach(platform => {
      if (checkCollision(nextPlayerRect, platform)) {
        collision = true;
        // Snap player to platform edge
        nextX = platform.x + platform.width;
      }
    });
    if (!collision) {
      player.x = nextX;
    } else {
      player.x = nextX; // snapped position
    }
  }

  // Prevent jumping through platforms from below
  platforms.forEach(platform => {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.length > platform.x
    ) {
      
      if (
        player.fallspeed < 0 && // moving up
        player.y <= platform.y + platform.height && // player's top is below platform bottom
        player.y > platform.y // player's top is above platform top
      ) {
        player.y = platform.y + platform.height; // reposition player below platform
        player.fallspeed = 0; // stop upward movement
      }
    }
  });

  // Apply gravity and vertical movement
  player.y += player.fallspeed;
  player.fallspeed += GRAVITY;

  // Platform landing collision
  let landed = false;
  platforms.forEach(platform => {
    if (
      player.x < platform.x + platform.width &&
      player.x + player.length > platform.x
    ) {
      if (
        player.fallspeed >= 0 &&
        player.y + player.height >= platform.y &&
        player.y + player.height - player.fallspeed < platform.y
      ) {
        player.y = platform.y - player.height;
        player.fallspeed = 0;
        jumpCount = 0; // reset jump count on landing
        landed = true;
      }
    }
  });

  // Spike collision - reset player position on hit
  spikes.forEach(spike => {
    if (
      player.x < spike.x + spike.width &&
      player.x + player.length > spike.x &&
      player.y < spike.y + spike.height &&
      player.y + player.height > spike.y
    ) {
      console.log('dead...');
      player.x = 0;
      player.y = 0;
      player.fallspeed = 0;
      jumpCount = 0;
    }
  });

  // Flag collision - player wins on touching a flag
  flags.forEach(flag => {
    if (
      player.x < flag.x + flag.length &&
      player.x + player.length > flag.x &&
      player.y < flag.y + flag.height &&
      player.y + player.height > flag.y
    ) {
      gameStarted = false;
      alert('You win!')
    }
  });

  // Calculate ground level based on lowest platform
  const lowestPlatformY = Math.max(...platforms.map(p => p.y));
  const groundLevel = lowestPlatformY + 20; // 20 is platform height buffer

  // Ground collision - player dies (reset) only if below all platforms
  if (player.y + player.height > groundLevel + 100) {
    console.log('dead...');
    player.x = 0;
    player.y = 0;
    player.fallspeed = 0;
    jumpCount = 0;
  }

  draw();
  setTimeout(update, 1000/fps);;
}

// Start button handler
document.getElementById('start').addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true; // start the game
    update();
    document.getElementById('leveledit').style.display = 'none';
    document.getElementById('start').style.display = 'none';
      document.querySelectorAll('.info').forEach(element => {
    element.style.display = 'none';
  });
  }
});
