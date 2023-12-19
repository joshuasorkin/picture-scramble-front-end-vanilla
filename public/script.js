const score = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const gameMessage = document.getElementById('game-message');
const gameImage = document.getElementById('game-image');
const rackContainer = document.getElementById('rack-container');
const dragTabLeft = document.getElementById('drag-tab-left');
const dragTabRight = document.getElementById('drag-tab-right');
const skipButton = document.querySelector('.skip-button');
let startY, originalY;

skipButton.addEventListener('click',resetGame);

async function submitGuess(){
    try {
        const userInput = rackString.toLowerCase();
        console.log({userInput});
        // Set the text to rainbow flashing
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
            winGame();
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

//operations to execute when player wins
async function winGame() {
    skipButton.style.display = 'none';
    gameMessage.setAttribute('hidden',true);
    playerScore++;
    score.textContent = playerScore;
    victoryMessage.style.display = 'block'; // Show victory message
    victoryMessage.innerText = 'You win!';
    gameMessage.textContent = "";
    spinImage(result.compliment);
}

async function startNewGame() {
    try {
        gameMessage.removeAttribute('hidden');
        gameMessage.textContent = `Generating new game...`;
        skipButton.style.display = 'none';
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
            rackContainer.style.display = 'block';
            createTiles(data.scramble.toUpperCase());
            skipButton.style.display = 'block';
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
    rackContainer.style.display = 'none' // hide rack
    gameMessage.textContent = ''; // Clear result text
    gameImage.onload = () => {
        gameImage.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
        startNewGame();
    };
    gameImage.src = 'utu-generating-game.png'; // Show Utu
}

function spinImage(compliment) {
    const img = gameImage;
    img.style.transition = "transform 2s";
    img.style.transform = "rotate(360deg)";

    img.addEventListener('transitionend', function() {
        victoryMessage.innerText = compliment + "\nClick to continue...";
        victoryMessage.addEventListener('click', resetGame, {once: true});
        gameImage.addEventListener('click', resetGame, {once: true});
    }, { once: true }); // The { once: true } option auto-removes the event listener after it fires once.

}

function startTabDrag(evt) {
    if (evt.touches && evt.touches.length === 1){
        originalY = rackContainer.getBoundingClientRect().top;
        startY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        rackContainer.style.transition = 'none'; // Disable any transition
        rackIsBeingDragged = true;
    }
}

function tabDrag(evt) {
    if (evt.touches && evt.touches.length ===1){
        evt.preventDefault();
        let currentY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        let diffY = currentY - startY;
        rackContainer.style.transform = `translateY(${diffY}px)`;
    }
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

dragTabLeft.addEventListener('touchstart', startTabDrag);
dragTabLeft.addEventListener('touchmove', tabDrag);
dragTabLeft.addEventListener('touchend', endTabDrag);

// Add corresponding mouse event listeners for non-touch devices
dragTabLeft.addEventListener('mousedown', startTabDrag);
document.addEventListener('mousemove', tabDrag);
document.addEventListener('mouseup', endTabDrag);

dragTabRight.addEventListener('touchstart', startTabDrag);
dragTabRight.addEventListener('touchmove', tabDrag);
dragTabRight.addEventListener('touchend', endTabDrag);

// Add corresponding mouse event listeners for non-touch devices
dragTabRight.addEventListener('mousedown', startTabDrag);
document.addEventListener('mousemove', tabDrag);
document.addEventListener('mouseup', endTabDrag);

resetGame();
