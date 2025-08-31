// Monad Playhouse - Main Game Controller
class MonadPlayhouse {
    constructor() {
        this.currentGame = null;
        this.gameCanvas = null;
        this.gameContext = null;
        this.isGameRunning = false;
        this.currentScore = 0;
        this.gameStartTime = 0;
        this.sounds = {};
        
        this.init();
    }

    async init() {
            console.log('Starting blockchain systems initialization...');
            
        // Initialize blockchain systems
            console.log('Initializing MonadWallet...');
        this.wallet = new MonadWallet();
        const walletInitialized = await this.wallet.init();
        console.log('MonadWallet initialized:', walletInitialized);

            console.log('Initializing WalletManager...');
        this.walletManager = new WalletManager();
        const walletManagerInitialized = await this.walletManager.init();
        console.log('WalletManager initialized:', walletManagerInitialized);

            console.log('Initializing LeaderboardManager...');
        this.leaderboardManager = new LeaderboardManager();
        const leaderboardInitialized = await this.leaderboardManager.init();
        console.log('LeaderboardManager initialized:', leaderboardInitialized);

            console.log('Initializing PaymentGateway...');
        this.paymentGateway = new PaymentGateway();
        const paymentInitialized = await this.paymentGateway.init();
        console.log('PaymentGateway initialized:', paymentInitialized);
            
            console.log('Blockchain systems initialized successfully');
            
        // Initialize sounds
        this.initSounds();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize leaderboard button
        this.initLeaderboardButton();
    }

    initSounds() {
        try {
            this.sounds = {
                click: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
                success: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
                gameOver: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'),
                background: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
            };
            
            // Set volume for all sounds
            Object.values(this.sounds).forEach(sound => {
                sound.volume = 0.3;
            });
            
            console.log('Sounds initialized successfully:', Object.keys(this.sounds));
        } catch (error) {
            console.warn('Failed to initialize sounds:', error);
        }
    }

    setupEventListeners() {
        // Game card click handlers
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameType = e.target.closest('.game-card').dataset.game;
                this.startFreeGame(gameType);
            });
        });

        document.querySelectorAll('.play-premium-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameType = e.target.closest('.game-card').dataset.game;
                this.startPremiumGame(gameType);
            });
        });
    }

    initLeaderboardButton() {
                    setTimeout(() => {
            const leaderboardBtn = document.getElementById('leaderboardBtn');
            if (leaderboardBtn) {
                console.log('Leaderboard button found and ready');
            }
        }, 1000);
    }

    async startFreeGame(gameType) {
        try {
            console.log('Starting free game:', gameType);
            this.playSound('click');
            
            // For free games, we can start immediately
            await this.startGame(gameType, false);
            
        } catch (error) {
            console.error('Failed to start free game:', error);
            this.showNotification('Failed to start game. Please try again.', 'error');
        }
    }

    async startPremiumGame(gameType) {
        try {
            console.log('Starting premium game:', gameType);
            this.playSound('click');
            
            // Check if user is authenticated (either wallet or MGID)
            const isWalletConnected = this.wallet && this.wallet.isConnected;
            const isMGIDAuthenticated = window.mgidManager && window.mgidManager.isMGIDAuthenticated();
            
            if (!isWalletConnected && !isMGIDAuthenticated) {
                this.showNotification('Please connect your wallet or sign in with Monad Games ID to play premium games.', 'info');
                return;
            }
            
            // Show payment modal for wallet users
            if (isWalletConnected) {
                this.paymentGateway.show(gameType);
                } else {
                // For MGID users, start game directly
                await this.startGame(gameType, true);
            }
            
        } catch (error) {
            console.error('Failed to start premium game:', error);
            this.showNotification('Failed to start premium game. Please try again.', 'error');
        }
    }

    async startGame(gameType, isPremium = false) {
        try {
            console.log(`Starting ${isPremium ? 'premium' : 'free'} game:`, gameType);
            
            // Create game canvas
            this.createGameCanvas();
            
            // Initialize game based on type
            this.currentGame = this.createGame(gameType);
            this.currentScore = 0;
            this.gameStartTime = Date.now();
            this.isGameRunning = true;
            
            // Start the game
            this.currentGame.start();
            
            // Play background music
            this.playSound('background', true);
            
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showNotification('Failed to start game. Please try again.', 'error');
        }
    }

    createGameCanvas() {
        // Remove existing canvas if any
        const existingCanvas = document.getElementById('gameCanvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        // Create new canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.id = 'gameCanvas';
        canvasContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        // Create canvas
        this.gameCanvas = document.createElement('canvas');
        this.gameCanvas.width = 800;
        this.gameCanvas.height = 600;
        this.gameCanvas.style.cssText = `
            border: 3px solid #00ff88;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
            background: #000;
        `;

        // Create game controls
        const gameControls = document.createElement('div');
        gameControls.style.cssText = `
            margin-top: 20px;
            display: flex;
            gap: 10px;
        `;

        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back to Menu';
        backBtn.style.cssText = `
            background: rgba(255, 107, 157, 0.2);
            border: 2px solid #ff6b9d;
            color: #ff6b9d;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        backBtn.addEventListener('click', () => this.endGame());

        const pauseBtn = document.createElement('button');
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.style.cssText = `
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            color: #00ff88;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        pauseBtn.addEventListener('click', () => this.togglePause());

        gameControls.appendChild(backBtn);
        gameControls.appendChild(pauseBtn);
        canvasContainer.appendChild(this.gameCanvas);
        canvasContainer.appendChild(gameControls);
        document.body.appendChild(canvasContainer);

        this.gameContext = this.gameCanvas.getContext('2d');
    }

    createGame(gameType) {
        // Simple game implementations
        const games = {
            snake: new SnakeGame(this.gameCanvas, this.gameContext),
            memory: new MemoryGame(this.gameCanvas, this.gameContext),
            math: new MathGame(this.gameCanvas, this.gameContext),
            color: new ColorGame(this.gameCanvas, this.gameContext),
            tetris: new TetrisGame(this.gameCanvas, this.gameContext),
            flappy: new FlappyGame(this.gameCanvas, this.gameContext),
            spelling: new SpellingGame(this.gameCanvas, this.gameContext),
            carRace: new CarRaceGame(this.gameCanvas, this.gameContext),
            monadRunner: new MonadRunnerGame(this.gameCanvas, this.gameContext),
            cryptoPuzzle: new CryptoPuzzleGame(this.gameCanvas, this.gameContext),
            tokenCollector: new TokenCollectorGame(this.gameCanvas, this.gameContext),
            blockchainTetris: new BlockchainTetrisGame(this.gameCanvas, this.gameContext)
        };

        return games[gameType] || games.snake;
    }

    async endGame() {
        try {
            if (this.currentGame) {
                this.currentGame.stop();
            }

            this.isGameRunning = false;
            this.playSound('gameOver');

            // Stop background music
            this.stopSound('background');

            // Remove canvas
            const canvasContainer = document.getElementById('gameCanvas');
            if (canvasContainer) {
                canvasContainer.remove();
            }

            // Submit score if game was played
            if (this.currentScore > 0) {
                await this.submitScore();
            }

            this.currentGame = null;
            this.currentScore = 0;

        } catch (error) {
            console.error('Error ending game:', error);
        }
    }

    async submitScore() {
        try {
            console.log('Submitting score:', this.currentScore);

            // Submit to local leaderboard
            if (this.leaderboardManager) {
                await this.leaderboardManager.submitScore(this.currentGame.gameType, this.currentScore);
            }

            // Submit to MGID if authenticated
            if (window.mgidManager && window.mgidManager.isMGIDAuthenticated()) {
                await window.mgidManager.submitScoreToMGID(this.currentGame.gameType, this.currentScore);
            }

            this.showNotification(`Score submitted: ${this.currentScore}`, 'success');

        } catch (error) {
            console.error('Failed to submit score:', error);
            this.showNotification('Failed to submit score', 'error');
        }
    }

    togglePause() {
        if (this.currentGame) {
            this.currentGame.togglePause();
        }
    }

    playSound(soundName, loop = false) {
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.loop = loop;
                sound.currentTime = 0;
                sound.play().catch(e => console.warn('Sound play failed:', e));
            }
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    stopSound(soundName) {
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        } catch (error) {
            console.warn('Failed to stop sound:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Simple Game Classes
class SnakeGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.gameType = 'snake';
        this.isRunning = false;
        this.isPaused = false;
        this.snake = [{x: 10, y: 10}];
        this.food = {x: 15, y: 15};
        this.direction = 'right';
        this.score = 0;
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    gameLoop() {
        if (!this.isRunning || this.isPaused) return;

        this.update();
        this.draw();

        setTimeout(() => this.gameLoop(), 100);
    }

    update() {
        // Simple snake movement
        const head = {...this.snake[0]};
        
        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.generateFood();
        } else {
            this.snake.pop();
        }

        // Check collision
        if (this.checkCollision()) {
            this.stop();
            window.monadPlayhouse.endGame();
        }
    }

    draw() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.context.fillStyle = '#00ff88';
        this.snake.forEach(segment => {
            this.context.fillRect(segment.x * 20, segment.y * 20, 18, 18);
        });

        // Draw food
        this.context.fillStyle = '#ff6b9d';
        this.context.fillRect(this.food.x * 20, this.food.y * 20, 18, 18);

        // Draw score
        this.context.fillStyle = '#fff';
        this.context.font = '20px Arial';
        this.context.fillText(`Score: ${this.score}`, 10, 30);
    }

    checkCollision() {
        const head = this.snake[0];
        return head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 30;
    }

    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * 40),
            y: Math.floor(Math.random() * 30)
        };
    }
}

// Placeholder game classes (implement similar to SnakeGame)
class MemoryGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'memory'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Memory Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class MathGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'math'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Math Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class ColorGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'color'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Color Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class TetrisGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'tetris'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Tetris Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class FlappyGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'flappy'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Flappy Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class SpellingGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'spelling'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Spelling Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class CarRaceGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'carRace'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Car Race Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class MonadRunnerGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'monadRunner'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Monad Runner Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class CryptoPuzzleGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'cryptoPuzzle'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Crypto Puzzle Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class TokenCollectorGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'tokenCollector'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Token Collector Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }
class BlockchainTetrisGame { constructor(canvas, context) { this.canvas = canvas; this.context = context; this.gameType = 'blockchainTetris'; } start() { this.context.fillStyle = '#000'; this.context.fillRect(0, 0, this.canvas.width, this.canvas.height); this.context.fillStyle = '#fff'; this.context.font = '30px Arial'; this.context.fillText('Blockchain Tetris Game - Coming Soon!', 200, 300); } stop() {} togglePause() {} }

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.monadPlayhouse = new MonadPlayhouse();
});