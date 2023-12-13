const canvas = document.getElementById('letters-canvas');
const ctx = canvas.getContext('2d');
const word = "Example";
const boxSize = 50; // Size of the box for each letter
let boxes = []; // To store the position and size of each letter box
let selectedLetter = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw each letter in a box
    for (let i = 0; i < word.length; i++) {
        let x = i * boxSize;
        let y = canvas.height / 2 - boxSize / 2;
        ctx.strokeRect(x, y, boxSize, boxSize);
        ctx.fillText(word[i], x + boxSize / 4, y + boxSize / 1.5);
        boxes[i] = { x: x, y: y, width: boxSize, height: boxSize };
    }
}

function isInsideBox(x, y, box) {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

canvas.addEventListener('mousedown', function(e) {
    console.log("mousedown event");
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    for (let i = 0; i < boxes.length; i++) {
        if (isInsideBox(mouseX, mouseY, boxes[i])) {
            selectedLetter = i;
            dragOffsetX = mouseX - boxes[i].x;
            dragOffsetY = mouseY - boxes[i].y;
            break;
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    console.log("mouse move event");
    if (selectedLetter !== null) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Update the position of the selected letter box
        boxes[selectedLetter].x = mouseX - dragOffsetX;
        boxes[selectedLetter].y = mouseY - dragOffsetY;

        draw(); // Redraw the canvas with updated positions
    }
});

canvas.addEventListener('mouseup', function(e) {
    if (selectedLetter !== null) {
        // Drop logic: Reorder the boxes based on the new position
        // For simplicity, we'll just reset the order here
        selectedLetter = null;
        draw(); // Redraw the canvas
    }
});

draw(); // Initial drawing