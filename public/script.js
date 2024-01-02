const userGuess = document.getElementById('user-guess');
const submitGuessButton = document.getElementById('submit-guess-button');
const score = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const gameMessage = document.getElementById('game-message');
const gameImage = document.getElementById('game-image');
const scrambledWord = document.getElementById('scrambled-word');
const guessControl = document.getElementById('guess-control');
const rackContainer = document.getElementById('rack-container');
const dragTabBottom = document.getElementById('drag-tab-bottom');
const skipButton = document.querySelector('.skip-button');
let startY, originalY;
let mismatches = [];

skipButton.addEventListener('click',resetGame);

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
        mismatches = result.mismatches;
        setMismatches();
        guessControl.removeAttribute('hidden');
        if (result.checkResult) {
            removeDragTabEvents();
            console.log("removing tile drag events...");
            removeRackEventListeners();
            skipButton.style.display = 'none';
            gameMessage.setAttribute('hidden',true);
            playerScore++;
            score.textContent = playerScore;
            gameMessage.textContent = "";
            spinImage(result.compliment);
            //createGridOverlay(playerScore);
        } else {
            gameMessage.textContent = "Try again";
            // Wait for 2 seconds and remove the text
            setTimeout(() => {
                gameMessage.textContent = '';
            }, 2000); // 2000 milliseconds = 2 seconds
        }
    } catch (error) {
        console.error('Error:', error);
        gameMessage.textContent = `Error: ${error.message}`;
    }
}

let gameId;
let playerScore = 0;

async function startNewGame() {
    try {
        gameMessage.removeAttribute('hidden');
        skipButton.style.display = 'none';
        gameMessage.textContent = `Generating new game...`;

        // Set the text to rainbow flashing
        gameMessage.classList.add('rainbow-text');
        const response = await fetch(`/api/new-game?score=${playerScore}`);
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
            addDragTabEvents();
            addRackEventListeners();
            rackContainer.style.display = 'block';
            createTiles(data.scramble.toUpperCase());
            skipButton.style.display = 'block';
            triggerBounceAnimation();
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
    victoryMessage.removeEventListener('click',resetGame);
    gameImage.style.transform = 'none'; // Reset image rotation
    victoryMessage.style.display = 'none'; // Hide victory message
    victoryMessage.innerText = ''; // Blank out victory message text
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
    gameImage.src = '/utu-generating-game.png'; // Show Utu
}

function setVictory(compliment){
    victoryMessage.innerText = compliment + "\nClick to continue...";
    victoryMessage.style.display = 'block'; // Show victory message
    victoryMessage.addEventListener('click', resetGame);
    gameImage.addEventListener('click', resetGame);
}

function spinImage(compliment) {
    const img = gameImage;
    img.style.transition = "transform 2s";
    img.style.transform = "rotate(360deg)";

    img.addEventListener('transitionend', function() {
        setVictory(compliment);
    }, { once: true }); // The { once: true } option auto-removes the event listener after it fires once.
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
    //if (rackRect.bottom > imageRect.top && rackRect.top < imageRect.bottom) {
    if (rackRect.top < imageRect.bottom) {
        console.log("Rack reached the game image!");
        // Handle the event where rack overlaps with game image
        submitGuess();
    }

    rackIsBeingDragged = false;
}
function addDragTabEvents(){
    dragTabBottom.addEventListener('touchstart', startTabDrag);
    dragTabBottom.addEventListener('touchmove', tabDrag);
    dragTabBottom.addEventListener('touchend', endTabDrag);
    dragTabBottom.addEventListener('mousedown', startTabDrag);

    document.addEventListener('mousemove', tabDrag);
    document.addEventListener('mouseup', endTabDrag);
}

//note: only implementing this for mobile, not testing on desktop right now
function removeDragTabEvents(){
    dragTabBottom.removeEventListener('touchstart', startTabDrag);
    dragTabBottom.removeEventListener('touchmove', tabDrag);
    dragTabBottom.removeEventListener('touchend', endTabDrag);
}

// Function to handle orientation change
function handleOrientationChange() {
    createTiles(rackString);
    setMismatches(mismatches);
}

function triggerBounceAnimation() {
    rackContainer.style.animation = "none"; // Reset the animation
    void rackContainer.offsetWidth; // Trigger reflow to apply reset
    rackContainer.style.animation = "bounce 1s ease-in-out";
}


    // Attach touch event listeners
rackContainer.addEventListener('touchstart', function(evt) {
    evt.preventDefault(); // Prevents additional mouse event
    startTileDrag(evt);
}, false);

rackContainer.addEventListener('touchmove', function(evt) {
    evt.preventDefault(); // Prevents scrolling while dragging
    tileDrag(evt);
}, false);

rackContainer.addEventListener('touchend', function(evt) {
    endTileDrag(evt);
}, false);

// Add event listener for orientation change
window.addEventListener("resize", handleOrientationChange);

resetGame();
