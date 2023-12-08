document.getElementById('submit-guess').addEventListener('click', async () => {
    try {
        const userInput = document.getElementById('user-guess').value.toLowerCase();
        console.log({userInput});
        const response = await fetch(`/api/check-game?gameId=${gameId}&playerSolution=${userInput}`);
        console.log("fetch complete")
        console.log({response});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log({result});
        if (result.checkResult) {
            document.getElementById('victory-message').style.display = 'block'; // Show victory message
            document.getElementById('new-game-button').removeAttribute('hidden'); // Show New Game button
            document.getElementById('submit-guess').setAttribute('hidden',true);
            document.getElementById('game-result').textContent = "";
            spinImage();
        } else {
            document.getElementById('game-result').textContent = "Try again";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').textContent = `Error: ${error.message}`;
    }
});

let gameId;

async function startNewGame() {
    try {
        document.getElementById('game-result').textContent = `Generating new game...`;
        const response = await fetch('/api/new-game');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log({data});
        gameId = data.gameId;
        const img = document.getElementById('game-image');
        img.onerror = () => {
            console.error('Error loading image:', data.picture);
            document.getElementById('game-result').textContent = 'Error loading image.';
        };
        img.onload = () => {
            img.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
            document.getElementById('submit-guess').removeAttribute('hidden');
            document.getElementById('scrambled-word').textContent = data.scramble;
            document.getElementById('scrambled-word').removeAttribute('hidden');
            document.getElementById('user-guess').removeAttribute('hidden');
        };
        document.getElementById('game-image').src = data.picture;
        document.getElementById('game-result').textContent = ``;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('game-result').textContent = `Error: ${error.message}`;
    }
}

// New Game button event listener
document.getElementById('new-game-button').addEventListener('click', () => {
    resetGame();
});

function resetGame() {
    document.getElementById('game-image').style.transform = 'none'; // Reset image rotation
    document.getElementById('victory-message').style.display = 'none'; // Hide victory message
    document.getElementById('new-game-button').setAttribute('hidden', true); // Hide New Game button
    document.getElementById('submit-guess').setAttribute('hidden',true);
    document.getElementById('user-guess').setAttribute('hidden',true);
    document.getElementById('user-guess').value = '';
    document.getElementById('scrambled-word').innerText = '';
    document.getElementById('game-result').textContent = ''; // Clear result text
    const img = document.getElementById('game-image');
    img.onload = () => {
        img.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
        startNewGame();
    };
    document.getElementById('game-image').src = 'utu-generating-game.png'; // Show Utu
}

function spinImage() {
    const img = document.getElementById('game-image');
    img.style.transition = "transform 2s";
    img.style.transform = "rotate(360deg)";
}

resetGame();
