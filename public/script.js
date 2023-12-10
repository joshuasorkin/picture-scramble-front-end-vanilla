document.getElementById('user-guess').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action to avoid form submission or page reload
        submitGuess();
    }
});

document.getElementById('submit-guess').addEventListener('click', submitGuess);

async function submitGuess(){
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
            playerScore++;
            document.getElementById('score').textContent = playerScore;
            document.getElementById('victory-message').style.display = 'block'; // Show victory message
            document.getElementById('submit-guess').setAttribute('hidden',true);
            document.getElementById('game-result').textContent = "";
            spinImage();
            document.getElementById('game-image').addEventListener('click', resetGame);
            //createGridOverlay(playerScore);
        } else {
            document.getElementById('game-result').textContent = "Try again";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('result').textContent = `Error: ${error.message}`;
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
    const img = document.getElementById('game-image');
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
        document.getElementById('game-result').textContent = `Generating new game...`;
        document.getElementById('generating-message').style.display = 'block'; // Show generating message
        let gameResult = document.getElementById('game-result');

        // Set the text to rainbow flashing
        textElement.classList.add('rainbow-text');
        const response = await fetch('/api/new-game');
        textElement.classList.remove('rainbow-text');

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
            document.getElementById('generating-message').style.display = 'none'; // Hide generating message
        };
        document.getElementById('game-image').src = data.picture;
        document.getElementById('game-result').textContent = ``;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('game-result').textContent = `Error: ${error.message}`;
    }
}

function resetGame() {
    document.getElementById('game-image').removeEventListener('click',resetGame);
    document.getElementById('game-image').style.transform = 'none'; // Reset image rotation
    document.getElementById('victory-message').style.display = 'none'; // Hide victory message
    document.getElementById('generating-message').style.display = 'none'; // Hide generating message
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
