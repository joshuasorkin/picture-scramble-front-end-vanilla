const rack = document.getElementById('rack-container');
let draggingTile = null;
let startX;
let tiles = [];
let xOffsetStart;
let yOffset;
let tileWidth;
let tileGap;
let tileSpacing;
let rackPadding;
let containerPadding;
let rackWidth;
let containerWidth;
let rackString;

let rackIsBeingDragged = false;

function getRackString() {
    const tileElements = rack.querySelectorAll('.tile');
    return Array.from(tileElements).reduce((currentString, tile) => {
        const textElement = tile.querySelector('text');
        return textElement ? currentString + textElement.textContent : currentString;
    }, '');
}

function createTiles(str) {
    // Remove existing tiles
    const existingTiles = rackContainer.querySelectorAll('.tile');
    existingTiles.forEach(tile => tile.remove());

    xOffsetStart = 25;
    yOffset = 35;
    tileWidth = 30;
    tileGap = 10;
    tileSpacing = tileWidth + tileGap;
    rackPadding = 20; // Padding on either side of the tiles
    containerPadding = 20;

    rackWidth = str.length * tileSpacing + rackPadding;
    containerWidth = rackWidth + containerPadding;

    // set position of drag tab right
    const dragTabRight = document.getElementById('drag-tab-right');
    dragTabRight.setAttribute('x',rackWidth.toString());

    // Set the width of the rack
    const rackElement = document.querySelector('.rack');
    rackElement.setAttribute('width', rackWidth.toString());

    //set the width of the rack container
    rack.setAttribute('width', containerWidth.toString());

    //reset rackString
    rackString = '';

    tiles = [...str].map((char, index) => {
        rackString += char;
        const x = xOffsetStart + index * tileSpacing;

        const group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        group.classList.add('tile');
        group.setAttribute('transform', `translate(${x}, ${yOffset})`);
        group.dataset.index = index;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        rect.setAttribute('width', tileWidth);
        rect.setAttribute('height', tileWidth);

        const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        text.setAttribute('x', tileWidth / 2);
        text.setAttribute('y', tileWidth / 2);
        text.setAttribute('class', 'tile-text');
        text.textContent = char;

        group.appendChild(rect);
        group.appendChild(text);
        rack.appendChild(group);

        return { element: group, x, char };
    });
    console.log({tiles});
    console.log({rackString});
}

function startTileDrag(evt) {
    if (!rackIsBeingDragged){
        if (evt.target.classList.contains('tile') || evt.target.parentNode.classList.contains('tile')) {
            draggingTile = evt.target.classList.contains('tile') ? evt.target : evt.target.parentNode;
            if (evt.touches) {
                evt.preventDefault(); // Prevents additional mouse event
                startX = evt.touches[0].clientX;
            } else {
                startX = evt.clientX;
            }
            draggingTile.classList.add('dragging');     
            rack.classList.add('no-select');
            // Move the dragging tile to the end of the SVG for higher stacking order
            draggingTile.parentNode.appendChild(draggingTile);
        }
    }
}

function tileDrag(evt) {
    if (draggingTile) {
        const draggingIndex = parseInt(draggingTile.dataset.index);
        let currentX;
        if (evt.touches) {
            evt.preventDefault(); // Prevents scrolling while dragging
            currentX = evt.touches[0].clientX;
        } else {
            currentX = evt.clientX;
        }
        let dx = currentX - startX;
        //don't let leftmost tile move further to the left
        if (draggingIndex === 0 && dx < 0){
        //    dx = 0;
        }
        const currentTransform = draggingTile.getAttribute('transform');
        let translateX = parseInt(currentTransform.split('(')[1]) + dx;
        
        // Define the boundaries
        const leftBoundary = rackPadding;
        const rightBoundary = containerWidth - (rackPadding + containerPadding);

        // Enforce the boundaries
        if (translateX < leftBoundary) {
            translateX = leftBoundary;
        } else if (translateX > rightBoundary) {
            translateX = rightBoundary;
        }

        draggingTile.setAttribute('transform', `translate(${translateX}, ${yOffset})`);
        startX = currentX;
    }
}


function endTileDrag(evt) {
    if (draggingTile) {
        console.log("drag ended");
        draggingTile.classList.remove('dragging');
        reorderTiles();
        draggingTile = null;
        rack.classList.remove('no-select');
    }  
}

function reorderTiles() {
    const draggingIndex = parseInt(draggingTile.dataset.index);
    const currentTransform = draggingTile.getAttribute('transform');
    const translateX = parseInt(currentTransform.split('(')[1]);
    console.log({draggingIndex},{currentTransform},{translateX});
    let newIndex = Math.round((translateX - tileWidth) / tileSpacing);
    //check if tile has moved left of first tile
    if (newIndex <= 0){
        newIndex = 0
    }
    //check if tile has moved right of last tile
    if (newIndex > tiles.length - 1) {
        newIndex = tiles.length - 1;
    }
    console.log({newIndex});
    rackString = '';
    if (newIndex !== draggingIndex && newIndex >= 0 && newIndex < tiles.length) {
        // Remove the dragging tile from the array and splice it into the new position
        const [movedTile] = tiles.splice(draggingIndex, 1);
        tiles.splice(newIndex, 0, movedTile);

        // Update positions of all tiles
        tiles.forEach((tile, index) => {
            const x = xOffsetStart + index * tileSpacing;
            tile.element.setAttribute('transform', `translate(${x}, ${yOffset})`);
            tile.element.dataset.index = index;
            rackString += tile.char;
        });
        console.log({rackString});
    }
}

rack.addEventListener('mousedown', startTileDrag);
document.addEventListener('mousemove', tileDrag);
document.addEventListener('mouseup', endTileDrag);

    // Attach touch event listeners
rack.addEventListener('touchstart', function(evt) {
    evt.preventDefault(); // Prevents additional mouse event
    startTileDrag(evt);
}, false);

rack.addEventListener('touchmove', function(evt) {
    evt.preventDefault(); // Prevents scrolling while dragging
    tileDrag(evt);
}, false);

rack.addEventListener('touchend', function(evt) {
    endTileDrag(evt);
}, false);