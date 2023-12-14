const userGuess = document.getElementById('user-guess');
const submitGuessButton = document.getElementById('submit-guess-button');
const score = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const gameMessage = document.getElementById('game-message');
const gameImage = document.getElementById('game-image');
const scrambledWord = document.getElementById('scrambled-word');
const guessControl = document.getElementById('guess-control');
const tileContainer = document.getElementById('tile-container');

victoryMessage.addEventListener('click',resetGame);


function removeAllTiles() {
    while (tileContainer.firstChild) {
        tileContainer.removeChild(tileContainer.firstChild);
    }
}

function loadTiles(word){
    removeAllTiles();
    const container = tileContainer;

    let draggedTile = null;

    word.split('').forEach(letter => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.textContent = letter;
        container.appendChild(tile);

        // Desktop Events
        tile.addEventListener('dragstart', onDragStart);
        tile.addEventListener('dragend', onDragEnd);

        // Mobile Events
        tile.addEventListener('touchstart', onTouchStart);
        tile.addEventListener('touchmove', onTouchMove);
        tile.addEventListener('touchend', onTouchEnd);
    });

    container.addEventListener('dragover', function (e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientX);
        if (afterElement == null) {
            container.appendChild(draggedTile);
        } else {
            container.insertBefore(draggedTile, afterElement);
        }
    });

    function onDragStart(e) {
        draggedTile = this;
        setTimeout(() => this.classList.add('hidden'), 0);
    }

    function onDragEnd(e) {
        this.classList.remove('hidden');
    }

    function onTouchStart(e) {
        draggedTile = this;
        this.classList.add('hidden');
    }

    function onTouchMove(e) {
        e.preventDefault();
        const touchLocation = e.targetTouches[0];
        const afterElement = getDragAfterElement(container, touchLocation.clientX);
        if (afterElement == null) {
            container.appendChild(draggedTile);
        } else {
            container.insertBefore(draggedTile, afterElement);
        }
    }

    function onTouchEnd(e) {
        this.classList.remove('hidden');
    }

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.tile:not(.hidden)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}




userGuess.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action to avoid form submission or page reload
        submitGuess();
    }
});

submitGuessButton.addEventListener('click', submitGuess);

scrambledWord.addEventListener('click', function() {
    const text = this.innerText;
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});

async function submitGuess(){
    try {
        const userInput = userGuess.value.toLowerCase();
        console.log({userInput});
        // Set the text to rainbow flashing
        guessControl.setAttribute('hidden',true);
        gameMessage.classList.add('rainbow-text');
        gameMessage.removeAttribute('hidden');
        gameMessage.textContent = 'Checking Answer';
        const response = await fetch(`/api/check-game?gameId=${gameId}&playerSolution=${userInput}`);
        gameMessage.classList.remove('rainbow-text');
        console.log("fetch complete")
        console.log({response});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log({result});
        guessControl.removeAttribute('hidden');
        if (result.checkResult) {
            gameMessage.setAttribute('hidden',true);
            playerScore++;
            score.textContent = playerScore;
            victoryMessage.style.display = 'block'; // Show victory message
            submitGuessButton.setAttribute('hidden',true);
            gameMessage.textContent = "";
            spinImage();
            gameImage.addEventListener('click', resetGame);
            //createGridOverlay(playerScore);
        } else {
            gameMessage.textContent = "Try again";
        }
    } catch (error) {
        console.error('Error:', error);
        gameMessage.textContent = `Error: ${error.message}`;
    }
}

let gameId;
let playerScore = 0;

async function fetchData() {
    try {
        const response = await fetch('/api/new-game'); // Replace with your API endpoint
        return response; // Return the data for further use
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function sparkleWhileFetching() {
    const img = gameImage;
    const canvas = document.getElementById('overlay-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Function to change and reset a pixel
    function togglePixel(x, y) {
        console.log("toggling",x,y);
        const randomColor = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`;
        ctx.fillStyle = randomColor;
        ctx.fillRect(x, y, 1, 1);

        /*
        setTimeout(() => {
            ctx.clearRect(x, y, 1, 1);
        }, 50);
        */
    }

    // Asynchronous loop function
    async function loop() {
        if (!fetchDataPromise) { // If fetchDataPromise is still unresolved
            // Choose a random pixel
            const x = Math.floor(Math.random() * canvas.width);
            const y = Math.floor(Math.random() * canvas.height);

            // Toggle the pixel color
            togglePixel(x, y);

            // Request the next frame in the loop
            requestAnimationFrame(loop);
        }
    }

    const fetchDataPromise = fetchData();
    loop(); // Start the loop

    const data = await fetchDataPromise; // Wait for the fetch to complete
    console.log('Data received:', data); // Do something with the data
    return data;
}

async function startNewGame() {
    try {
        gameMessage.removeAttribute('hidden');
        gameMessage.textContent = `Generating new game...`;

        // Set the text to rainbow flashing
        gameMessage.classList.add('rainbow-text');
        const response = await fetch('/api/new-game');
        gameMessage.classList.remove('rainbow-text');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log({data});
        gameId = data.gameId;
        const img = gameImage;
        img.onerror = () => {
            console.error('Error loading image:', data.picture);
            gameMessage.textContent = 'Error loading image.';
        };
        img.onload = () => {
            img.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
            submitGuessButton.removeAttribute('hidden');
            document.getElementById('scrambled-word').textContent = data.scramble;
            document.getElementById('scrambled-word').removeAttribute('hidden');
            userGuess.removeAttribute('hidden');
            loadTiles(data.scramble);
        };
        gameImage.src = data.picture;
        gameMessage.textContent = ``;

    } catch (error) {
        console.error('Error:', error);
        gameMessage.textContent = `Error: ${error.message}`;
    }
}

function resetGame() {
    gameImage.removeEventListener('click',resetGame);
    gameImage.style.transform = 'none'; // Reset image rotation
    victoryMessage.style.display = 'none'; // Hide victory message
    submitGuessButton.setAttribute('hidden',true);
    userGuess.setAttribute('hidden',true);
    userGuess.value = '';
    document.getElementById('scrambled-word').innerText = '';
    gameMessage.textContent = ''; // Clear result text
    gameImage.onload = () => {
        gameImage.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
        startNewGame();
    };
    gameImage.src = 'utu-generating-game.png'; // Show Utu
}

function spinImage() {
    const img = gameImage;
    img.style.transition = "transform 2s";
    img.style.transform = "rotate(360deg)";
}

function createGridOverlay(score) {
    // Clear any existing grid
    const container = document.getElementById('imageContainer');
    container.querySelectorAll('.grid-overlay').forEach(grid => grid.remove());

    // Create the grid overlay
    const grid = document.createElement('div');
    grid.className = 'grid-overlay';
    grid.style.gridTemplateColumns = `repeat(${score}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${score}, 1fr)`;

    // Add cells to the grid
    for (let i = 0; i < score * score; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        grid.appendChild(cell);
    }

    // Append the grid overlay to the container
    container.appendChild(grid);
}



resetGame();
