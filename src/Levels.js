const canvas = document.querySelector('#canvas');
const c = canvas.getContext('2d');
const levbtn = document.querySelector('#leveledit');
const start = document.querySelector('#start');
const OK_KEYS = ['1','2','3','4','5','6','7','8','9']
let exportdata = {};
let x = 0; // Offset X (camera position)
let y = 0; // Offset Y
let mouseY , mouseX = 0;

let isEditing = false; // <--- Editing disabled initially

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let keys = {};
let data = [];

function draw() {
  // Clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms with offset added
  data.forEach(o => {
    if (o.type) {
      switch(o.type) {
        case '1': // string '1' to match keyboard input
          c.fillStyle = 'green';
          c.fillRect(o.x + x, o.y + y, 20, 20);
          break;
        case '2':
          c.fillStyle = 'red';
          c.fillRect(o.x + x, o.y + y, 20, 20);
          break;

        // Add more cases here for other types if needed
        default:
          // Default drawing style if type doesn't match above
          c.fillStyle = 'white';
          c.fillRect(o.x + x, o.y + y, 20, 20);
      }
    }
  });
}

function convert(num) {
  return 20 * Math.floor(num / 20);
}

let lastpressed = null;

document.addEventListener('keyup', (event) => {
  keys[event.key] = false; 
  if(event.key === 'c'){localStorage.clear()
   alert('cleared all data!')
   history.go(0);
  }
  if (event.key === 'p') {
    const savedLevel = JSON.parse(localStorage.getItem('savedLevel')) || {};
    savedLevel.spawn = { x: convert(mouseX), y: convert(mouseY) };
    console.log('spawn set!')
    localStorage.setItem('savedLevel', JSON.stringify(savedLevel));
  }
});

document.addEventListener('keydown', (event) => {
  keys[event.key] = true;
  if (OK_KEYS.includes(event.key)) {
    lastpressed = event.key;
  }
});

// Helper function to check if string represents an integer number
function isIntegerString(str) {
  return /^\d+$/.test(str);
}

// Only allow editing when isEditing is true
document.addEventListener('click', (event) => {
  if (!isEditing) return; // <--- Prevent editing before button click

  mouseX = event.clientX;
  mouseY = event.clientY;

  // Check if click is inside any existing rectangle
  const clickedOnObject = data.some(o => {
    const objX = o.x + x;
    const objY = o.y + y;

    return (
      mouseX >= objX &&
      mouseX <= objX + 20 &&
      mouseY >= objY &&
      mouseY <= objY + 20
    );
  });

  if (clickedOnObject) {
    // Remove clicked rectangle(s)
    data = data.filter(o => {
      const objX = o.x + x;
      const objY = o.y + y;

      const clickedInside = (
        mouseX >= objX &&
        mouseX <= objX + 20 &&
        mouseY >= objY &&
        mouseY <= objY + 20
      );

      return !clickedInside;
    });
  } else {
    // Determine type for new block
    let typeToUse = '1'; // default type

    if (lastpressed && isIntegerString(lastpressed)) {
      typeToUse = lastpressed;
    }

    const newX = convert(mouseX - x);
    const newY = convert(mouseY - y);

    data.push({ x: newX, y: newY, type: typeToUse });
  }

  draw();
});

if (levbtn) {
  levbtn.onclick = startledit;
}

function startledit() {
  isEditing = true; // <--- Enable editing here
  if (levbtn) levbtn.style.display = 'none';
  if (start) start.style.display = 'none';

  edit(); // just call edit() directly

}

function edit() {
  if (!isEditing) return; // <--- Stop editing loop if editing is disabled

  if (keys['ArrowLeft']) {
    x += 3;
  }
  if (keys['ArrowRight']) {
    x -= 3;
  }
  if (keys['ArrowDown']) {
    y -= 3;
  }
  if (keys['ArrowUp']) {
    y += 3;
  }

  draw();
  setTimeout(edit, 16.67);
}



// Save on pressing 'S' (while editing)
document.addEventListener('keydown', (e) => {
  if (!isEditing) return; // <--- Prevent saving if not editing
  if (e.key.toLowerCase() === 's') {
    saveLevelToLocalStorage();
    history.go(0)
  }
});
