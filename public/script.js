const userGuess = document.getElementById('user-guess');
const submitGuessButton = document.getElementById('submit-guess-button');
const score = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const gameMessage = document.getElementById('game-message');
const gameImage = document.getElementById('game-image');
const scrambledWord = document.getElementById('scrambled-word');
const guessControl = document.getElementById('guess-control');
const rackContainer = document.getElementById('rack-container');
const dragTab = document.getElementById('drag-tab');
let startY, originalY;

victoryMessage.addEventListener('click',resetGame);

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
        //const userInput = userGuess.value.toLowerCase();
        const userInput = rackString.toLowerCase();
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
            rackContainer.style.display = 'block';
            //document.getElementById('scrambled-word').textContent = data.scramble;
            //document.getElementById('scrambled-word').removeAttribute('hidden');
            createTiles(data.scramble.toUpperCase());
            //userGuess.removeAttribute('hidden');
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
    rackContainer.style.display = 'none' // hide rack
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

function startTabDrag(evt) {
    originalY = rackContainer.getBoundingClientRect().top;
    startY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    rackContainer.style.transition = 'none'; // Disable any transition
    rackIsBeingDragged = true;
}

function tabDrag(evt) {
    evt.preventDefault();
    let currentY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    let diffY = currentY - startY;
    rackContainer.style.transform = `translateY(${diffY}px)`;
}

function endTabDrag(evt) {
    rackContainer.style.transition = 'transform 0.3s'; // Re-enable transition for smooth return
    rackContainer.style.transform = 'translateY(0)'; // Return to original position

    let rackRect = rackContainer.getBoundingClientRect();
    let imageRect = gameImage.getBoundingClientRect();

    // Check if rack overlaps with game image
    if (rackRect.bottom > imageRect.top && rackRect.top < imageRect.bottom) {
        console.log("Rack reached the game image!");
        // Handle the event where rack overlaps with game image
    }

    rackIsBeingDragged = false;
}

dragTab.addEventListener('touchstart', startTabDrag);
dragTab.addEventListener('touchmove', tabDrag);
dragTab.addEventListener('touchend', endTabDrag);

// Add corresponding mouse event listeners for non-touch devices
dragTab.addEventListener('mousedown', startTabDrag);
document.addEventListener('mousemove', tabDrag);
document.addEventListener('mouseup', endTabDrag);


resetGame();
