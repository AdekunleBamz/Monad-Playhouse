// Monad Playhouse - Mission 7 Game Jam Entry
// Modern JavaScript with ES6+ features, sound effects, and 6 games

class MonadPlayhouse {
    constructor() {
        this.currentGame = null;
        this.gameState = 'menu';
        this.soundEnabled = true;
        this.scores = {
            snake: 0,
            memory: 0,
            math: 0,
            color: 0,
            tetris: 0,
            flappy: 0,
            spelling: 0,
            carRace: 0,
            monadRunner: 0,
            cryptoPuzzle: 1,
            tokenCollector: 0,
            blockchainTetris: 0
        };
        this.gameTimer = null;
        this.startTime = null;
        this.sounds = {};
        this.gameOverReason = '';
        this.playerName = '';
        this.paymentRequired = true;
        
        this.init();
    }

    async init() {
        this.hideLoadingScreen();
        this.setupEventListeners();
        this.initSounds();
        
        // Initialize blockchain systems
        await this.initBlockchainSystems();
        
        this.loadScores();
        this.showMenu();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            } else {
                console.warn('Loading screen element not found');
            }
        }, 2000);
    }

    initSounds() {
        try {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate different sound frequencies for different effects
        this.sounds = {
            click: () => this.playTone(800, 0.1),
            success: () => this.playTone(1200, 0.2),
            error: () => this.playTone(400, 0.3),
            gameOver: () => this.playTone(200, 0.5)
        };
            
            console.log('Sounds initialized successfully:', Object.keys(this.sounds));
        } catch (error) {
            console.error('Failed to initialize sounds:', error);
            // Fallback to silent sounds
            this.sounds = {
                click: () => {},
                success: () => {},
                error: () => {},
                gameOver: () => {}
            };
        }
    }

    playTone(frequency, duration) {
        if (!this.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    setupEventListeners() {
        // Game card clicks
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const gameType = e.currentTarget.dataset.game;
                this.startGame(gameType);
                this.sounds.click();
            });
        });

        // Control buttons
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.toggleSound();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        const fullscreenToggle = document.getElementById('fullscreenToggle');
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('click', () => {
                this.toggleFullscreen();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        const paymentToggle = document.getElementById('paymentToggle');
        if (paymentToggle) {
            paymentToggle.addEventListener('click', () => {
                this.togglePaymentRequirement();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }



        // Wallet connect button - handled by wallet-manager.js
        // Removed duplicate event listener to prevent conflicts
        
        // Wallet status updates handled by wallet-manager.js

        // Game controls
        const backToMenu = document.getElementById('backToMenu');
        if (backToMenu) {
            backToMenu.addEventListener('click', () => {
                this.showMenu();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        const pauseGame = document.getElementById('pauseGame');
        if (pauseGame) {
            pauseGame.addEventListener('click', () => {
                this.togglePause();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        const restartGame = document.getElementById('restartGame');
        if (restartGame) {
            restartGame.addEventListener('click', () => {
                this.restartGame();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        // Overlay buttons
        const playAgain = document.getElementById('playAgain');
        if (playAgain) {
            playAgain.addEventListener('click', () => {
                this.restartGame();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        const backToMain = document.getElementById('backToMain');
        if (backToMain) {
            backToMain.addEventListener('click', () => {
                this.showMenu();
                if (this.sounds && this.sounds.click) {
                    this.sounds.click();
                }
            });
        }

        // Global keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    async initBlockchainSystems() {
        try {
            console.log('Starting blockchain systems initialization...');
            
            // Initialize wallet first
            console.log('Initializing MonadWallet...');
            window.monadWallet = new MonadWallet();
            await window.monadWallet.init();
            console.log('MonadWallet initialized:', !!window.monadWallet);
            
            // Initialize wallet manager
                    console.log('Wallet system ready');
            
            // Initialize leaderboard with proper timing
            console.log('Initializing LeaderboardManager...');
            window.leaderboardManager = new LeaderboardManager();
            await window.leaderboardManager.init();
            console.log('LeaderboardManager initialized:', !!window.leaderboardManager);
            
            // Initialize payment gateway
            console.log('Initializing PaymentGateway...');
            window.paymentGateway = new PaymentGateway();
            await window.paymentGateway.init();
            console.log('PaymentGateway initialized:', !!window.paymentGateway);
            
            console.log('Blockchain systems initialized successfully');
            
            // Verify all systems are working
            if (!window.monadWallet) {
                throw new Error('Wallet manager failed to initialize');
            }
            if (!window.monadWallet) {
                throw new Error('Monad wallet failed to initialize');
            }
            if (!window.leaderboardManager) {
                throw new Error('Leaderboard manager failed to initialize');
            }
            if (!window.paymentGateway) {
                throw new Error('Payment gateway failed to initialize');
            }
            
            // Ensure leaderboard button is visible
            setTimeout(() => {
                const leaderboardBtn = document.getElementById('showLeaderboard');
                if (!leaderboardBtn) {
                    console.warn('Leaderboard button not found, creating fallback...');
                    this.createLeaderboardButtonFallback();
                } else {
                    console.log('Leaderboard button found and ready');
                }
            }, 2000);
            
        } catch (error) {
            console.error('Failed to initialize blockchain systems:', error);
            // Show user-friendly error message
            this.showWalletRequiredMessage();
        }
    }

    // Create leaderboard button fallback
    createLeaderboardButtonFallback() {
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.id = 'showLeaderboard';
        leaderboardBtn.className = 'control-btn';
        leaderboardBtn.innerHTML = '🏆';
        leaderboardBtn.title = 'View Leaderboard';
        leaderboardBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        leaderboardBtn.addEventListener('click', () => {
            if (window.leaderboardManager) {
                window.leaderboardManager.show();
            } else {
                console.error('Leaderboard manager not available');
            }
        });
        
        document.body.appendChild(leaderboardBtn);
        console.log('Leaderboard button fallback created');
    }
    
    // Show message when wallet is required
    showWalletRequiredMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #4ecdc4;
            border-radius: 15px;
            padding: 30px;
            color: #fff;
            text-align: center;
            z-index: 10000;
            max-width: 500px;
            box-shadow: 0 0 30px rgba(78, 205, 196, 0.3);
        `;
        message.innerHTML = `
            <h2 style="color: #4ecdc4; margin-bottom: 20px;">🔗 Wallet Required</h2>
            <p style="margin-bottom: 20px;">This app requires a blockchain wallet to function.</p>
            <p style="margin-bottom: 20px;">Please install MetaMask or a compatible wallet extension.</p>
            <button onclick="this.parentElement.remove()" style="
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-weight: bold;
            ">Got it</button>
        `;
        document.body.appendChild(message);
    }

    // Toggle payment requirement
    togglePaymentRequirement() {
        this.paymentRequired = !this.paymentRequired;
        const paymentBtn = document.getElementById('paymentToggle');
        paymentBtn.textContent = this.paymentRequired ? '💰' : '🆓';
        
        // Show notification
        this.showNotification(
            this.paymentRequired ? 'Payment Required Mode' : 'Free Play Mode',
            this.paymentRequired ? 'Games now require 0.1 MON entry fee' : 'Games are now free to play'
        );
    }

    // Start game with payment or free play option
    startGame(gameType) {
        // Mission 7: All games require 0.1 MON payment
        this.showPaymentOptions(gameType);
    }
    
    // Show payment options modal
    showPaymentOptions(gameType) {
        const modal = document.createElement('div');
        modal.className = 'payment-options-modal';
        modal.innerHTML = `
            <div class="payment-options-content">
                <h3>🎮 Premium Game Access</h3>
                <div class="options">
                    <div class="option premium">
                        <h4>💎 Premium Mode</h4>
                        <p>Play with 0.1 MON entry fee</p>
                        <ul>
                            <li>🏆 Compete on global leaderboard</li>
                            <li>💰 Share in prize pool rewards</li>
                            <li>🔗 Get on-chain records on Monad</li>
                        </ul>
                        <button class="premium-btn" data-game="${gameType}">Play Premium</button>
                    </div>
                </div>
                <button class="close-btn">✕</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .payment-options-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .payment-options-content {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 20px;
                padding: 30px;
                border: 2px solid #4ecdc4;
                box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
                max-width: 500px;
                width: 90%;
                position: relative;
            }
            .payment-options-content h3 {
                color: #4ecdc4;
                text-align: center;
                margin-bottom: 30px;
                font-size: 24px;
            }
            .options {
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .option {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            .option:hover {
                border-color: #4ecdc4;
                transform: translateY(-5px);
            }
            .option h4 {
                color: #4ecdc4;
                margin-bottom: 10px;
                font-size: 18px;
            }
            .option p {
                color: #ccc;
                margin-bottom: 15px;
            }
            .option ul {
                list-style: none;
                padding: 0;
                margin-bottom: 20px;
            }
            .option li {
                color: #888;
                margin-bottom: 5px;
                font-size: 14px;
            }
            .premium-btn {
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
            }
            .premium-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
            }
            .close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                background: #ff4444;
                color: white;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
            }

        `;
        document.head.appendChild(style);

        // Event listeners
        modal.querySelector('.premium-btn').addEventListener('click', (e) => {
            const gameType = e.target.dataset.game;
            modal.remove();
            style.remove();
            this.startPremiumGame(gameType);
        });
        
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
            style.remove();
        });

        document.body.appendChild(modal);
    }
    
    // Start premium game with payment
    async startPremiumGame(gameType) {
        try {
            // Check if wallet is connected
            if (!window.monadWallet || !window.monadWallet.isConnected) {
                this.showNotification('Wallet Required', 'Please connect your wallet to play premium games');
                        if (window.monadWallet && window.monadWallet.isConnected) {
            console.log('Wallet connected:', window.monadWallet.address);
                } else {
                    console.warn('Wallet manager not available');
                }
                return;
            }

            // Check if payment is required
            if (window.paymentGateway && window.paymentGateway.isPaymentRequiredForGame && window.paymentGateway.isPaymentRequiredForGame(gameType)) {
                if (window.paymentGateway.show) {
                    window.paymentGateway.show(gameType);
                } else {
                    console.warn('Payment gateway show method not available');
                }
                return;
            }
            
            this.startGameWithPayment(gameType, this.playerName);
        } catch (error) {
            console.error('Failed to start premium game:', error);
            this.showNotification('Failed to start premium game. Please try again.');
        }
    }
    


    startGameWithPayment(gameType, playerName) {
        try {
            console.log('startGameWithPayment called with:', { gameType, playerName });
            
            // Set the player name for score submission
            this.playerName = playerName;
            console.log('Player name set to:', this.playerName);
            
            // Check if required DOM elements exist
            const gameMenu = document.getElementById('gameMenu');
            const gameCanvas = document.getElementById('gameCanvas');
            const gameCanvasElement = document.getElementById('gameCanvasElement');
            const currentGameName = document.getElementById('currentGameName');
            
            console.log('DOM elements found:', {
                gameMenu: !!gameMenu,
                gameCanvas: !!gameCanvas,
                gameCanvasElement: !!gameCanvasElement,
                currentGameName: !!currentGameName
            });
            
            if (!gameMenu || !gameCanvas || !gameCanvasElement || !currentGameName) {
                throw new Error('Required DOM elements not found');
            }
            
        this.currentGame = gameType;
        this.playerName = playerName;
        this.gameState = 'playing';
        this.startTime = Date.now();
        this.gameStartTime = Date.now(); // Track actual game start time for duration validation
        this.scoreSubmissionInProgress = false; // Reset submission flag
        
            console.log('Game state set to playing, starting timer...');
            gameMenu.style.display = 'none';
            gameCanvas.style.display = 'block';
            currentGameName.textContent = this.getGameDisplayName(gameType);
            
            console.log('Starting game timer...');
        this.startGameTimer();
            
            console.log('Initializing game:', gameType);
        this.initializeGame(gameType);
            
            console.log('Premium game started successfully!');
            
            // Show success notification
            this.showNotification('Game Started!', `Premium ${this.getGameDisplayName(gameType)} is now running!`);
            
        } catch (error) {
            console.error('Error in startGameWithPayment:', error);
            
            // Reset game state on failure
            this.gameState = 'menu';
            if (gameMenu) gameMenu.style.display = 'block';
            if (gameCanvas) gameCanvas.style.display = 'none';
            
            // Show error notification
            this.showNotification('Game Start Failed', `Failed to start premium game: ${error.message}`);
            
            // Show more detailed error in console
            console.error('Game start failure details:', {
                error: error.message,
                stack: error.stack,
                gameType,
                playerName,
                gameState: this.gameState
            });
            
            throw error; // Re-throw to be caught by the calling function
        }
    }

    getGameDisplayName(gameType) {
        const names = {
            snake: 'Neon Snake',
            memory: 'Memory Match',
            math: 'Quick Math',
            color: 'Color Rush',
            tetris: 'Neon Tetris',
            flappy: 'Flappy Bird',
            spelling: 'Spelling Bee',
            carRace: 'Car Race'
        };
        return names[gameType] || 'Game';
    }

    initializeGame(gameType) {
        try {
            console.log('initializeGame called with gameType:', gameType);
            
        const canvas = document.getElementById('gameCanvasElement');
        const ctx = canvas.getContext('2d');
            
            console.log('Canvas context obtained:', !!ctx);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
            console.log('Canvas cleared');
        
        switch(gameType) {
            case 'snake':
                    console.log('Initializing snake game...');
                this.initSnakeGame(ctx, canvas);
                break;
            case 'memory':
                    console.log('Initializing memory game...');
                this.initMemoryGame(ctx, canvas);
                break;
            case 'math':
                    console.log('Initializing math game...');
                this.initMathGame(ctx, canvas);
                break;
            case 'color':
                    console.log('Initializing color game...');
                this.initColorGame(ctx, canvas);
                break;
            case 'tetris':
                    console.log('Initializing tetris game...');
                this.initTetrisGame(ctx, canvas);
                break;
            case 'flappy':
                    console.log('Initializing flappy game...');
                this.initFlappyGame(ctx, canvas);
                break;
            case 'spelling':
                    console.log('Initializing spelling game...');
                this.initSpellingGame(ctx, canvas);
                break;
            case 'carRace':
                    console.log('Initializing car race game...');
                this.initCarRaceGame(ctx, canvas);
                break;
            case 'monadRunner':
                    console.log('Initializing Monad Runner game...');
                this.initMonadRunnerGame(ctx, canvas);
                break;
            case 'cryptoPuzzle':
                    console.log('Initializing Crypto Puzzle game...');
                this.initCryptoPuzzleGame(ctx, canvas);
                break;
            case 'tokenCollector':
                    console.log('Initializing Token Collector game...');
                this.initTokenCollectorGame(ctx, canvas);
                break;
            case 'blockchainTetris':
                    console.log('Initializing Blockchain Tetris game...');
                this.initBlockchainTetrisGame(ctx, canvas);
                break;
                default:
                    throw new Error(`Unknown game type: ${gameType}`);
            }
            
            console.log('Game initialization completed successfully');
        } catch (error) {
            console.error('Error in initializeGame:', error);
            throw error;
        }
    }

    // Enhanced Snake Game with Game Over Prompt
    initSnakeGame(ctx, canvas) {
        const snake = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: 20,
            speed: 5,
            dx: 20,
            dy: 0,
            body: [{x: canvas.width / 2, y: canvas.height / 2}],
            food: this.generateFood(canvas)
        };

        this.snake = snake; // Store reference for keyboard controls

        let gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }

            // Move snake
            snake.x += snake.dx;
            snake.y += snake.dy;

            // Wrap around edges
            if (snake.x < 0) snake.x = canvas.width;
            if (snake.x > canvas.width) snake.x = 0;
            if (snake.y < 0) snake.y = canvas.height;
            if (snake.y > canvas.height) snake.y = 0;

            // Check food collision
            if (Math.abs(snake.x - snake.food.x) < snake.size && Math.abs(snake.y - snake.food.y) < snake.size) {
                snake.body.push({...snake.body[snake.body.length - 1]});
                snake.food = this.generateFood(canvas);
                this.scores.snake += 10;
                this.updateScore('snake');
                this.sounds.success();
            }

            // Update body
            for (let i = snake.body.length - 1; i > 0; i--) {
                snake.body[i] = {...snake.body[i-1]};
            }
            snake.body[0] = {x: snake.x, y: snake.y};

            // Check self collision
            for (let i = 1; i < snake.body.length; i++) {
                if (Math.abs(snake.x - snake.body[i].x) < snake.size && Math.abs(snake.y - snake.body[i].y) < snake.size) {
                    this.gameOver('snake', 'Snake bit itself!');
                    clearInterval(gameLoop);
                    return;
                }
            }

            // Draw everything
            this.drawSnakeGame(ctx, canvas, snake);
        }, 150);

        this.currentGameLoop = gameLoop;
    }

    generateFood(canvas) {
        return {
            x: Math.floor(Math.random() * (canvas.width / 20)) * 20,
            y: Math.floor(Math.random() * (canvas.height / 20)) * 20
        };
    }

    drawSnakeGame(ctx, canvas, snake) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw snake
        snake.body.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#00ff88' : '#00d4ff';
            ctx.fillRect(segment.x, segment.y, snake.size - 2, snake.size - 2);
            
            // Add glow effect
            ctx.shadowColor = index === 0 ? '#00ff88' : '#00d4ff';
            ctx.shadowBlur = 10;
        });

        // Draw food
        ctx.fillStyle = '#ff6b9d';
        ctx.shadowColor = '#ff6b9d';
        ctx.shadowBlur = 15;
        ctx.fillRect(snake.food.x, snake.food.y, snake.size - 2, snake.size - 2);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw score with reduced text size
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.scores.snake}`, 20, 20);
        
        // Draw instructions with reduced text size
        ctx.fillStyle = '#cccccc';
        ctx.font = '8px Exo 2';
        ctx.fillText('Use arrow keys to move', 20, 35);
    }

    // Enhanced Memory Game with Game Over Prompt
    initMemoryGame(ctx, canvas) {
        console.log('Memory game initializing...');
        // Reset game state completely
        this.memoryGameState = {
            cards: this.generateMemoryCards(),
            flippedCards: [],
            matchedPairs: 0,
            canFlip: true,
            startTime: Date.now()
        };
        
        let { cards, flippedCards, matchedPairs, canFlip, startTime } = this.memoryGameState;

        const drawMemoryGame = () => {
            console.log('Drawing memory game...');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid of cards
            cards.forEach((card, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const x = col * 100 + 200;
                const y = row * 100 + 100;

                if (card.isMatched) {
                    // Correctly matched cards - green background
                    console.log(`Card ${index} (${card.symbol}) is MATCHED - drawing GREEN`);
                    ctx.fillStyle = '#00ff88';
                    ctx.fillRect(x, y, 80, 80);
                    ctx.fillStyle = '#000';
                    ctx.font = '40px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(card.symbol, x + 40, y + 55);
                } else if (card.isFlipped) {
                    // Currently flipped cards - blue background
                    console.log(`Card ${index} (${card.symbol}) is FLIPPED - drawing BLUE`);
                    ctx.fillStyle = '#00d4ff';
                    ctx.fillRect(x, y, 80, 80);
                    ctx.fillStyle = '#000';
                    ctx.font = '40px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(card.symbol, x + 40, y + 55);
                } else {
                    // Hidden cards - pink with question mark
                    console.log(`Card ${index} (${card.symbol}) is HIDDEN - drawing PINK with ?`);
                    ctx.fillStyle = '#ff6b9d';
                    ctx.fillRect(x, y, 80, 80);
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', x + 40, y + 50);
                }
            });

            // Draw score with reduced text size
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Pairs: ${matchedPairs}/8`, 20, 20);
            
            // Draw time with reduced text size
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            ctx.fillText(`Time: ${elapsed}s`, 20, 35);
            
            // Draw instructions with reduced text size
            ctx.fillStyle = '#cccccc';
            ctx.font = '8px Exo 2';
            ctx.fillText('Click cards to match pairs', 20, 50);
        };

        // Handle card clicks
        const clickHandler = (e) => {
            if (!canFlip) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor((x - 200) / 100);
            const row = Math.floor((y - 100) / 100);
            const index = row * 4 + col;

            if (index >= 0 && index < cards.length && !cards[index].isFlipped && !cards[index].isMatched) {
                console.log(`Card ${index} clicked, flipping card with symbol: ${cards[index].symbol}`);
                cards[index].isFlipped = true;
                this.memoryGameState.flippedCards.push(index);
                flippedCards = this.memoryGameState.flippedCards;
                this.sounds.click();

                if (flippedCards.length === 2) {
                    console.log(`Two cards flipped: ${flippedCards[0]} (${cards[flippedCards[0]].symbol}) and ${flippedCards[1]} (${cards[flippedCards[1]].symbol})`);
                    this.memoryGameState.canFlip = false;
                    canFlip = false;
                    setTimeout(() => {
                        if (cards[flippedCards[0]].symbol === cards[flippedCards[1]].symbol) {
                            // Correct match - keep them green
                            console.log('Correct match! Setting cards to matched state');
                            cards[flippedCards[0]].isMatched = true;
                            cards[flippedCards[1]].isMatched = true;
                            this.memoryGameState.matchedPairs++;
                            matchedPairs = this.memoryGameState.matchedPairs;
                            this.sounds.success();
                            
                            if (matchedPairs === 8) {
                                const finalTime = Math.floor((Date.now() - startTime) / 1000);
                                this.scores.memory = finalTime;
                                this.updateScore('memory');
                                this.gameOver('memory', 'All pairs matched!');
                            }
                        } else {
                            // Wrong match - flip them back to question marks
                            console.log('Wrong match detected, flipping cards back...');
                            cards[flippedCards[0]].isFlipped = false;
                            cards[flippedCards[1]].isFlipped = false;
                            this.sounds.error();
                            console.log('Cards flipped back to question marks');
                        }
                        this.memoryGameState.flippedCards = [];
                        this.memoryGameState.canFlip = true;
                        flippedCards = this.memoryGameState.flippedCards;
                        canFlip = this.memoryGameState.canFlip;
                    }, 1000); // 1 second delay to show the wrong pair
                }
            }
        };
        
        canvas.addEventListener('click', clickHandler);
        
        // Store cleanup function
        this.cleanupListeners = () => {
            canvas.removeEventListener('click', clickHandler);
        };

        // Start drawing loop
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                console.log('Memory game loop stopped - game state:', this.gameState);
                clearInterval(gameLoop);
                return;
            }
            drawMemoryGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    generateMemoryCards() {
        const symbols = ['🐍', '🧠', '🔢', '🎨', '⭐', '🌟', '🎉', '🔥'];
        const cards = [...symbols, ...symbols];
        
        // Shuffle cards
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }

        return cards.map(symbol => ({
            symbol,
            isFlipped: false,
            isMatched: false
        }));
    }

    // Enhanced Math Game with Game Over Prompt
    initMathGame(ctx, canvas) {
        console.log('Math game initializing...');
        // Reset game state completely
        this.mathGameState = {
            currentProblem: this.generateMathProblem(),
            userAnswer: '',
            timeLeft: 30,
            level: 1,
            isGameOver: false
        };
        
        let { currentProblem, userAnswer, timeLeft, level } = this.mathGameState;

        const drawMathGame = () => {
            console.log('Drawing math game...');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw problem
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(currentProblem.question, canvas.width / 2, 200);

            // Draw answer input
            ctx.fillStyle = '#00ff88';
            ctx.font = '36px Orbitron';
            ctx.fillText(`Answer: ${userAnswer}`, canvas.width / 2, 300);

            // Draw time and level with reduced text size
            ctx.fillStyle = '#ff6b9d';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Time: ${timeLeft}s`, 20, 20);
            ctx.fillText(`Level: ${level}`, 20, 35);

            // Draw instructions with reduced text size
            ctx.fillStyle = '#cccccc';
            ctx.font = '9px Exo 2';
            ctx.textAlign = 'center';
            ctx.fillText('Type your answer and press Enter', canvas.width / 2, 500);
        };

        // Handle keyboard input
        const keydownHandler = (e) => {
            if (this.mathGameState.isGameOver) return;
            
            if (e.key >= '0' && e.key <= '9') {
                this.mathGameState.userAnswer += e.key;
                userAnswer = this.mathGameState.userAnswer;
                this.sounds.click();
            } else if (e.key === 'Backspace') {
                this.mathGameState.userAnswer = this.mathGameState.userAnswer.slice(0, -1);
                userAnswer = this.mathGameState.userAnswer;
                this.sounds.click();
            } else if (e.key === 'Enter') {
                if (parseInt(userAnswer) === currentProblem.answer) {
                    this.scores.math += 10;
                    this.updateScore('math');
                    this.mathGameState.level++;
                    this.mathGameState.timeLeft += 10;
                    this.mathGameState.currentProblem = this.generateMathProblem(this.mathGameState.level);
                    this.mathGameState.userAnswer = '';
                    level = this.mathGameState.level;
                    timeLeft = this.mathGameState.timeLeft;
                    currentProblem = this.mathGameState.currentProblem;
                    userAnswer = this.mathGameState.userAnswer;
                    this.sounds.success();
                } else {
                    this.sounds.error();
                    console.log('Wrong answer entered, showing game over...');
                    this.mathGameState.isGameOver = true;
                    // Immediately show game over for wrong answer
                    setTimeout(() => {
                        console.log('Calling gameOver for wrong answer');
                    this.gameOver('math', 'Wrong answer!');
                    }, 100); // Very short delay to ensure smooth transition
                }
            }
        };
        
        document.addEventListener('keydown', keydownHandler);
        
        // Store cleanup function
        this.cleanupListeners = () => {
            document.removeEventListener('keydown', keydownHandler);
        };

        // Timer countdown
        const timer = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(timer);
                return;
            }
            timeLeft--;
            if (timeLeft <= 0) {
                this.gameOver('math', 'Time ran out!');
                clearInterval(timer);
            }
        }, 1000);

        // Start drawing loop
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                console.log('Math game loop stopped - game state:', this.gameState);
                clearInterval(gameLoop);
                return;
            }
            drawMathGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    generateMathProblem(level = 1) {
        const operations = ['+', '-', '*'];
        const op = operations[Math.floor(Math.random() * operations.length)];
        let a, b, answer;

        switch(op) {
            case '+':
                a = Math.floor(Math.random() * (10 * level)) + 1;
                b = Math.floor(Math.random() * (10 * level)) + 1;
                answer = a + b;
                break;
            case '-':
                a = Math.floor(Math.random() * (10 * level)) + 1;
                b = Math.floor(Math.random() * a) + 1;
                answer = a - b;
                break;
            case '*':
                a = Math.floor(Math.random() * (5 * level)) + 1;
                b = Math.floor(Math.random() * (5 * level)) + 1;
                answer = a * b;
                break;
        }

        return {
            question: `${a} ${op} ${b} = ?`,
            answer: answer
        };
    }

    // Enhanced Color Game with Game Over Prompt
    initColorGame(ctx, canvas) {
        console.log('Color game initializing...');
        const colors = ['#ff6b9d', '#00ff88', '#00d4ff', '#ffd700', '#ff4500'];
        // Reset game state completely
        this.colorGameState = {
            currentColor: colors[0],
            targetColor: colors[0],
            score: 0,
            timeLeft: 60,
            isGameOver: false
        };
        
        let { currentColor, targetColor, score, timeLeft } = this.colorGameState;

        const drawColorGame = () => {
            console.log('Drawing color game...');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw target color
            ctx.fillStyle = targetColor;
            ctx.fillRect(100, 100, 200, 200);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 5;
            ctx.strokeRect(100, 100, 200, 200);

            // Draw color options
            colors.forEach((color, index) => {
                const x = 400 + (index * 80);
                const y = 150;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 60, 60);
                ctx.strokeStyle = color === currentColor ? '#00ff88' : '#fff';
                ctx.lineWidth = color === currentColor ? 5 : 2;
                ctx.strokeRect(x, y, 60, 60);
            });

            // Draw score and time with reduced text size
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${score}`, 20, 20);
            ctx.fillText(`Time: ${timeLeft}s`, 20, 35);

            // Draw instructions with reduced text size
            ctx.fillStyle = '#cccccc';
            ctx.font = '9px Exo 2';
            ctx.fillText('Click the matching color!', 100, 350);
        };

        // Handle color selection
        const clickHandler = (e) => {
            if (this.colorGameState.isGameOver) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicked on color option
            if (y >= 150 && y <= 210) {
                for (let i = 0; i < colors.length; i++) {
                    const colorX = 400 + (i * 80);
                    if (x >= colorX && x <= colorX + 60) {
                        if (colors[i] === targetColor) {
                            this.colorGameState.score += 10;
                            this.scores.color = this.colorGameState.score;
                            this.updateScore('color');
                            this.colorGameState.targetColor = colors[Math.floor(Math.random() * colors.length)];
                            score = this.colorGameState.score;
                            targetColor = this.colorGameState.targetColor;
                            this.sounds.success();
                        } else {
                            this.sounds.error();
                            console.log('Wrong color selected, showing game over...');
                            this.colorGameState.isGameOver = true;
                            // Immediately show game over for wrong color
                            setTimeout(() => {
                                console.log('Calling gameOver for wrong color');
                            this.gameOver('color', 'Wrong color!');
                            }, 100); // Very short delay to ensure smooth transition
                        }
                        break;
                    }
                }
            }
        };
        
        canvas.addEventListener('click', clickHandler);
        
        // Store cleanup function
        this.cleanupListeners = () => {
            canvas.removeEventListener('click', clickHandler);
        };

        // Timer countdown
        const timer = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(timer);
                return;
            }
            timeLeft--;
            if (timeLeft <= 0) {
                this.gameOver('color', 'Time ran out!');
                clearInterval(timer);
            }
        }, 1000);

        // Start drawing loop
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                console.log('Color game loop stopped - game state:', this.gameState);
                clearInterval(gameLoop);
                return;
            }
            drawColorGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    // FIXED Tetris Game with Working Controls and Faster Drop Speed
    initTetrisGame(ctx, canvas) {
        const board = Array(20).fill().map(() => Array(10).fill(0));
        let currentPiece = this.getRandomPiece();
        let pieceX = 3;
        let pieceY = 0;
        let lines = 0;
        let dropTime = 0;
        let gameActive = true;

        // Store tetris game state for keyboard controls
        this.tetrisGame = { board, currentPiece, pieceX, pieceY, lines, dropTime, gameActive };

        const drawTetrisGame = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw board
            board.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        ctx.fillStyle = '#00ff88';
                        ctx.fillRect(x * 30 + 250, y * 30 + 50, 28, 28);
                    }
                });
            });

            // Draw current piece
            currentPiece.forEach((row, y) => {
                row.forEach((cell, x) => {
                    if (cell) {
                        ctx.fillStyle = '#ff6b9d';
                        ctx.fillRect((pieceX + x) * 30 + 250, (pieceY + y) * 30 + 50, 28, 28);
                    }
                });
            });

            // Draw score and lines with reduced text size
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Lines: ${lines}`, 20, 20);
            ctx.fillText(`Score: ${this.scores.tetris}`, 20, 35);

            // Draw instructions with reduced text size
            ctx.fillStyle = '#cccccc';
            ctx.font = '8px Exo 2';
            ctx.fillText('Arrow keys to move', 20, 50);
            ctx.fillText('Space to rotate', 20, 65);
        };

        // Game loop with faster drop speed (0.5x faster)
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing' || !gameActive) {
                clearInterval(gameLoop);
                return;
            }

            dropTime++;
            if (dropTime > 20) { // Changed from 30 to 20 for faster drop
                pieceY++;
                dropTime = 0;
                
                if (this.checkTetrisCollision()) {
                    pieceY--;
                    this.placeTetrisPiece();
                    this.clearTetrisLines();
                    currentPiece = this.getRandomPiece();
                    pieceX = 3;
                    pieceY = 0;
                    
                    if (this.checkTetrisCollision()) {
                        gameActive = false;
                        this.gameOver('tetris', 'Board is full!');
                        clearInterval(gameLoop);
                        return;
                    }
                }
            }

            // Update stored game state
            this.tetrisGame = { board, currentPiece, pieceX, pieceY, lines, dropTime, gameActive };

            drawTetrisGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    getRandomPiece() {
        const pieces = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];
        return pieces[Math.floor(Math.random() * pieces.length)];
    }

    checkTetrisCollision() {
        if (!this.tetrisGame) return false;
        
        const { board, currentPiece, pieceX, pieceY } = this.tetrisGame;
        
        return currentPiece.some((row, y) => {
            return row.some((cell, x) => {
                if (cell) {
                    const newX = pieceX + x;
                    const newY = pieceY + y;
                    return newX < 0 || newX >= 10 || newY >= 20 || 
                           (newY >= 0 && board[newY][newX]);
                }
                return false;
            });
        });
    }

    placeTetrisPiece() {
        if (!this.tetrisGame) return;
        
        const { board, currentPiece, pieceX, pieceY } = this.tetrisGame;
        
        currentPiece.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    board[pieceY + y][pieceX + x] = 1;
                }
            });
        });
    }

    clearTetrisLines() {
        if (!this.tetrisGame) return;
        
        const { board } = this.tetrisGame;
        
        for (let y = board.length - 1; y >= 0; y--) {
            if (board[y].every(cell => cell)) {
                board.splice(y, 1);
                board.unshift(Array(10).fill(0));
                this.tetrisGame.lines++;
                this.scores.tetris = this.tetrisGame.lines * 10;
                this.updateScore('tetris');
                this.sounds.success();
            }
        }
    }

    // Enhanced Flappy Bird Game with Game Over Prompt
    initFlappyGame(ctx, canvas) {
        const bird = { x: 100, y: canvas.height / 2, velocity: 0, size: 20 };
        const pipes = [];
        let score = 0;
        let frame = 0;
        let gameActive = true;

        const drawFlappyGame = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw bird
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(bird.x, bird.y, bird.size, bird.size);

            // Draw pipes
            pipes.forEach(pipe => {
                ctx.fillStyle = '#00ff88';
                ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
                ctx.fillRect(pipe.x, pipe.topHeight + pipe.gap, pipe.width, canvas.height - pipe.topHeight - pipe.gap);
            });

            // Draw score with reduced text size
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${score}`, 20, 20);

            // Draw instructions with reduced text size
            ctx.fillStyle = '#cccccc';
            ctx.font = '8px Exo 2';
            ctx.fillText('Click or press Space to flap', 20, 35);
        };

        // Game loop
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing' || !gameActive) {
                clearInterval(gameLoop);
                return;
            }

            frame++;
            
            // Bird physics
            bird.velocity += 0.5;
            bird.y += bird.velocity;

            // Generate pipes
            if (frame % 150 === 0) {
                const gap = 150;
                const topHeight = Math.random() * (canvas.height - gap - 100) + 50;
                pipes.push({
                    x: canvas.width,
                    width: 50,
                    topHeight: topHeight,
                    gap: gap
                });
            }

            // Move pipes
            pipes.forEach(pipe => {
                pipe.x -= 2;
                if (pipe.x + pipe.width < bird.x && !pipe.passed) {
                    pipe.passed = true;
                    score++;
                    this.scores.flappy = score;
                    this.updateScore('flappy');
                    this.sounds.success();
                }
            });

            // Remove off-screen pipes
            pipes.splice(0, pipes.filter(pipe => pipe.x + pipe.width < 0).length);

            // Collision detection
            if (bird.y < 0 || bird.y + bird.size > canvas.height) {
                gameActive = false;
                this.gameOver('flappy', 'Bird hit the ground!');
                clearInterval(gameLoop);
                return;
            }

            pipes.forEach(pipe => {
                if (bird.x < pipe.x + pipe.width && bird.x + bird.size > pipe.x &&
                    (bird.y < pipe.topHeight || bird.y + bird.size > pipe.topHeight + pipe.gap)) {
                    gameActive = false;
                    this.gameOver('flappy', 'Bird hit a pipe!');
                    clearInterval(gameLoop);
                    return;
                }
            });

            drawFlappyGame();
        }, 1000 / 60);

        this.currentGameLoop = gameLoop;

        // Controls
        const flap = () => {
            if (gameActive) {
                bird.velocity = -8;
                this.sounds.click();
            }
        };

        canvas.addEventListener('click', flap);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                flap();
            }
        });
    }

    // Spelling Bee Game - Fill in the Gaps
    initSpellingGame(ctx, canvas) {
        const words = [
            'monad', 'playhouse', 'arcade', 'gaming', 'fun', 'awesome', 'neon', 'glow',
            'adventure', 'challenge', 'skill', 'speed', 'memory', 'logic', 'puzzle', 'race',
            'snake', 'bird', 'tetris', 'math', 'color', 'match', 'quick', 'fast'
        ];
        
        let currentWord = words[Math.floor(Math.random() * words.length)];
        let currentInput = '';
        let score = 0;
        let gameActive = true;
        let timeLeft = 60;
        let wordTimer = 0;
        
        // Create masked word with some letters revealed
        const createMaskedWord = (word) => {
            const length = word.length;
            const revealedCount = Math.max(2, Math.floor(length * 0.4)); // Reveal 40% of letters
            const positions = [];
            
            // Always reveal first and last letter
            positions.push(0);
            positions.push(length - 1);
            
            // Add random positions for revealed letters
            while (positions.length < revealedCount) {
                const pos = Math.floor(Math.random() * length);
                if (!positions.includes(pos)) {
                    positions.push(pos);
                }
            }
            
            return word.split('').map((letter, index) => 
                positions.includes(index) ? letter : '_'
            ).join(' ');
        };
        
        let maskedWord = createMaskedWord(currentWord);
        
        const drawSpellingGame = () => {
            // Clear canvas
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw neon border
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Draw title (reduced by half)
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 18px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('Spelling Bee - Fill the Gaps', canvas.width / 2, 40);
            
            // Draw masked word (reduced by half)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText(maskedWord, canvas.width / 2, 100);
            
            // Draw hint
            ctx.fillStyle = '#888';
            ctx.font = '14px Exo 2';
            ctx.textAlign = 'center';
            ctx.fillText(`Word length: ${currentWord.length} letters`, canvas.width / 2, 130);
            
            // Draw input field
            ctx.fillStyle = '#333';
            ctx.fillRect(150, 160, 500, 40);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(150, 160, 500, 40);
            
            // Draw input text
            ctx.fillStyle = '#00ff88';
            ctx.font = '18px Exo 2';
            ctx.textAlign = 'left';
            ctx.fillText(currentInput, 170, 185);
            
            // Draw instructions (reduced by 80%)
            ctx.fillStyle = '#888';
            ctx.font = '10px Exo 2';
            ctx.textAlign = 'center';
            ctx.fillText('Fill in the missing letters and press Enter', canvas.width / 2, 220);
            
            // Draw score and time (reduced by half)
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${score}`, 25, 25);
            ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 75, 25);
        };
        
        const gameLoop = setInterval(() => {
            if (!gameActive) {
                clearInterval(gameLoop);
                return;
            }
            
            wordTimer++;
            if (wordTimer >= 60) {
                timeLeft--;
                wordTimer = 0;
                
                if (timeLeft <= 0) {
                    gameActive = false;
                    this.scores.spelling = score;
                    this.updateScore('spelling');
                    this.gameOver('spelling', 'Time\'s up!');
                    clearInterval(gameLoop);
                    return;
                }
            }
            
            drawSpellingGame();
        }, 1000 / 60);
        
        this.currentGameLoop = gameLoop;
        
        // Handle input
        const handleInput = (e) => {
            if (!gameActive) return;
            
            if (e.key === 'Enter') {
                if (currentInput.toLowerCase() === currentWord.toLowerCase()) {
                    score++;
                    this.sounds.success();
                    currentWord = words[Math.floor(Math.random() * words.length)];
                    maskedWord = createMaskedWord(currentWord);
                    currentInput = '';
                    timeLeft = Math.min(timeLeft + 5, 60); // Bonus time
                } else {
                    this.sounds.error();
                    timeLeft = Math.max(timeLeft - 3, 0); // Penalty time
                }
            } else if (e.key === 'Backspace') {
                currentInput = currentInput.slice(0, -1);
            } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                currentInput += e.key;
            }
        };
        
        document.addEventListener('keydown', handleInput);
        
        // Clean up event listener when game ends
        this.cleanupListeners = () => {
            document.removeEventListener('keydown', handleInput);
        };
    }

    // Car Race Game
    initCarRaceGame(ctx, canvas) {
        const car = {
            x: canvas.width / 2,
            y: canvas.height - 100,
            width: 50,
            height: 80,
            speed: 0,
            maxSpeed: 40, // Increased by 5x from 8 (500% increase)
            acceleration: 1.0, // Increased by 5x from 0.2 (500% increase)
            deceleration: 0.5, // Increased by 5x from 0.1 (500% increase)
            turnSpeed: 15 // Increased by 5x from 3 (500% increase)
        };
        console.log('Car race initialized with 500% increased speed:', {
            maxSpeed: car.maxSpeed,
            acceleration: car.acceleration,
            deceleration: car.deceleration,
            turnSpeed: car.turnSpeed
        });
        
        const obstacles = [];
        let score = 0;
        let gameActive = true;
        let frame = 0;
        let roadOffset = 0;
        
        // Create car image
        const carImg = new Image();
        carImg.src = 'data:image/svg+xml;base64,' + btoa(`
            <svg width="50" height="80" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="15" width="40" height="50" rx="8" fill="#ff4444" stroke="#cc0000" stroke-width="2"/>
                <rect x="8" y="20" width="34" height="40" rx="5" fill="#ffffff" stroke="#cccccc" stroke-width="1"/>
                <rect x="12" y="25" width="26" height="30" rx="3" fill="#ff6666"/>
                <circle cx="15" cy="70" r="8" fill="#333333" stroke="#666666" stroke-width="1"/>
                <circle cx="35" cy="70" r="8" fill="#333333" stroke="#666666" stroke-width="1"/>
                <rect x="10" y="10" width="30" height="8" rx="4" fill="#ff8888"/>
                <rect x="15" y="12" width="20" height="4" rx="2" fill="#ffffff"/>
            </svg>
        `);
        
        const drawCarRaceGame = () => {
            // Clear canvas
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw road
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw road lines
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw car using image
            ctx.drawImage(carImg, car.x - car.width / 2, car.y - car.height / 2, car.width, car.height);
            
            // Draw obstacles
            obstacles.forEach(obstacle => {
                ctx.fillStyle = '#444';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            });
            
            // Draw score
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 24px Orbitron';
            ctx.textAlign = 'left';
            ctx.fillText(`Laps: ${score}`, 50, 50);
        };
        
        const gameLoop = setInterval(() => {
            if (!gameActive) {
                clearInterval(gameLoop);
                return;
            }
            
            frame++;
            
            // Generate obstacles
            if (frame % 120 === 0) {
                const lane = Math.random() < 0.5 ? 0 : 1;
                const x = lane === 0 ? 100 : canvas.width - 150;
                obstacles.push({
                    x: x,
                    y: -50,
                    width: 80,
                    height: 50
                });
            }
            
            // Move obstacles
            obstacles.forEach(obstacle => {
                obstacle.y += 15; // Increased by 5x from 3 (500% increase)
                if (obstacle.y > canvas.height) {
                    score++;
                    this.scores.carRace = score;
                    this.updateScore('carRace');
                    this.sounds.success();
                }
            });
            
            // Remove off-screen obstacles
            obstacles.splice(0, obstacles.filter(obs => obs.y > canvas.height).length);
            
            // Collision detection
            obstacles.forEach(obstacle => {
                if (car.x - car.width / 2 < obstacle.x + obstacle.width &&
                    car.x + car.width / 2 > obstacle.x &&
                    car.y - car.height / 2 < obstacle.y + obstacle.height &&
                    car.y + car.height / 2 > obstacle.y) {
                    gameActive = false;
                    this.scores.carRace = score;
                    this.updateScore('carRace');
                    this.gameOver('carRace', 'Car crashed!');
                    clearInterval(gameLoop);
                    return;
                }
            });
            
            drawCarRaceGame();
        }, 1000 / 60);
        
        this.currentGameLoop = gameLoop;
        
        // Controls
        const handleKeyDown = (e) => {
            if (!gameActive) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
                    break;
                case 'ArrowDown':
                    car.speed = Math.max(car.speed - car.acceleration, 0);
                    break;
                case 'ArrowLeft':
                    if (car.x > car.width / 2) {
                        car.x -= car.turnSpeed;
                    }
                    break;
                case 'ArrowRight':
                    if (car.x < canvas.width - car.width / 2) {
                        car.x += car.turnSpeed;
                    }
                    break;
            }
        };
        
        const handleKeyUp = (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                car.speed = Math.max(car.speed - car.deceleration, 0);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Clean up event listeners when game ends
        this.cleanupListeners = () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }

    // FIXED Global Keyboard Controls for Tetris
    handleKeyPress(e) {
        if (this.currentGame === 'snake') {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.snake && this.snake.dy === 0) {
                        this.snake.dx = 0;
                        this.snake.dy = -20;
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake && this.snake.dy === 0) {
                        this.snake.dx = 0;
                        this.snake.dy = 20;
                    }
                    break;
                case 'ArrowLeft':
                    if (this.snake && this.snake.dx === 0) {
                        this.snake.dx = -20;
                        this.snake.dy = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake && this.snake.dx === 0) {
                        this.snake.dx = 20;
                        this.snake.dy = 0;
                    }
                    break;
            }
        } else if (this.currentGame === 'tetris') {
            if (!this.tetrisGame) return;
            
            let moved = false;
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (this.tetrisGame.pieceX > 0) {
                        this.tetrisGame.pieceX--;
                        if (this.checkTetrisCollision()) {
                            this.tetrisGame.pieceX++;
                        } else {
                            moved = true;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (this.tetrisGame.pieceX < 10 - this.tetrisGame.currentPiece[0].length) {
                        this.tetrisGame.pieceX++;
                        if (this.checkTetrisCollision()) {
                            this.tetrisGame.pieceX--;
                        } else {
                            moved = true;
                        }
                    }
                    break;
                case 'ArrowDown':
                    this.tetrisGame.pieceY++;
                    if (this.checkTetrisCollision()) {
                        this.tetrisGame.pieceY--;
                    } else {
                        moved = true;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.rotateTetrisPiece();
                    break;
            }
            
            // Update local variables to match stored state
            if (moved) {
                pieceX = this.tetrisGame.pieceX;
                pieceY = this.tetrisGame.pieceY;
            }
        }
    }

    rotateTetrisPiece() {
        if (!this.tetrisGame) return;
        
        const rotated = this.tetrisGame.currentPiece[0].map((_, i) => 
            this.tetrisGame.currentPiece.map(row => row[i]).reverse()
        );
        
        const originalPiece = this.tetrisGame.currentPiece;
        this.tetrisGame.currentPiece = rotated;
        
        if (this.checkTetrisCollision()) {
            this.tetrisGame.currentPiece = originalPiece;
        }
    }

    startGameTimer() {
        this.gameTimer = setInterval(() => {
            if (this.gameState === 'playing') {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('gameTimer').textContent = 
                    `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // Enhanced Game Over with Reason Display
    async gameOver(gameType, reason = '') {
        this.gameState = 'gameOver';
        this.gameOverReason = reason;
        clearInterval(this.gameTimer);
        clearInterval(this.currentGameLoop);

        // Clean up event listeners
        if (this.cleanupListeners) {
            this.cleanupListeners();
        }

        // Submit score to leaderboard if payment was made
        console.log('Game over - checking score submission conditions:', {
            paymentRequired: this.paymentRequired,
            playerName: this.playerName,
            hasScore: this.scores[gameType] > 0
        });
        
        if (this.paymentRequired && this.playerName) {
            console.log('Score submission conditions met, submitting score...');
            await this.submitScoreToLeaderboard(gameType);
        } else {
            console.log('Score submission conditions NOT met:', {
                paymentRequired: this.paymentRequired,
                playerName: this.playerName
            });
        }

        document.getElementById('overlayTitle').textContent = 'Game Over!';
        document.getElementById('overlayMessage').innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Reason:</strong> ${reason || 'Game ended'}
            </div>
            <div>
                Your score: <span id="overlayScore">${this.scores[gameType]}</span>
            </div>
            ${this.paymentRequired ? '<div style="margin-top: 10px; color: #00ff88;">Score submitted to leaderboard!</div>' : ''}
            <div style="margin-top: 15px; color: #4ecdc4; font-size: 14px;">
                💡 To play again, you'll need to pay another 0.1 MON entry fee
            </div>
        `;
        document.getElementById('overlayScore').textContent = this.scores[gameType];
        document.getElementById('gameOverlay').style.display = 'flex';

        this.sounds.gameOver();
        this.saveScores();
    }

    // Submit score to leaderboard
    async submitScoreToLeaderboard(gameType) {
        try {
            // Prevent duplicate submissions
            if (this.scoreSubmissionInProgress) {
                console.log('Score submission already in progress, skipping...');
                return;
            }
            
            this.scoreSubmissionInProgress = true;
            
            const gameTypeMap = {
                'snake': 1, 'memory': 2, 'math': 3, 'color': 4,
                'tetris': 5, 'flappy': 6, 'spelling': 7, 'carRace': 8,
                'monadRunner': 9, 'cryptoPuzzle': 10, 'tokenCollector': 11, 'blockchainTetris': 12
            };
            
            const blockchainGameType = gameTypeMap[gameType];
            if (blockchainGameType && this.scores[gameType] > 0) {
                // Calculate game duration in seconds
                const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
                
                console.log('Submitting score with duration:', gameDuration, 'seconds');
                
                await window.leaderboardManager.submitScore(
                    blockchainGameType, 
                    this.scores[gameType], 
                    this.playerName,
                    gameDuration
                );
            }
        } catch (error) {
            console.error('Failed to submit score to leaderboard:', error);
        } finally {
            this.scoreSubmissionInProgress = false;
        }
    }

    restartGame() {
        document.getElementById('gameOverlay').style.display = 'none';
        // Instead of restarting the same game, show payment options for a new game
        this.showPaymentOptions(this.currentGame);
    }

    // Show the main game menu
    showMenu() {
        this.gameState = 'menu';
        clearInterval(this.gameTimer);
        clearInterval(this.currentGameLoop);
        
        // Clean up event listeners
        if (this.cleanupListeners) {
            this.cleanupListeners();
        }
        
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('gameMenu').style.display = 'block';
        document.getElementById('gameOverlay').style.display = 'none';
        
        this.updateScoreDisplays();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearInterval(this.currentGameLoop);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.initializeGame(this.currentGame);
        }
    }

    // Toggle sound on/off
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.textContent = this.soundEnabled ? '🔊' : '🔇';
        console.log('Sound', this.soundEnabled ? 'enabled' : 'disabled');
    }

    // Toggle fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #00ff88, #4ecdc4);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    showWalletPrompt(reason, action) {
        const prompt = document.createElement('div');
        prompt.className = 'wallet-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-header">
                    <h3>🔗 Wallet Required</h3>
                    <button class="close-prompt">×</button>
                </div>
                <div class="prompt-body">
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p><strong>Action:</strong> ${action}</p>
                    <div class="prompt-actions">
                        <button class="connect-wallet-prompt">Connect Wallet</button>
                        <button class="cancel-prompt">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        prompt.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        const content = prompt.querySelector('.prompt-content');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 20px;
            padding: 30px;
            border: 2px solid #ff6b6b;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
            max-width: 400px;
            width: 90%;
        `;
        
        const header = prompt.querySelector('.prompt-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ff6b6b;
            padding-bottom: 15px;
        `;
        
        const title = prompt.querySelector('h3');
        title.style.cssText = `
            color: #ff6b6b;
            font-family: 'Orbitron', monospace;
            margin: 0;
            font-size: 20px;
        `;
        
        const closeBtn = prompt.querySelector('.close-prompt');
        closeBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
        `;
        
        const body = prompt.querySelector('.prompt-body');
        body.style.cssText = `
            color: #ccc;
            line-height: 1.6;
            margin-bottom: 20px;
        `;
        
        const actions = prompt.querySelector('.prompt-actions');
        actions.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        const connectBtn = prompt.querySelector('.connect-wallet-prompt');
        connectBtn.style.cssText = `
            background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        const cancelBtn = prompt.querySelector('.cancel-prompt');
        cancelBtn.style.cssText = `
            background: rgba(255, 107, 157, 0.2);
            border: 2px solid #ff6b9d;
            color: #ff6b9d;
            padding: 12px 24px;
            border-radius: 25px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        // Event listeners
        closeBtn.addEventListener('click', () => prompt.remove());
        cancelBtn.addEventListener('click', () => prompt.remove());
        connectBtn.addEventListener('click', () => {
            prompt.remove();
            console.log('Wallet system ready');
        });
        
        document.body.appendChild(prompt);
    }

    // Test method for debugging game system
    testGameSystem() {
        console.log('Testing game system...');
        console.log('Current state:', {
            gameState: this.gameState,
            currentGame: this.currentGame,
            playerName: this.playerName,
            paymentRequired: this.paymentRequired
        });
        
        // Test DOM elements
        const elements = {
            gameMenu: document.getElementById('gameMenu'),
            gameCanvas: document.getElementById('gameCanvas'),
            gameCanvasElement: document.getElementById('gameCanvasElement'),
            currentGameName: document.getElementById('currentGameName')
        };
        
        console.log('DOM elements:', elements);
        
        // Test if methods exist
        const methods = {
            startGameTimer: typeof this.startGameTimer,
            initializeGame: typeof this.initializeGame,
            initSnakeGame: typeof this.initSnakeGame,
            showNotification: typeof this.showNotification
        };
        
        console.log('Methods:', methods);
        
        return {
            state: this.gameState,
            elements: Object.keys(elements).map(key => ({ key, exists: !!elements[key] })),
            methods: methods
        };
    }

    // Load scores from localStorage
    loadScores() {
        try {
            const savedScores = localStorage.getItem('monadPlayhouseScores');
            if (savedScores) {
                this.scores = { ...this.scores, ...JSON.parse(savedScores) };
                console.log('Scores loaded from localStorage:', this.scores);
            }
        } catch (error) {
            console.error('Failed to load scores:', error);
        }
    }

    // Save scores to localStorage
    saveScores() {
        try {
                    localStorage.setItem('monadPlayhouseScores', JSON.stringify(this.scores));
            console.log('Scores saved to localStorage:', this.scores);
        } catch (error) {
            console.error('Failed to save scores:', error);
        }
    }

    // Update score displays
    updateScoreDisplays() {
        try {
            const elements = {
                snakeScore: document.getElementById('snakeScore'),
                memoryTime: document.getElementById('memoryTime'),
                mathLevel: document.getElementById('mathLevel'),
                colorScore: document.getElementById('colorScore'),
                tetrisLines: document.getElementById('tetrisLines'),
                flappyScore: document.getElementById('flappyScore'),
                spellingWords: document.getElementById('spellingWords'),
                carRaceLaps: document.getElementById('carRaceLaps'),
                monadRunnerDistance: document.getElementById('monadRunnerDistance'),
                cryptoPuzzleLevel: document.getElementById('cryptoPuzzleLevel'),
                tokenCollectorTokens: document.getElementById('tokenCollectorTokens'),
                blockchainTetrisLines: document.getElementById('blockchainTetrisLines')
            };

            // Update each score display if the element exists
            if (elements.snakeScore) elements.snakeScore.textContent = this.scores.snake || 0;
            if (elements.memoryTime) elements.memoryTime.textContent = this.scores.memory > 0 ? `${this.scores.memory}s` : '--';
            if (elements.mathLevel) elements.mathLevel.textContent = Math.floor((this.scores.math || 0) / 10) + 1;
            if (elements.colorScore) elements.colorScore.textContent = this.scores.color || 0;
            if (elements.tetrisLines) elements.tetrisLines.textContent = Math.floor((this.scores.tetris || 0) / 10);
            if (elements.flappyScore) elements.flappyScore.textContent = this.scores.flappy || 0;
            if (elements.spellingWords) elements.spellingWords.textContent = this.scores.spelling || 0;
            if (elements.carRaceLaps) elements.carRaceLaps.textContent = this.scores.carRace || 0;
            if (elements.monadRunnerDistance) elements.monadRunnerDistance.textContent = this.scores.monadRunner || 0;
            if (elements.cryptoPuzzleLevel) elements.cryptoPuzzleLevel.textContent = this.scores.cryptoPuzzle || 1;
            if (elements.tokenCollectorTokens) elements.tokenCollectorTokens.textContent = this.scores.tokenCollector || 0;
            if (elements.blockchainTetrisLines) elements.blockchainTetrisLines.textContent = this.scores.blockchainTetris || 0;
        } catch (error) {
            console.error('Failed to update score displays:', error);
        }
    }

    // Update a specific score
    updateScore(gameType) {
        if (this.scores && this.scores[gameType] !== undefined) {
            this.scores[gameType] = Math.max(this.scores[gameType] || 0, this.scores[gameType] || 0);
            this.updateScoreDisplays();
            this.saveScores();
        }
    }

    // Monad Runner - Endless runner with blockchain obstacles
    initMonadRunnerGame(ctx, canvas) {
        const runner = {
            x: 50,
            y: canvas.height - 100,
            width: 40,
            height: 60,
            speed: 5,
            jumpPower: -15,
            velocity: 0,
            onGround: true
        };

        const obstacles = [];
        const tokens = [];
        let score = 0;
        let distance = 0;

        // Generate initial obstacles
        for (let i = 0; i < 5; i++) {
            obstacles.push({
                x: canvas.width + (i * 300),
                y: canvas.height - 80,
                width: 30,
                height: 80,
                type: 'blockchain'
            });
        }

        // Generate tokens
        for (let i = 0; i < 8; i++) {
            tokens.push({
                x: canvas.width + (i * 200),
                y: canvas.height - 120,
                width: 20,
                height: 20,
                type: 'MON'
            });
        }

        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update distance
            distance += 2;
            score = Math.floor(distance / 10);

            // Draw background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw ground
            ctx.fillStyle = '#16213e';
            ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

            // Update and draw runner
            runner.velocity += 0.8; // Gravity
            runner.y += runner.velocity;

            if (runner.y > canvas.height - 100) {
                runner.y = canvas.height - 100;
                runner.velocity = 0;
                runner.onGround = true;
            }

            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(runner.x, runner.y, runner.width, runner.height);

            // Update and draw obstacles
            obstacles.forEach((obstacle, index) => {
                obstacle.x -= 3;
                if (obstacle.x < -50) {
                    obstacle.x = canvas.width + Math.random() * 300;
                }

                ctx.fillStyle = obstacle.type === 'blockchain' ? '#FF6B6B' : '#4ECDC4';
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                // Collision detection
                if (this.checkCollision(runner, obstacle)) {
                    this.gameOver();
                    clearInterval(gameLoop);
                }
            });

            // Update and draw tokens
            tokens.forEach((token, index) => {
                token.x -= 3;
                if (token.x < -50) {
                    token.x = canvas.width + Math.random() * 200;
                }

                ctx.fillStyle = '#FFD700';
                ctx.fillRect(token.x, token.y, token.width, token.height);

                // Collect tokens
                if (this.checkCollision(runner, token)) {
                    tokens.splice(index, 1);
                    score += 50;
                    this.sounds.success();
                }
            });

            // Draw score and distance
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Orbitron';
            ctx.fillText(`Score: ${score}`, 20, 30);
            ctx.fillText(`Distance: ${Math.floor(distance)}`, 20, 60);

            // Handle input
            this.handleRunnerInput(runner);
        }, 1000 / 60);

        this.currentGameLoop = gameLoop;
    }

    // Crypto Puzzle - Blockchain-themed puzzle game
    initCryptoPuzzleGame(ctx, canvas) {
        const puzzle = {
            pieces: [],
            selectedPiece: null,
            level: 1,
            score: 0
        };

        // Initialize puzzle pieces
        this.initPuzzlePieces(puzzle, canvas);

        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = '#0f0f23';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw puzzle pieces
            this.drawPuzzlePieces(ctx, puzzle);

            // Draw UI
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Orbitron';
            ctx.fillText(`Level: ${puzzle.level}`, 20, 30);
            ctx.fillText(`Score: ${puzzle.score}`, 20, 60);

            // Check win condition
            if (this.checkPuzzleComplete(puzzle)) {
                puzzle.level++;
                puzzle.score += 100 * puzzle.level;
                this.initPuzzlePieces(puzzle, canvas);
                this.sounds.success();
            }
        }, 1000 / 60);

        this.currentGameLoop = gameLoop;
    }

    // Token Collector - Collect different token types
    initTokenCollectorGame(ctx, canvas) {
        const collector = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            width: 40,
            height: 40,
            speed: 4
        };

        const tokens = [];
        let score = 0;
        let timeLeft = 60;

        // Generate tokens
        for (let i = 0; i < 15; i++) {
            tokens.push({
                x: Math.random() * (canvas.width - 40),
                y: Math.random() * (canvas.height - 40),
                width: 20,
                height: 20,
                type: ['MON', 'ETH', 'BTC', 'ADA'][Math.floor(Math.random() * 4)],
                value: Math.floor(Math.random() * 50) + 10
            });
        }

        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw collector
            this.handleCollectorInput(collector, canvas);
            ctx.fillStyle = '#3498db';
            ctx.fillRect(collector.x, collector.y, collector.width, collector.height);

            // Draw tokens
            tokens.forEach((token, index) => {
                if (token) {
                    ctx.fillStyle = this.getTokenColor(token.type);
                    ctx.fillRect(token.x, token.y, token.width, token.height);
                    
                    // Draw token type
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '12px Arial';
                    ctx.fillText(token.type, token.x + 2, token.y + 15);

                    // Collision detection
                    if (this.checkCollision(collector, token)) {
                        score += token.value;
                        tokens.splice(index, 1);
                        this.sounds.success();
                    }
                }
            });

            // Update timer
            timeLeft -= 1/60;
            if (timeLeft <= 0) {
                this.gameOver();
                clearInterval(gameLoop);
            }

            // Draw UI
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Orbitron';
            ctx.fillText(`Score: ${score}`, 20, 30);
            ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 20, 60);
            ctx.fillText(`Tokens: ${15 - tokens.length}/15`, 20, 90);
        }, 1000 / 60);

        this.currentGameLoop = gameLoop;
    }

    // Blockchain Tetris - Tetris with smart contract blocks
    initBlockchainTetrisGame(ctx, canvas) {
        const tetris = {
            board: Array(20).fill().map(() => Array(10).fill(0)),
            currentPiece: this.getRandomPiece(),
            x: 3,
            y: 0,
            score: 0,
            lines: 0
        };

        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw board
            this.drawTetrisBoard(ctx, tetris);

            // Draw current piece
            this.drawTetrisPiece(ctx, tetris.currentPiece, tetris.x, tetris.y);

            // Draw UI
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Orbitron';
            ctx.fillText(`Score: ${tetris.score}`, 20, 30);
            ctx.fillText(`Lines: ${tetris.lines}`, 20, 60);

            // Move piece down
            if (this.gameTimer % 30 === 0) {
                if (!this.moveTetrisPiece(tetris, 0, 1)) {
                    this.placeTetrisPiece(tetris);
                    this.clearTetrisLines(tetris);
                    tetris.currentPiece = this.getRandomPiece();
                    tetris.x = 3;
                    tetris.y = 0;
                }
            }
        }, 1000 / 60);

        this.currentGameLoop = gameLoop;
    }

    // Helper methods for new games
    handleRunnerInput(runner) {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && runner.onGround) {
                runner.velocity = runner.jumpPower;
                runner.onGround = false;
            }
        });
    }

    initPuzzlePieces(puzzle, canvas) {
        // Create puzzle pieces for current level
        puzzle.pieces = [];
        const pieceCount = 3 + puzzle.level;
        
        for (let i = 0; i < pieceCount; i++) {
            puzzle.pieces.push({
                x: Math.random() * (canvas.width - 100),
                y: Math.random() * (canvas.height - 100),
                width: 80,
                height: 80,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                solved: false
            });
        }
    }

    drawPuzzlePieces(ctx, puzzle) {
        puzzle.pieces.forEach(piece => {
            ctx.fillStyle = piece.color;
            ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
            
            if (piece.solved) {
                ctx.fillStyle = '#00FF00';
                ctx.font = '40px Arial';
                ctx.fillText('✓', piece.x + 30, piece.y + 50);
            }
        });
    }

    checkPuzzleComplete(puzzle) {
        return puzzle.pieces.every(piece => piece.solved);
    }

    handleCollectorInput(collector, canvas) {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowUp':
                    collector.y = Math.max(0, collector.y - collector.speed);
                    break;
                case 'ArrowDown':
                    collector.y = Math.min(canvas.height - collector.height, collector.y + collector.speed);
                    break;
                case 'ArrowLeft':
                    collector.x = Math.max(0, collector.x - collector.speed);
                    break;
                case 'ArrowRight':
                    collector.x = Math.min(canvas.width - collector.width, collector.x + collector.speed);
                break;
            }
        });
    }

    getTokenColor(type) {
        const colors = {
            'MON': '#FF6B6B',
            'ETH': '#4ECDC4',
            'BTC': '#FFD700',
            'ADA': '#9B59B6'
        };
        return colors[type] || '#FFFFFF';
    }

    getRandomPiece() {
        const pieces = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]]  // J
        ];
        return pieces[Math.floor(Math.random() * pieces.length)];
    }

    drawTetrisBoard(ctx, tetris) {
        for (let y = 0; y < tetris.board.length; y++) {
            for (let x = 0; x < tetris.board[y].length; x++) {
                if (tetris.board[y][x]) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(x * 30, y * 30, 30, 30);
                    ctx.strokeStyle = '#2E7D32';
                    ctx.strokeRect(x * 30, y * 30, 30, 30);
                }
            }
        }
    }

    drawTetrisPiece(ctx, piece, x, y) {
        ctx.fillStyle = '#FF6B6B';
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    ctx.fillRect((x + col) * 30, (y + row) * 30, 30, 30);
                    ctx.strokeStyle = '#D32F2F';
                    ctx.strokeRect((x + col) * 30, (y + row) * 30, 30, 30);
                }
            }
        }
    }

    moveTetrisPiece(tetris, dx, dy) {
        const newX = tetris.x + dx;
        const newY = tetris.y + dy;
        
        if (this.isValidTetrisMove(tetris.currentPiece, newX, newY, tetris.board)) {
            tetris.x = newX;
            tetris.y = newY;
            return true;
        }
        return false;
    }

    isValidTetrisMove(piece, x, y, board) {
        for (let row = 0; row < piece.length; row++) {
            for (let col = 0; col < piece[row].length; col++) {
                if (piece[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= 10 || newY >= 20 || 
                        (newY >= 0 && board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placeTetrisPiece(tetris) {
        for (let row = 0; row < tetris.currentPiece.length; row++) {
            for (let col = 0; col < tetris.currentPiece[row].length; col++) {
                if (tetris.currentPiece[row][col]) {
                    const boardY = tetris.y + row;
                    if (boardY >= 0) {
                        tetris.board[boardY][tetris.x + col] = 1;
                    }
                }
            }
        }
    }

    clearTetrisLines(tetris) {
        for (let y = tetris.board.length - 1; y >= 0; y--) {
            if (tetris.board[y].every(cell => cell === 1)) {
                tetris.board.splice(y, 1);
                tetris.board.unshift(Array(10).fill(0));
                tetris.lines++;
                tetris.score += 100;
                this.sounds.success();
            }
        }
    }

    rotateTetrisPiece(tetris) {
        const rotated = tetris.currentPiece[0].map((_, i) => 
            tetris.currentPiece.map(row => row[i]).reverse()
        );
        
        const originalPiece = tetris.currentPiece;
        tetris.currentPiece = rotated;
        
        if (!this.isValidTetrisMove(tetris.currentPiece, tetris.x, tetris.y, tetris.board)) {
            tetris.currentPiece = originalPiece;
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.monadPlayhouse = new MonadPlayhouse();
});

// Update the showGameOverPopup function to use hybrid login
function showGameOverPopup(score, gameType) {
    const popup = document.createElement('div');
    popup.className = 'game-over-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>🎮 Game Over!</h2>
            <p>Your Score: <span class="score">${score}</span></p>
            <div class="popup-buttons">
                <button id="submitScoreBtn" class="btn btn-primary">Submit Score</button>
                <button id="playAgainBtn" class="btn btn-secondary">Play Again</button>
                <button id="closePopupBtn" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Add event listeners
    document.getElementById('submitScoreBtn').addEventListener('click', async () => {
        try {
            // Check if user is authenticated
            if (!window.hybridLogin || !window.hybridLogin.getUserInfo().isAuthenticated) {
                alert('Please login first to submit your score!');
                return;
            }
            
            // Submit score using hybrid login
            await window.hybridLogin.submitScore(score, gameType);
            
            // Show success message
            alert('Score submitted successfully!');
            
            // Close popup
            document.body.removeChild(popup);
        } catch (error) {
            console.error('Score submission failed:', error);
            alert('Failed to submit score: ' + error.message);
        }
    });
    
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        document.body.removeChild(popup);
        startGame(gameType);
    });
    
    document.getElementById('closePopupBtn').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}