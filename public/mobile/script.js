const appState = new AppState();
const score = document.getElementById('score');
const victoryMessage = document.getElementById('victory-message');
const gameMessage = document.getElementById('game-message');
const gameImage = document.getElementById('game-image');
const scrambledWord = document.getElementById('scrambled-word');
const rackContainer = document.getElementById('rack-container');
const dragTabBottom = document.getElementById('drag-tab-bottom');
const skipButton = document.querySelector('.skip-button');
let overlayCanvas;
let ctx;
let startY, originalY;
let pixelateValues;
let mismatches = [];
let puzzleValue;
let gameId;
let playerScore = 0;
let rackIsBeingDragged = false;
let preloadGameData = [];
let currentBlobUrl;
let solutionHash;
let compliment;
let contact;
let default_contact_info;
const encoder = new TextEncoder();



document.getElementById('linkedImageContainer').addEventListener('click', function() {
    console.log("clicked");
    document.getElementById('contactOverlay').style.display = 'block';
  });
  
  document.getElementById('closeBtn').addEventListener('click', function() {
    document.getElementById('contactOverlay').style.display = 'none';
  });

function handleSubmissionSuccess(){
    deleteOverlayCanvas();
    removeDragTabEvents();
    removeRackEventListeners();
    skipButton.style.display = 'none';
    gameMessage.setAttribute('hidden',true);
    playerScore+=puzzleValue;
    score.textContent = playerScore;
    gameMessage.textContent = "";
    spinImage(compliment);
}

function handleSubmissionFailure(){
    decreasePuzzleValue();
    gameMessage.textContent = "Try again";
    // Wait for 2 seconds and remove the text
    setTimeout(() => {
        gameMessage.textContent = '';
    }, 2000); // 2000 milliseconds = 2 seconds
}

async function sha256Hash(str) {
    // Encode the string into UTF-8 bytes
    const data = encoder.encode(str);
  
    // Hash the data with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
    // Convert the buffer to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
    return hashHex;
}




async function submitGuess(userInputIsSolution){
    try {
        const userInput = rackString.toLowerCase();
        // Set the text to rainbow flashing
        gameMessage.classList.add('rainbow-text');
        gameMessage.removeAttribute('hidden');
        gameMessage.textContent = 'Checking Answer';
        if (!userInputIsSolution){
            const response = await fetch(`/api/check-game?gameId=${gameId}&playerSolution=${userInput}`);
            gameMessage.classList.remove('rainbow-text');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            mismatches = result.mismatches;
            setMismatches();
            handleSubmissionFailure();
        }
        else{
            gameMessage.classList.remove('rainbow-text');
            handleSubmissionSuccess();
        }
    } catch (error) {
        console.error('Error:', error);
        gameMessage.textContent = `Error: ${error.message}`;
    }
}

async function getGameData(){
    let gameData;
    if(preloadGameData.length>0){
        gameData = preloadGameData.shift();
    }
    else{
        gameData = await fetchGameDataFromServer();
    }
    if (gameData.isInternalUrl){
        console.log("getting image data from internal url");
        currentBlobUrl = gameData.picture;  //set the current blob url for later revocation
    }
    else{
        console.log("getting image data from openai");
        currentBlobUrl = null; //no blob url needed for later revocation
    }
    return gameData;
}

async function fetchGameDataFromServer(isPreload){
    //don't let the preload array get too large
    if(isPreload && preloadGameData.length>6){
        return;
    }

    const response = await fetch(`/api/new-game?score=${playerScore}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const gameData = await response.json();
    //only make a Blob if it's from our own server,
    //as OpenAI's server causes CORS error if we try to fetch() the image
    if(gameData.isInternalUrl){
        const imageData = await fetchAndCacheImage(gameData.picture);
        if (imageData.error){
            gameData.error = imageData.error;
            return gameData;
        }
        gameData.picture = imageData.imageBlobUrl;
        gameData.contact = imageData.contact;
    }
    else{
    }
    if(isPreload){
        preloadGameData.push(gameData);
    }
    return gameData;
}

async function fetchAndCacheImage(imageUrl) {
    try{
        console.log(`fetching image data from ${imageUrl}`);
        const response = await fetch(imageUrl,{
                method: "get",
                //disable ngrok for production
                headers: new Headers({
                  "ngrok-skip-browser-warning": "69420",
                })
        });
        console.log(`completed fetch from ${imageUrl}`);
        console.log({response});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let contact;
        // Check if the response is JSON (from myserver) or a Blob (from anotherserver)
        const contentType = response.headers.get("content-type");
        console.log({contentType});
        let result;
        if (contentType && contentType.includes("application/json")) {
            const jsonData = await response.json(); // parse the JSON to get the object
            console.log({jsonData});
            if(jsonData.contact){
                contact = jsonData.contact; // Access metadata, if you need to use it
            }
            console.log({contact}); // Example action, like logging the metadata

            // Convert base64 image string to Blob
            const base64Image = jsonData.image.split(';base64,').pop();
            const imageBlob = await (await fetch(`data:image/png;base64,${base64Image}`)).blob();
            const imageBlobUrl = URL.createObjectURL(imageBlob);
            result = {imageBlobUrl, contact};
        } else {
            // Handle as Blob for images directly from anotherserver or as fallback
            const imageBlob = await response.blob();
            return URL.createObjectURL(imageBlob);
        }
        return result;
    }
    catch(error){
        console.error('Error with fetchAndCacheImage():', error);
        return {error: error}
    }
}


async function startNewGame() {
    try {
        gameMessage.removeAttribute('hidden');
        skipButton.style.display = 'none';
        gameMessage.textContent = `Generating new game...`;

        // Set the text to rainbow flashing
        gameMessage.classList.add('rainbow-text');
        const data = await getGameData();
        console.log({data});

        if(data.error){
            gameMessage.classList.remove('rainbow-text');
            console.log("Error fetching game data:",data.error);
            gameMessage.textContent = "Sorry, I couldn't make a game.  Details in the console.  Try reloading the page!"
            return;
        }
        gameMessage.classList.remove('rainbow-text');
        gameId = data.gameId;
        solutionHash = data.solutionHash;
        compliment = data.compliment;
        contact = data.contact;
        renderContact(contact);
        const img = gameImage;
        img.onerror = () => {
            console.error('Error loading image:', data.picture);
            gameMessage.textContent = 'Error loading image.';
        };
        img.onload = () => {
            img.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
            initializePixelatedCanvas();
            rackContainer.style.display = 'block';
            createTiles(data.scramble.toUpperCase());
            skipButton.style.display = 'block';
            skipButton.addEventListener('click',resetGame),{once:true};
            triggerBounceAnimation();
            addDragTabEvents();
            addRackEventListeners();
        };
        gameImage.src = data.picture;
        gameMessage.textContent = ``;
        fetchGameDataFromServer(true);
        fetchGameDataFromServer(true);
        //this way we will gradually increase the size of our game cache
        //instead of always being only 1 game ahead
    } catch (error) {
        console.error('Error:', error);
        gameMessage.textContent = `Error: ${error.message}`;
    }
}

function setNextPixelate(){
    return;
    const pixelateValue = pixelateValues.pop();
    console.log(`Pixelating at value ${pixelateValue}`);
    if (pixelateValue !== undefined){
        pixelate(gameImage,pixelateValue);
    }
}

function initializePixelatedCanvas(){
    return;
    createOverlayCanvas();
    setNextPixelate();
    document.getElementById("overlay-canvas").addEventListener("click",function(event){
        setNextPixelate();
        decreasePuzzleValue();
    });
}

async function resetGame() {
    if(!default_contact_info){
       const response = await fetch(`/api/default-contact`);
       default_contact_info = await response.text();
    }
    pixelateValues = [1, 5, 15];
    puzzleValue = 10;

    gameImage.removeEventListener('click',resetGame);
    victoryMessage.removeEventListener('click',resetGame);
    gameImage.style.transform = 'none'; // Reset image rotation
    victoryMessage.style.display = 'none'; // Hide victory message
    victoryMessage.innerText = ''; // Blank out victory message text
    rackContainer.style.display = 'none' // hide rack
    document.getElementById('scrambled-word').innerText = '';
    gameMessage.textContent = ''; // Clear result text
    gameImage.onload = () => {
        //revoke the blob url from the previous game, if it exists
        if(currentBlobUrl){
            URL.revokeObjectURL(currentBlobUrl);
        }
        gameImage.removeAttribute('hidden'); // Remove 'hidden' attribute when the image is loaded
        startNewGame();
    };
    gameImage.src = '/utu-generating-game.png'; // Show Utu
}

function setVictory(compliment){
    victoryMessage.innerText = compliment + "\nClick to continue...";
    victoryMessage.style.display = 'block'; // Show victory message
    victoryMessage.addEventListener('click', resetGame,{once:true});
    gameImage.addEventListener('click', resetGame,{once:true});
}

function spinImage(compliment) {
    const img = gameImage;
    img.style.transition = "transform 2s";
    img.style.transform = "rotate(360deg)";

    img.addEventListener('transitionend', function() {
        setVictory(compliment);
    }, { once: true }); // The { once: true } option auto-removes the event listener after it fires once.
}

function createOverlayCanvas() {
    // Get the game-image element
    const gameImage = document.getElementById('game-image');

    // Get the bounding rectangle of the game-image
    const rect = gameImage.getBoundingClientRect();

    // Create a new canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'overlay-canvas';

    // Set the canvas dimensions and position to match the game-image
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.position = 'absolute';
    canvas.style.left = gameImage.offsetLeft + 'px';
    canvas.style.top = gameImage.offsetTop + 'px';
    canvas.style.zIndex = '10'; // Ensure the canvas is above the game-image

    // Get the context of the canvas and draw the image
    ctx = canvas.getContext('2d');
    ctx.drawImage(gameImage, 0, 0, canvas.width, canvas.height);
    console.log("drew image")

    // Append the canvas to the body (or to the specific parent element of game-image)
    document.getElementById("image-container").appendChild(canvas);
    overlayCanvas = document.getElementById("overlay-canvas");
    rackContainer.style.zIndex = parseInt(canvas.style.zIndex, 10) + 1;
}

function deleteOverlayCanvas(){
    const canvas = document.getElementById('overlay-canvas');
    if(canvas){
        canvas.remove();
    }
}

function pixelate(image, pixelation) {
    const canvas = document.getElementById("overlay-canvas")

    // Resize the canvas to the size of the image
    canvas.width = image.width;
    canvas.height = image.height;

    // The level of pixelation, lower values have more detail
    var pixelSize = pixelation;

    // Draw the image in a smaller size (pixelated)
    ctx.drawImage(image, 0, 0, image.width / pixelSize, image.height / pixelSize);

    // Scale the smaller image back up to the original size
    ctx.drawImage(canvas, 0, 0, image.width / pixelSize, image.height / pixelSize, 0, 0, canvas.width, canvas.height);
}

function decreasePuzzleValue(){
    if (puzzleValue > 1){
        puzzleValue--;
    }
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
    if (rackIsBeingDragged && rackRect.top < imageRect.bottom) {
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
