const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// In-memory storage for testing
const scores = [];
const gameStats = {};

// Game rules - using the same values as config/contract.json
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        games: Object.keys(GAME_RULES).length,
        message: 'Server running with in-memory storage'
    });
});

// Get leaderboard
app.get('/api/leaderboard/:gameType', (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        const limit = parseInt(req.query.limit) || 20;
        
        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const gameScores = scores
            .filter(score => score.gameType === gameType)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        res.json({
            success: true,
            scores: gameScores,
            totalPlayers: gameScores.length,
            gameType,
            gameName: GAME_RULES[gameType].name
        });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Submit score
app.post('/api/submit-score', (req, res) => {
    try {
        const { gameType, score, playerName, gameDuration, playerAddress } = req.body;

        if (!gameType || !score || !playerAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const rules = GAME_RULES[gameType];
        if (!rules) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        if (score <= 0 || score > rules.maxScore) {
            return res.status(400).json({ error: `Score must be between 1 and ${rules.maxScore}` });
        }

        if (gameDuration < rules.minDuration) {
            return res.status(400).json({ error: `Game duration must be at least ${rules.minDuration} seconds` });
        }

        const newScore = {
            gameType,
            score,
            playerName: playerName || 'Anonymous',
            playerAddress,
            gameDuration,
            timestamp: new Date()
        };

        scores.push(newScore);
        console.log('✅ Score submitted:', newScore);

        res.json({
            success: true,
            message: 'Score submitted successfully',
            score: newScore
        });
    } catch (error) {
        console.error('Score submission error:', error);
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

// Get game stats
app.get('/api/game-stats/:gameType', (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        
        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const gameScores = scores.filter(score => score.gameType === gameType);
        
        if (gameScores.length === 0) {
            return res.json({
                success: true,
                stats: {
                    totalGames: 0,
                    totalPlayers: 0,
                    averageScore: 0,
                    highestScore: 0,
                    gameType,
                    gameName: GAME_RULES[gameType].name
                }
            });
        }

        const totalGames = gameScores.length;
        const totalPlayers = new Set(gameScores.map(s => s.playerAddress)).size;
        const averageScore = Math.round(gameScores.reduce((sum, s) => sum + s.score, 0) / totalGames);
        const highestScore = Math.max(...gameScores.map(s => s.score));

        res.json({
            success: true,
            stats: {
                totalGames,
                totalPlayers,
                averageScore,
                highestScore,
                gameType,
                gameName: GAME_RULES[gameType].name
            }
        });
    } catch (error) {
        console.error('Game stats error:', error);
        res.status(500).json({ error: 'Failed to fetch game stats' });
    }
});

// Get all leaderboards summary
app.get('/api/leaderboards-summary', (req, res) => {
    try {
        const summary = {};
        
        Object.keys(GAME_RULES).forEach(gameType => {
            const gameScores = scores.filter(score => score.gameType === parseInt(gameType));
            summary[gameType] = {
                gameName: GAME_RULES[gameType].name,
                totalScores: gameScores.length,
                highestScore: gameScores.length > 0 ? Math.max(...gameScores.map(s => s.score)) : 0
            };
        });

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Leaderboards summary error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboards summary' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:8080'}`);
    console.log(`💾 Storage: In-memory (for testing)`);
});
