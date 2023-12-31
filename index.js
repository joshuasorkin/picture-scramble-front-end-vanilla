const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
dotenv.config();
const app = express();
const port = 3000;
const mongo_uri = process.env.MONGO_URI;
console.log({mongo_uri});

//set secure: process.env.SECURE_BOOLEAN
app.use(session({
    secret: process.env.SECRET_KEY, // Secret key for signing the session ID cookie
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl:mongo_uri }),
    cookie: { secure: false } // Set to true if using HTTPS
  }));

  app.get('/api/new-game', async (req, res) => {
    try {
        console.log("generating game...");

        // Retrieve score and language from the request
        const score = req.query.score;
        const language = req.session.language;
        console.log({language});

        // Initialize the base URL
        let url = process.env.BACK_END_URI + '/new-game';

        // Array to hold query parameters
        const queryParams = [];

        // Check if score is not undefined and append it to queryParams
        if (score !== undefined) {
            queryParams.push(`score=${encodeURIComponent(score)}`);
        }

        // Check if language is not undefined and append it to queryParams
        if (language !== undefined) {
            queryParams.push(`language=${encodeURIComponent(language)}`);
        }

        // If there are any query parameters, append them to the URL
        if (queryParams.length > 0) {
            url += '?' + queryParams.join('&');
        }

        console.log({url});

        // Fetching the data from the URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Proxy endpoint for check-game
app.get('/api/check-game', async (req, res) => {
    try {
        const { gameId, playerSolution } = req.query;
        const url = process.env.BACK_END_URI+`/check-game?gameId=${gameId}&playerSolution=${playerSolution}`;
        console.log({url});
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log({data});
        res.json(data); // Send the response back to the frontend
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static('public'));

app.get('/language/:language', (req,res) => {
    req.session.language = req.params.language;
    res.sendFile(path.join(__dirname,'public','index.html'));
});






app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});