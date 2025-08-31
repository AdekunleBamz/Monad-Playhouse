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
        // Game implementations
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

    showGameOverPopup(score, gameType) {
        // Create game over popup
        const popup = document.createElement('div');
        popup.id = 'gameOverPopup';
        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const popupContent = document.createElement('div');
        popupContent.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 3px solid #00ff88;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
        `;

        popupContent.innerHTML = `
            <h2 style="color: #00ff88; font-size: 2.5rem; margin-bottom: 20px;">Game Over!</h2>
            <p style="color: #fff; font-size: 1.5rem; margin-bottom: 10px;">Final Score: <span style="color: #ff6b9d; font-weight: bold;">${score}</span></p>
            <p style="color: #ccc; font-size: 1rem; margin-bottom: 30px;">Game: ${gameType}</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="playAgainBtn" style="background: linear-gradient(45deg, #00ff88, #00d4ff); color: #000; padding: 15px 30px; border: none; border-radius: 25px; font-size: 16px; font-weight: bold; cursor: pointer;">Play Again</button>
                <button id="mainMenuBtn" style="background: rgba(255, 107, 157, 0.2); border: 2px solid #ff6b9d; color: #ff6b9d; padding: 15px 30px; border-radius: 25px; font-size: 16px; cursor: pointer;">Main Menu</button>
            </div>
        `;

        popup.appendChild(popupContent);
        document.body.appendChild(popup);

        // Add event listeners
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            popup.remove();
            this.startGame(gameType, false);
        });

        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            popup.remove();
            this.endGame();
        });
    }

    async submitScore() {
        try {
            console.log('Submitting score:', this.currentScore);

            // Get player name from localStorage or use default
            const playerName = localStorage.getItem('monadPlayhouseUsername') || 'Anonymous';
            const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);

            // Submit to local leaderboard
            if (this.leaderboardManager) {
                await this.leaderboardManager.submitScore(this.currentGame.gameType, this.currentScore, playerName, gameDuration);
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

// Working Game Implementations
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
        this.setupControls();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key) {
                case 'ArrowUp': if (this.direction !== 'down') this.direction = 'up'; break;
                case 'ArrowDown': if (this.direction !== 'up') this.direction = 'down'; break;
                case 'ArrowLeft': if (this.direction !== 'right') this.direction = 'left'; break;
                case 'ArrowRight': if (this.direction !== 'left') this.direction = 'right'; break;
            }
        });
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
        window.monadPlayhouse.showGameOverPopup(this.score, this.gameType);
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
            window.monadPlayhouse.currentScore = this.score;
            this.generateFood();
        } else {
            this.snake.pop();
        }

        if (this.checkCollision()) {
            this.stop();
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

class MemoryGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.gameType = 'memory';
        this.isRunning = false;
        this.isPaused = false;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.score = 0;
        this.initializeCards();
    }

    initializeCards() {
        const symbols = ['🎮', '🎯', '🏆', '🎲', '🎪', '🎨', '🎭', '🎪'];
        this.cards = [];
        for (let i = 0; i < 8; i++) {
            this.cards.push({symbol: symbols[i], flipped: false, matched: false});
            this.cards.push({symbol: symbols[i], flipped: false, matched: false});
        }
        // Shuffle cards
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    start() {
        this.isRunning = true;
        this.draw();
        this.setupClickHandler();
    }

    stop() {
        this.isRunning = false;
        window.monadPlayhouse.showGameOverPopup(this.score, this.gameType);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    setupClickHandler() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cardIndex = this.getCardIndex(x, y);
            if (cardIndex !== -1 && !this.cards[cardIndex].flipped && !this.cards[cardIndex].matched) {
                this.flipCard(cardIndex);
            }
        });
    }

    getCardIndex(x, y) {
        const cardWidth = 100;
        const cardHeight = 100;
        const cardsPerRow = 4;
        
        const row = Math.floor(y / cardHeight);
        const col = Math.floor(x / cardWidth);
        const index = row * cardsPerRow + col;
        
        return index >= 0 && index < this.cards.length ? index : -1;
    }

    flipCard(index) {
        this.cards[index].flipped = true;
        this.flippedCards.push(index);
        
        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 500);
        }
        
        this.draw();
    }

    checkMatch() {
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];
        
        if (card1.symbol === card2.symbol) {
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;
            this.score += 20;
            window.monadPlayhouse.currentScore = this.score;
            
            if (this.matchedPairs === 8) {
                this.stop();
            }
                        } else {
            card1.flipped = false;
            card2.flipped = false;
        }
        
        this.flippedCards = [];
        this.draw();
    }

    draw() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.context.fillStyle = '#fff';
        this.context.font = '16px Arial';
        this.context.fillText(`Score: ${this.score} | Pairs: ${this.matchedPairs}/8`, 10, 30);
        
        const cardWidth = 100;
        const cardHeight = 100;
        const cardsPerRow = 4;
        
        this.cards.forEach((card, index) => {
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;
            const x = col * cardWidth + 50;
            const y = row * cardHeight + 100;
            
            // Draw card background
            this.context.fillStyle = card.matched ? '#00ff88' : card.flipped ? '#4ecdc4' : '#666';
            this.context.fillRect(x, y, cardWidth - 10, cardHeight - 10);
            
            // Draw card border
            this.context.strokeStyle = '#fff';
            this.context.lineWidth = 2;
            this.context.strokeRect(x, y, cardWidth - 10, cardHeight - 10);
            
            // Draw symbol or question mark
            if (card.flipped || card.matched) {
                this.context.fillStyle = '#000';
                this.context.font = '40px Arial';
                this.context.textAlign = 'center';
                this.context.fillText(card.symbol, x + cardWidth/2 - 5, y + cardHeight/2 + 15);
        } else {
                this.context.fillStyle = '#fff';
                this.context.font = '40px Arial';
                this.context.textAlign = 'center';
                this.context.fillText('?', x + cardWidth/2 - 5, y + cardHeight/2 + 15);
            }
        });
    }
}

class MathGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.gameType = 'math';
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.currentProblem = null;
        this.userAnswer = '';
        this.generateProblem();
        this.setupInput();
    }

    generateProblem() {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        let answer;
        switch(operator) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
        }
        
        this.currentProblem = {
            question: `${num1} ${operator} ${num2} = ?`,
            answer: answer
        };
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            
            if (e.key >= '0' && e.key <= '9') {
                this.userAnswer += e.key;
            } else if (e.key === 'Enter') {
                this.checkAnswer();
            } else if (e.key === 'Backspace') {
                this.userAnswer = this.userAnswer.slice(0, -1);
            }
            
            this.draw();
        });
    }

    checkAnswer() {
        const userNum = parseInt(this.userAnswer);
        if (userNum === this.currentProblem.answer) {
            this.score += 10;
            window.monadPlayhouse.currentScore = this.score;
            this.generateProblem();
            window.monadPlayhouse.showNotification('Correct! +10 points', 'success');
        } else {
            window.monadPlayhouse.showNotification(`Wrong! The answer was ${this.currentProblem.answer}`, 'error');
            this.stop();
        }
        this.userAnswer = '';
        this.draw();
    }

    start() {
        this.isRunning = true;
        this.draw();
    }

    stop() {
        this.isRunning = false;
        window.monadPlayhouse.showGameOverPopup(this.score, this.gameType);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }

    draw() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.context.fillStyle = '#fff';
        this.context.font = '30px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(`Score: ${this.score}`, this.canvas.width/2, 50);
        
        this.context.font = '40px Arial';
        this.context.fillText(this.currentProblem.question, this.canvas.width/2, 200);
        
        this.context.font = '30px Arial';
        this.context.fillText(`Your answer: ${this.userAnswer}`, this.canvas.width/2, 300);
        
        this.context.font = '20px Arial';
        this.context.fillText('Press Enter to submit', this.canvas.width/2, 400);
    }
}

class ColorGame { 
    constructor(canvas, context) { 
        this.canvas = canvas; 
        this.context = context; 
        this.gameType = 'color'; 
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.sequence = [];
        this.userSequence = [];
        this.level = 1;
        this.waitingForUser = false;
    } 
    
    start() { 
        this.isRunning = true;
        this.generateSequence();
        this.showSequence();
    } 
    
    stop() { 
        this.isRunning = false;
        window.monadPlayhouse.showGameOverPopup(this.score, this.gameType);
    } 
    
    togglePause() { 
        this.isPaused = !this.isPaused; 
    }
    
    generateSequence() {
        this.sequence = [];
        for (let i = 0; i < this.level; i++) {
            this.sequence.push(Math.floor(Math.random() * 4));
        }
    }
    
    showSequence() {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= this.sequence.length) {
                clearInterval(interval);
                this.waitingForUser = true;
                this.draw();
                return;
            }
            this.highlightColor(this.sequence[i]);
            i++;
        }, 1000);
    }
    
    highlightColor(colorIndex) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
        this.context.fillStyle = colors[colorIndex];
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        setTimeout(() => {
            this.context.fillStyle = '#000';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.draw();
        }, 500);
    }
    
    setupClickHandler() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.isRunning || this.isPaused || !this.waitingForUser) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const colorIndex = this.getColorIndex(x, y);
            if (colorIndex !== -1) {
                this.userSequence.push(colorIndex);
                this.highlightColor(colorIndex);
                
                if (this.userSequence.length === this.sequence.length) {
                    this.checkSequence();
                }
            }
        });
    }

    getColorIndex(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (x < centerX && y < centerY) return 0; // Red
        if (x >= centerX && y < centerY) return 1; // Green
        if (x < centerX && y >= centerY) return 2; // Blue
        if (x >= centerX && y >= centerY) return 3; // Yellow
        return -1;
    }
    
    checkSequence() {
        let correct = true;
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.sequence[i] !== this.userSequence[i]) {
                correct = false;
                break;
            }
        }
        
        if (correct) {
            this.score += 10;
            window.monadPlayhouse.currentScore = this.score;
            this.level++;
            this.userSequence = [];
            this.generateSequence();
            setTimeout(() => this.showSequence(), 1000);
        } else {
            this.stop();
        }
    }
    
    draw() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw color quadrants
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.context.fillStyle = '#ff0000';
        this.context.fillRect(0, 0, centerX, centerY);
        
        this.context.fillStyle = '#00ff00';
        this.context.fillRect(centerX, 0, centerX, centerY);
        
        this.context.fillStyle = '#0000ff';
        this.context.fillRect(0, centerY, centerX, centerY);
        
        this.context.fillStyle = '#ffff00';
        this.context.fillRect(centerX, centerY, centerX, centerY);
        
        // Draw score
        this.context.fillStyle = '#fff';
        this.context.font = '20px Arial';
        this.context.fillText(`Score: ${this.score} | Level: ${this.level}`, 10, 30);
        
        if (this.waitingForUser) {
            this.context.fillStyle = '#fff';
            this.context.font = '24px Arial';
            this.context.textAlign = 'center';
            this.context.fillText('Click the colors in the same sequence!', this.canvas.width/2, 550);
        }
        
        // Setup click handler if not already done
        if (this.waitingForUser && !this.clickHandlerSet) {
            this.setupClickHandler();
            this.clickHandlerSet = true;
        }
    }
}

// Simple placeholder implementations for remaining games
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