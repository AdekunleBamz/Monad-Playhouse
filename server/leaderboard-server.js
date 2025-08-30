const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Leaderboard data storage (simple JSON file for now)
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Load environment variables if .env exists
try {
    require('dotenv').config();
} catch (error) {
    console.log('No .env file found, using default configuration');
}

// Game validation rules
const GAME_RULES = {
    1: { maxScore: 10000, minDuration: 10, name: 'Snake' },
    2: { maxScore: 1000, minDuration: 30, name: 'Memory' },
    3: { maxScore: 500, minDuration: 15, name: 'Math' },
    4: { maxScore: 2000, minDuration: 20, name: 'Color' },
    5: { maxScore: 5000, minDuration: 30, name: 'Tetris' },
    6: { maxScore: 1000, minDuration: 5, name: 'Flappy' },
    7: { maxScore: 100, minDuration: 60, name: 'Spelling' },
    8: { maxScore: 1000, minDuration: 15, name: 'Car Race' },
    9: { maxScore: 5000, minDuration: 20, name: 'Monad Runner' },
    10: { maxScore: 1000, minDuration: 45, name: 'Crypto Puzzle' },
    11: { maxScore: 2000, minDuration: 30, name: 'Token Collector' },
    12: { maxScore: 3000, minDuration: 25, name: 'Blockchain Tetris' }
};

// Load leaderboard data
async function loadLeaderboard() {
    try {
        const data = await fs.readFile(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Create new leaderboard if file doesn't exist
        const initialData = {};
        for (let i = 1; i <= 12; i++) {
            initialData[i] = [];
        }
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

// Save leaderboard data
async function saveLeaderboard(data) {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
}

// Validate score
function validateScore(gameType, score, gameDuration, playerAddress) {
    const rules = GAME_RULES[gameType];
    if (!rules) {
        return { valid: false, error: 'Invalid game type' };
    }

    if (score > rules.maxScore) {
        return { valid: false, error: `Score ${score} exceeds maximum ${rules.maxScore} for ${rules.name}` };
    }

    if (gameDuration < rules.minDuration) {
        return { valid: false, error: `Game duration ${gameDuration}s is less than minimum ${rules.minDuration}s for ${rules.name}` };
    }

    if (score <= 0) {
        return { valid: false, error: 'Score must be greater than 0' };
    }

    if (!playerAddress || playerAddress === 'unknown') {
        return { valid: false, error: 'Invalid player address' };
    }

    return { valid: true };
}

// Routes

// Get leaderboard for a specific game
app.get('/api/leaderboard/:gameType', async (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        const limit = parseInt(req.query.limit) || 20;

        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const leaderboard = await loadLeaderboard();
        const gameScores = leaderboard[gameType] || [];

        // Sort by score (highest first) and limit results
        const topScores = gameScores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        res.json({
            gameType,
            gameName: GAME_RULES[gameType].name,
            scores: topScores,
            totalPlayers: gameScores.length
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Submit a score
app.post('/api/submit-score', async (req, res) => {
    try {
        const { gameType, score, playerName, gameDuration, playerAddress } = req.body;

        // Validate input
        if (!gameType || !score || !playerName || !gameDuration || !playerAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate score
        const validation = validateScore(gameType, score, gameDuration, playerAddress);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Load current leaderboard
        const leaderboard = await loadLeaderboard();
        const gameScores = leaderboard[gameType] || [];

        // Check for duplicate submission (same player, same score within 5 minutes)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const duplicate = gameScores.find(s => 
            s.playerAddress === playerAddress && 
            s.score === score && 
            s.timestamp > fiveMinutesAgo
        );

        if (duplicate) {
            return res.status(400).json({ error: 'Duplicate score submission detected' });
        }

        // Add new score
        const newScore = {
            id: Date.now() + Math.random(),
            gameType,
            score,
            playerName,
            gameDuration,
            playerAddress,
            timestamp: Date.now(),
            synced: false // Will be synced to blockchain later
        };

        gameScores.push(newScore);

        // Sort by score and keep only top 100 scores per game
        leaderboard[gameType] = gameScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 100);

        // Save updated leaderboard
        await saveLeaderboard(leaderboard);

        // Calculate player's rank
        const playerRank = leaderboard[gameType].findIndex(s => s.id === newScore.id) + 1;

        res.json({
            success: true,
            message: 'Score submitted successfully',
            score: newScore,
            rank: playerRank,
            totalPlayers: leaderboard[gameType].length
        });

    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

// Get game statistics
app.get('/api/game-stats/:gameType', async (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);

        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const leaderboard = await loadLeaderboard();
        const gameScores = leaderboard[gameType] || [];

        const stats = {
            gameType,
            gameName: GAME_RULES[gameType].name,
            totalPlayers: gameScores.length,
            totalGames: gameScores.length,
            averageScore: gameScores.length > 0 ? 
                Math.round(gameScores.reduce((sum, s) => sum + s.score, 0) / gameScores.length) : 0,
            highestScore: gameScores.length > 0 ? Math.max(...gameScores.map(s => s.score)) : 0,
            lastUpdated: Date.now()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching game stats:', error);
        res.status(500).json({ error: 'Failed to fetch game stats' });
    }
});

// Get all leaderboards summary
app.get('/api/leaderboards-summary', async (req, res) => {
    try {
        const leaderboard = await loadLeaderboard();
        const summary = {};

        for (const [gameType, scores] of Object.entries(leaderboard)) {
            const rules = GAME_RULES[gameType];
            if (rules) {
                summary[gameType] = {
                    gameName: rules.name,
                    totalPlayers: scores.length,
                    topScore: scores.length > 0 ? scores[0].score : 0,
                    topPlayer: scores.length > 0 ? scores[0].playerName : 'None'
                };
            }
        }

        res.json(summary);
    } catch (error) {
        console.error('Error fetching leaderboards summary:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboards summary' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        games: Object.keys(GAME_RULES).length
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏆 Leaderboard server running on port ${PORT}`);
    console.log(`📊 Available games: ${Object.keys(GAME_RULES).length}`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
});

module.exports = app;
