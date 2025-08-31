require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}
let db;

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

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const client = new MongoClient(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        await client.connect();
        db = client.db();
        console.log('✅ Connected to MongoDB');
        
        // Create indexes for better performance
        await db.collection('scores').createIndex({ gameType: 1, score: -1 });
        await db.collection('scores').createIndex({ playerAddress: 1, gameType: 1 });
        await db.collection('scores').createIndex({ timestamp: -1 });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

// Validate score
function validateScore(gameType, score, gameDuration, playerAddress) {
    const rules = GAME_RULES[gameType];
    if (!rules) {
        return { valid: false, error: 'Invalid game type' };
    }

    if (score <= 0 || score > rules.maxScore) {
        return { valid: false, error: `Score must be between 1 and ${rules.maxScore}` };
    }

    if (gameDuration < rules.minDuration) {
        return { valid: false, error: `Game duration must be at least ${rules.minDuration} seconds` };
    }

    if (!playerAddress || playerAddress === 'unknown') {
        return { valid: false, error: 'Valid player address required' };
    }

    return { valid: true };
}

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        message: '🎮 Monad Playhouse Leaderboard API',
        version: '1.0.0',
        status: 'running',
        database: db ? 'connected' : 'disconnected',
        endpoints: {
            health: '/api/health',
            leaderboard: '/api/leaderboard/:gameType',
            submitScore: '/api/submit-score',
            games: '/api/games'
        },
        games: Object.keys(GAME_RULES).length,
        timestamp: new Date().toISOString()
    });
});

// Games endpoint - list all available games
app.get('/api/games', (req, res) => {
    const games = Object.entries(GAME_RULES).map(([id, game]) => ({
        id: parseInt(id),
        name: game.name,
        maxScore: game.maxScore,
        minDuration: game.minDuration
    }));
    
    res.json({
        success: true,
        games,
        totalGames: games.length
    });
});

// Games endpoint
app.get('/api/games', (req, res) => {
    const games = Object.entries(GAME_RULES).map(([id, game]) => ({
        id: parseInt(id),
        name: game.name,
        maxScore: game.maxScore,
        minDuration: game.minDuration
    }));
    
    res.json({
        success: true,
        games,
        totalGames: games.length
    });
});

// Routes
app.get('/api/leaderboard/:gameType', async (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        const limit = parseInt(req.query.limit) || 20;
        
        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const scores = await db.collection('scores')
            .find({ gameType })
            .sort({ score: -1, timestamp: 1 })
            .limit(limit)
            .toArray();

        const totalPlayers = await db.collection('scores')
            .countDocuments({ gameType });

        res.json({
            success: true,
            scores,
            totalPlayers,
            gameType,
            gameName: GAME_RULES[gameType].name
        });
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/api/submit-score', async (req, res) => {
    try {
        const { gameType, score, playerName, gameDuration, playerAddress } = req.body;

        // Validate input
        if (!gameType || !score || !playerAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate score
        const validation = validateScore(gameType, score, gameDuration, playerAddress);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // Check for duplicate submission (same player, same game, within 1 minute)
        const oneMinuteAgo = new Date(Date.now() - 60000);
        const existingScore = await db.collection('scores').findOne({
            gameType,
            playerAddress,
            timestamp: { $gte: oneMinuteAgo }
        });

        if (existingScore) {
            return res.status(400).json({ error: 'Score already submitted recently' });
        }

        // Create score document
        const scoreDoc = {
            gameType,
            score,
            playerName: playerName || 'Anonymous',
            gameDuration,
            playerAddress,
            timestamp: new Date(),
            gameName: GAME_RULES[gameType].name
        };

        // Insert score
        const result = await db.collection('scores').insertOne(scoreDoc);

        // Get player's rank
        const playerRank = await db.collection('scores').countDocuments({
            gameType,
            score: { $gt: score }
        }) + 1;

        res.json({
            success: true,
            rank: playerRank,
            scoreId: result.insertedId,
            message: `Score submitted! You're ranked #${playerRank}`
        });

    } catch (error) {
        console.error('Score submission error:', error);
        res.status(500).json({ error: 'Failed to submit score' });
    }
});

app.get('/api/game-stats/:gameType', async (req, res) => {
    try {
        const gameType = parseInt(req.params.gameType);
        
        if (!GAME_RULES[gameType]) {
            return res.status(400).json({ error: 'Invalid game type' });
        }

        const stats = await db.collection('scores').aggregate([
            { $match: { gameType } },
            {
                $group: {
                    _id: null,
                    totalPlayers: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    highestScore: { $max: '$score' },
                    lowestScore: { $min: '$score' }
                }
            }
        ]).toArray();

        const result = stats[0] || {
            totalPlayers: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
        };

        res.json({
            success: true,
            gameType,
            gameName: GAME_RULES[gameType].name,
            ...result
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/leaderboards-summary', async (req, res) => {
    try {
        const summary = await db.collection('scores').aggregate([
            {
                $group: {
                    _id: '$gameType',
                    totalPlayers: { $sum: 1 },
                    topScore: { $max: '$score' },
                    lastPlayed: { $max: '$timestamp' }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        const formattedSummary = summary.map(game => ({
            gameType: game._id,
            gameName: GAME_RULES[game._id]?.name || 'Unknown',
            totalPlayers: game.totalPlayers,
            topScore: game.topScore,
            lastPlayed: game.lastPlayed
        }));

        res.json({
            success: true,
            summary: formattedSummary
        });
    } catch (error) {
        console.error('Summary fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'disconnected',
        games: Object.keys(GAME_RULES).length
    });
});

// Start server
async function startServer() {
    await connectToMongoDB();
    
    app.listen(PORT, () => {
        console.log(`🏆 Global Leaderboard server running on port ${PORT}`);
        console.log(`📊 Available games: ${Object.keys(GAME_RULES).length}`);
        console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
        console.log(`🌍 Ready for global deployment!`);
    });
}

startServer().catch(console.error);

module.exports = app;
