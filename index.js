const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const port = 3000;

app.get('/api/new-game/:topic?', async (req, res) => {
    try {
        console.log("generating game...");
        const topic = req.params.topic;
        const response = topic ?
            await fetch(process.env.BACK_END_URI+`/new-game/${topic}`) :
            await fetch(process.env.BACK_END_URI+`/new-game`);
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

app.get('/:topic?',(req,res) => {
    res.sendFile(path.join(__dirname,'public','index.html'));
})


app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});