// Bakhryaan Blessed Playhouse - Enhanced Arcade Collection
// Modern JavaScript with ES6+ features, sound effects, and 6 games

class BlessedPlayhouse {
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
            flappy: 0
        };
        this.gameTimer = null;
        this.startTime = null;
        this.sounds = {};
        this.gameOverReason = '';
        
        this.init();
    }

    init() {
        this.hideLoadingScreen();
        this.setupEventListeners();
        this.loadScores();
        this.showMenu();
        this.initSounds();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 2000);
    }

    initSounds() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate different sound frequencies for different effects
        this.sounds = {
            click: () => this.playTone(800, 0.1),
            success: () => this.playTone(1200, 0.2),
            error: () => this.playTone(400, 0.3),
            gameOver: () => this.playTone(200, 0.5)
        };
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
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
            this.sounds.click();
        });
        document.getElementById('fullscreenToggle').addEventListener('click', () => {
            this.toggleFullscreen();
            this.sounds.click();
        });
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.showMenu();
            this.sounds.click();
        });
        document.getElementById('pauseGame').addEventListener('click', () => {
            this.pauseGame();
            this.sounds.click();
        });
        document.getElementById('restartGame').addEventListener('click', () => {
            this.restartGame();
            this.sounds.click();
        });

        // Overlay buttons
        document.getElementById('playAgain').addEventListener('click', () => {
            this.restartGame();
            this.sounds.click();
        });
        document.getElementById('backToMain').addEventListener('click', () => {
            this.showMenu();
            this.sounds.click();
        });

        // Global keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startGame(gameType) {
        this.currentGame = gameType;
        this.gameState = 'playing';
        this.startTime = Date.now();
        
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('gameCanvas').style.display = 'block';
        document.getElementById('currentGameName').textContent = this.getGameDisplayName(gameType);
        
        this.startGameTimer();
        this.initializeGame(gameType);
    }

    getGameDisplayName(gameType) {
        const names = {
            snake: 'Neon Snake',
            memory: 'Memory Match',
            math: 'Quick Math',
            color: 'Color Rush',
            tetris: 'Neon Tetris',
            flappy: 'Flappy Bird'
        };
        return names[gameType] || 'Game';
    }

    initializeGame(gameType) {
        const canvas = document.getElementById('gameCanvasElement');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        switch(gameType) {
            case 'snake':
                this.initSnakeGame(ctx, canvas);
                break;
            case 'memory':
                this.initMemoryGame(ctx, canvas);
                break;
            case 'math':
                this.initMathGame(ctx, canvas);
                break;
            case 'color':
                this.initColorGame(ctx, canvas);
                break;
            case 'tetris':
                this.initTetrisGame(ctx, canvas);
                break;
            case 'flappy':
                this.initFlappyGame(ctx, canvas);
                break;
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
        const cards = this.generateMemoryCards();
        let flippedCards = [];
        let matchedPairs = 0;
        let canFlip = true;
        let startTime = Date.now();

        const drawMemoryGame = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid of cards
            cards.forEach((card, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const x = col * 100 + 200;
                const y = row * 100 + 100;

                if (card.isFlipped || card.isMatched) {
                    ctx.fillStyle = card.isMatched ? '#00ff88' : '#00d4ff';
                    ctx.fillRect(x, y, 80, 80);
                    ctx.fillStyle = '#000';
                    ctx.font = '40px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(card.symbol, x + 40, y + 55);
                } else {
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
        canvas.addEventListener('click', (e) => {
            if (!canFlip) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor((x - 200) / 100);
            const row = Math.floor((y - 100) / 100);
            const index = row * 4 + col;

            if (index >= 0 && index < cards.length && !cards[index].isFlipped && !cards[index].isMatched) {
                cards[index].isFlipped = true;
                flippedCards.push(index);
                this.sounds.click();

                if (flippedCards.length === 2) {
                    canFlip = false;
                    setTimeout(() => {
                        if (cards[flippedCards[0]].symbol === cards[flippedCards[1]].symbol) {
                            cards[flippedCards[0]].isMatched = true;
                            cards[flippedCards[1]].isMatched = true;
                            matchedPairs++;
                            this.sounds.success();
                            
                            if (matchedPairs === 8) {
                                const finalTime = Math.floor((Date.now() - startTime) / 1000);
                                this.scores.memory = finalTime;
                                this.updateScore('memory');
                                this.gameOver('memory', 'All pairs matched!');
                            }
                        } else {
                            cards[flippedCards[0]].isFlipped = false;
                            cards[flippedCards[1]].isFlipped = false;
                            this.sounds.error();
                        }
                        flippedCards = [];
                        canFlip = true;
                    }, 1000);
                }
            }
        });

        // Start drawing loop
        const gameLoop = setInterval(() => {
            if (this.gameState !== 'playing') {
                clearInterval(gameLoop);
                return;
            }
            drawMemoryGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    generateMemoryCards() {
        const symbols = ['🐍', '🧠', '🔢', '🎨', '⭐', '🌟', '��', '🔥'];
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
        let currentProblem = this.generateMathProblem();
        let userAnswer = '';
        let timeLeft = 30;
        let level = 1;

        const drawMathGame = () => {
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
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                userAnswer += e.key;
                this.sounds.click();
            } else if (e.key === 'Backspace') {
                userAnswer = userAnswer.slice(0, -1);
                this.sounds.click();
            } else if (e.key === 'Enter') {
                if (parseInt(userAnswer) === currentProblem.answer) {
                    this.scores.math += 10;
                    this.updateScore('math');
                    level++;
                    timeLeft += 10;
                    currentProblem = this.generateMathProblem(level);
                    userAnswer = '';
                    this.sounds.success();
                } else {
                    this.sounds.error();
                    this.gameOver('math', 'Wrong answer!');
                }
            }
        });

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
        const colors = ['#ff6b9d', '#00ff88', '#00d4ff', '#ffd700', '#ff4500'];
        let currentColor = colors[0];
        let targetColor = colors[0];
        let score = 0;
        let timeLeft = 60;

        const drawColorGame = () => {
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
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicked on color option
            if (y >= 150 && y <= 210) {
                for (let i = 0; i < colors.length; i++) {
                    const colorX = 400 + (i * 80);
                    if (x >= colorX && x <= colorX + 60) {
                        if (colors[i] === targetColor) {
                            score += 10;
                            this.scores.color = score;
                            this.updateScore('color');
                            targetColor = colors[Math.floor(Math.random() * colors.length)];
                            this.sounds.success();
                        } else {
                            this.sounds.error();
                            this.gameOver('color', 'Wrong color!');
                        }
                        break;
                    }
                }
            }
        });

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
                clearInterval(gameLoop);
                return;
            }
            drawColorGame();
        }, 100);

        this.currentGameLoop = gameLoop;
    }

    // Fixed Tetris Game with Working Controls and Faster Drop Speed
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

    // Enhanced Global Keyboard Controls for Tetris
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
            
            switch(e.key) {
                case 'ArrowLeft':
                    if (this.tetrisGame.pieceX > 0) {
                        this.tetrisGame.pieceX--;
                        if (this.checkTetrisCollision()) {
                            this.tetrisGame.pieceX++;
                        }
                    }
                    break;
                case 'ArrowRight':
                    if (this.tetrisGame.pieceX < 10 - this.tetrisGame.currentPiece[0].length) {
                        this.tetrisGame.pieceX++;
                        if (this.checkTetrisCollision()) {
                            this.tetrisGame.pieceX--;
                        }
                    }
                    break;
                case 'ArrowDown':
                    this.tetrisGame.pieceY++;
                    if (this.checkTetrisCollision()) {
                        this.tetrisGame.pieceY--;
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    this.rotateTetrisPiece();
                    break;
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
    gameOver(gameType, reason = '') {
        this.gameState = 'gameOver';
        this.gameOverReason = reason;
        clearInterval(this.gameTimer);
        clearInterval(this.currentGameLoop);

        document.getElementById('overlayTitle').textContent = 'Game Over!';
        document.getElementById('overlayMessage').innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Reason:</strong> ${reason || 'Game ended'}
            </div>
            <div>
                Your score: <span id="overlayScore">${this.scores[gameType]}</span>
            </div>
        `;
        document.getElementById('overlayScore').textContent = this.scores[gameType];
        document.getElementById('gameOverlay').style.display = 'flex';

        this.sounds.gameOver();
        this.saveScores();
    }

    restartGame() {
        document.getElementById('gameOverlay').style.display = 'none';
        this.startGame(this.currentGame);
    }

    showMenu() {
        this.gameState = 'menu';
        clearInterval(this.gameTimer);
        clearInterval(this.currentGameLoop);
        
        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('gameMenu').style.display = 'block';
        document.getElementById('gameOverlay').style.display = 'none';
        
        this.updateScoreDisplays();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearInterval(this.currentGameLoop);
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.initializeGame(this.currentGame);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundToggle');
        btn.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    updateScore(gameType) {
        this.scores[gameType] = Math.max(this.scores[gameType], this.scores[gameType]);
        this.updateScoreDisplays();
    }

    updateScoreDisplays() {
        document.getElementById('snakeScore').textContent = this.scores.snake;
        document.getElementById('memoryTime').textContent = this.scores.memory > 0 ? `${this.scores.memory}s` : '--';
        document.getElementById('mathLevel').textContent = Math.floor(this.scores.math / 10) + 1;
        document.getElementById('colorScore').textContent = this.scores.color;
        document.getElementById('tetrisLines').textContent = this.scores.tetris / 10;
        document.getElementById('flappyScore').textContent = this.scores.flappy;
    }

    loadScores() {
        const saved = localStorage.getItem('blessedPlayhouseScores');
        if (saved) {
            this.scores = { ...this.scores, ...JSON.parse(saved) };
        }
    }

    saveScores() {
        localStorage.setItem('blessedPlayhouseScores', JSON.stringify(this.scores));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BlessedPlayhouse();
});
