// Monad Playhouse - Payment Gateway
// Handles payment flow and game access control

class PaymentGateway {
    constructor() {
        this.isPaymentRequired = true;
        this.currentGameType = null;
        this.playerName = '';
        this.paymentModal = null;
    }

    // Initialize payment gateway
    async init() {
        try {
            console.log('Initializing payment gateway...');
            this.createPaymentModal();
            await this.loadConfig();
            console.log('Payment gateway initialized successfully');
        } catch (error) {
            console.error('Failed to initialize payment gateway:', error);
            // Still create the UI even if config loading fails
            this.createPaymentModal();
        }
    }

    // Load configuration
    async loadConfig() {
        try {
            const response = await fetch('config/contract.json');
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            // Use default config
            this.config = {
                entryFee: "0.1",
                currency: "MON",
                gameTypes: {
                    "1": "Snake", "2": "Memory", "3": "Math", "4": "Color",
                    "5": "Tetris", "6": "Flappy", "7": "Spelling", "8": "Car Race",
                    "9": "Monad Runner", "10": "Crypto Puzzle", "11": "Token Collector", "12": "Blockchain Tetris"
                }
            };
        }
    }

    // Create payment modal
    createPaymentModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('paymentModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        this.paymentModal = document.createElement('div');
        this.paymentModal.id = 'paymentModal';
        this.paymentModal.className = 'payment-modal';
        this.paymentModal.innerHTML = `
            <div class="payment-content">
                <div class="payment-header">
                    <h2>🎮 Game Access Required</h2>
                    <button id="closePayment" class="close-btn">×</button>
                </div>
                
                <div class="payment-info">
                    <div class="game-info">
                        <h3 id="selectedGameName">Select a Game</h3>
                        <p>To play this game, you need to pay the entry fee and connect your wallet.</p>
                    </div>
                    
                    <div class="wallet-status" id="walletStatus">
                        <div class="status-item">
                            <span class="status-label">Wallet:</span>
                            <span id="walletConnected" class="status-value">Not Connected</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Balance:</span>
                            <span id="walletBalance" class="status-value">-</span>
                        </div>
                    </div>
                    
                    <div class="payment-details">
                        <div class="fee-info">
                            <span class="fee-label">Entry Fee:</span>
                            <span class="fee-amount">${this.config?.entryFee || '0.1'} ${this.config?.currency || 'MON'}</span>
                        </div>
                        <div class="player-name-input">
                            <label for="playerName">Player Name:</label>
                            <input type="text" id="playerName" placeholder="Enter your name" maxlength="20" readonly>
                            <small>💡 Name is saved from wallet connection</small>
                        </div>
                    </div>
                    
                    <div class="payment-actions">
                        <button id="connectWallet" class="wallet-btn">Connect Wallet</button>
                        <button id="payEntryFee" class="pay-btn" disabled>Pay Entry Fee</button>
                    </div>
                    
                    <div class="payment-help">
                        <p>💡 <strong>How it works:</strong></p>
                        <ul>
                            <li>Connect your Monad wallet</li>
                            <li>Pay 0.1 MON entry fee</li>
                            <li>Play the game and compete for rewards</li>
                            <li>Top 3 players share the prize pool!</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.paymentModal);
        this.addPaymentStyles();
        this.setupEventListeners();
    }

    // Add payment modal styles
    addPaymentStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .payment-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                backdrop-filter: blur(10px);
            }

            .payment-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 20px;
                padding: 30px;
                width: 90%;
                max-width: 500px;
                border: 2px solid #00ff88;
                box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            }

            .payment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
                border-bottom: 2px solid #00ff88;
                padding-bottom: 15px;
            }

            .payment-header h2 {
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                margin: 0;
                font-size: 24px;
            }

            .close-btn {
                background: #ff4444;
                color: white;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .close-btn:hover {
                background: #cc0000;
                transform: scale(1.1);
            }

            .game-info {
                text-align: center;
                margin-bottom: 25px;
            }

            .game-info h3 {
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                margin-bottom: 10px;
            }

            .game-info p {
                color: #ccc;
                font-size: 14px;
            }

            .wallet-status {
                background: rgba(0, 255, 136, 0.1);
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 20px;
                border: 1px solid #00ff88;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .status-item:last-child {
                margin-bottom: 0;
            }

            .status-label {
                color: #888;
                font-size: 14px;
            }

            .status-value {
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
            }

            .status-value.connected {
                color: #4ecdc4;
            }

            .status-value.insufficient {
                color: #ff6b6b;
            }

            .payment-details {
                margin-bottom: 25px;
            }

            .fee-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 15px;
            }

            .fee-label {
                color: #ccc;
                font-size: 16px;
            }

            .fee-amount {
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                font-size: 18px;
            }

            .player-name-input {
                margin-bottom: 15px;
            }

            .player-name-input label {
                display: block;
                color: #ccc;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .player-name-input input {
                width: 100%;
                padding: 12px;
                border: 2px solid #00ff88;
                border-radius: 10px;
                background: #1a1a2e;
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                font-size: 14px;
                box-sizing: border-box;
            }

            .player-name-input input:focus {
                outline: none;
                border-color: #4ecdc4;
                box-shadow: 0 0 10px rgba(78, 205, 196, 0.3);
            }

            .payment-actions {
                display: flex;
                gap: 15px;
                margin-bottom: 25px;
            }

            .wallet-btn, .pay-btn {
                flex: 1;
                padding: 15px;
                border: none;
                border-radius: 25px;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }

            .wallet-btn {
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                color: white;
            }

            .wallet-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
            }

            .pay-btn {
                background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
                color: white;
            }

            .pay-btn:disabled {
                background: #666;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .pay-btn:not(:disabled):hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
            }

            .payment-help {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 15px;
                border-left: 4px solid #4ecdc4;
            }

            .payment-help p {
                color: #4ecdc4;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .payment-help ul {
                color: #ccc;
                font-size: 13px;
                margin: 0;
                padding-left: 20px;
            }

            .payment-help li {
                margin-bottom: 5px;
            }

            .processing {
                text-align: center;
                color: #00ff88;
                font-family: 'Orbitron', monospace;
                padding: 20px;
            }

            .success {
                text-align: center;
                color: #4ecdc4;
                font-family: 'Orbitron', monospace;
                padding: 20px;
            }

            .error {
                text-align: center;
                color: #ff6b6b;
                font-family: 'Orbitron', monospace;
                padding: 20px;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        try {
            // Close payment modal
            const closeBtn = document.getElementById('closePayment');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hide();
                });
            }

            // Connect wallet
            const connectBtn = document.getElementById('connectWallet');
            if (connectBtn) {
                connectBtn.addEventListener('click', () => {
                    this.connectWallet();
                });
            }

            // Pay entry fee
            const payBtn = document.getElementById('payEntryFee');
            if (payBtn) {
                payBtn.addEventListener('click', () => {
                    this.payEntryFee();
                });
            }

            // Player name input is now readonly and auto-populated
            // No event listener needed since it's readonly

            // Close on outside click
            if (this.paymentModal) {
                this.paymentModal.addEventListener('click', (e) => {
                    if (e.target.id === 'paymentModal') {
                        this.hide();
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up payment modal event listeners:', error);
        }
    }

    // Show payment modal for specific game
    show(gameType) {
        this.currentGameType = gameType;
        
        // Map game type to display name
        const gameNameMap = {
            'snake': 'Snake',
            'memory': 'Memory Match',
            'math': 'Quick Math',
            'color': 'Color Rush',
            'tetris': 'Neon Tetris',
            'flappy': 'Flappy Bird',
            'spelling': 'Spelling Bee',
            'carRace': 'Car Race',
            'monadRunner': 'Monad Runner',
            'cryptoPuzzle': 'Crypto Puzzle',
            'tokenCollector': 'Token Collector',
            'blockchainTetris': 'Blockchain Tetris'
        };
        
        const gameName = gameNameMap[gameType] || 'Game';
        
        // Always recreate the modal to ensure fresh state
        this.createPaymentModal();
        
        const selectedGameNameElement = document.getElementById('selectedGameName');
        if (selectedGameNameElement) {
            selectedGameNameElement.textContent = gameName;
        } else {
            console.error('selectedGameName element not found');
        }
        
        this.paymentModal.style.display = 'block';
        this.updateWalletStatus();
    }

    // Hide payment modal
    hide() {
        if (this.paymentModal) {
            this.paymentModal.style.display = 'none';
            // Remove the modal from DOM to ensure clean state
            setTimeout(() => {
                if (this.paymentModal && this.paymentModal.parentNode) {
                    this.paymentModal.remove();
                    this.paymentModal = null;
                }
            }, 300); // Small delay to allow for animations
        }
    }

    // Connect wallet
    async connectWallet() {
        const connectBtn = document.getElementById('connectWallet');
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        try {
            const success = await window.monadWallet.connect();
            if (success) {
                this.updateWalletStatus();
                this.updatePayButton();
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
        } finally {
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    }

    // Update wallet status display
    async updateWalletStatus() {
        const connectedElement = document.getElementById('walletConnected');
        const balanceElement = document.getElementById('walletBalance');
        const playerNameInput = document.getElementById('playerName');

        if (window.monadWallet.isConnected) {
            connectedElement.textContent = 'Connected';
            connectedElement.className = 'status-value connected';
            
            const balance = await window.monadWallet.getBalance();
            balanceElement.textContent = `${balance.toFixed(3)} MON`;
            
            if (balance < parseFloat(this.config?.entryFee || '0.1')) {
                balanceElement.className = 'status-value insufficient';
            } else {
                balanceElement.className = 'status-value connected';
            }
            
            // Load saved username
            const savedUsername = localStorage.getItem('monadPlayhouseUsername');
            if (savedUsername && playerNameInput) {
                this.playerName = savedUsername;
                playerNameInput.value = savedUsername;
                this.updatePayButton();
            }
        } else {
            connectedElement.textContent = 'Not Connected';
            connectedElement.className = 'status-value';
            balanceElement.textContent = '-';
            balanceElement.className = 'status-value';
            
            // Clear player name
            if (playerNameInput) {
                playerNameInput.value = '';
                this.playerName = '';
            }
        }
    }

    // Update pay button state
    updatePayButton() {
        const payBtn = document.getElementById('payEntryFee');
        const isWalletConnected = window.monadWallet.isConnected;
        const hasPlayerName = this.playerName.length > 0;
        
        payBtn.disabled = !isWalletConnected || !hasPlayerName;
    }

    // Pay entry fee
    async payEntryFee() {
        if (!this.playerName) {
            alert('Please enter your player name');
            return;
        }

        const payBtn = document.getElementById('payEntryFee');
        payBtn.textContent = 'Processing...';
        payBtn.disabled = true;

        try {
            const result = await window.monadWallet.payEntryFee(this.currentGameType, this.playerName);
            
            if (result.success) {
                // Track the deposit and username
                if (window.walletManager) {
                    window.walletManager.trackGameDeposit(this.currentGameType, this.playerName);
                }
                
                // Show success message
                this.showSuccess('Payment successful! Transaction confirmed on blockchain.');
                
                // Start the game after successful payment
                setTimeout(() => {
                    this.hide();
                    this.startGame();
                }, 2000);
            } else {
                this.showError(result.error || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showError('Payment failed. Please try again.');
        } finally {
            payBtn.textContent = 'Pay Entry Fee';
            payBtn.disabled = false;
        }
    }

    // Show success message
    showSuccess(message = 'Payment Successful!') {
        const content = this.paymentModal.querySelector('.payment-info');
        content.innerHTML = `
            <div class="success">
                <h3>✅ ${message}</h3>
                <p>Starting game in 2 seconds...</p>
            </div>
        `;
    }

    // Show error message
    showError(message) {
        const content = this.paymentModal.querySelector('.payment-info');
        content.innerHTML = `
            <div class="error">
                <h3>❌ Payment Failed</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="pay-btn">Try Again</button>
            </div>
        `;
    }

    // Start the game
    startGame() {
        console.log('PaymentGateway.startGame called with:', {
            currentGameType: this.currentGameType,
            playerName: this.playerName,
                            monadPlayhouse: window.monadPlayhouse
        });
        
        // This will be called by the main game system
        if (window.monadPlayhouse) {
            try {
                console.log('Calling monadPlayhouse.startGameWithPayment...');
                window.monadPlayhouse.startGameWithPayment(this.currentGameType, this.playerName);
                console.log('Game started successfully!');
            } catch (error) {
                console.error('Error starting game with monadPlayhouse:', error);
                this.showError(`Failed to start game: ${error.message}`);
            }
        } else {
            console.error('monadPlayhouse not found! Available objects:', Object.keys(window));
            this.showError('Game system not available. Please refresh the page and try again.');
        }
    }

    // Check if payment is required for game
    isPaymentRequiredForGame(gameType) {
        return this.isPaymentRequired;
    }

    // Set payment requirement (for testing)
    setPaymentRequired(required) {
        this.isPaymentRequired = required;
    }
}

// Global payment gateway instance
window.paymentGateway = new PaymentGateway();
