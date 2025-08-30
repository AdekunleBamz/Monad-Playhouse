// Monad Playhouse - Wallet Connection Manager
// Handles wallet connection UI and flow

class WalletManager {
    constructor() {
        this.isConnected = false;
        this.account = null;
        this.balance = 0;
        this.walletModal = null;
        this.initialized = false; // Add initialized flag
        this.eventListenersSetup = false; // Add flag to track if event listeners are setup
    }

    // Initialize wallet manager
    async init() {
        // Prevent multiple initializations
        if (this.initialized) {
            console.log('Wallet manager already initialized, skipping...');
            return;
        }
        
        try {
            console.log('Initializing wallet manager...');
            
            // Create modal immediately
            this.createWalletModal();
            
            // Wait for DOM to be ready, then setup event listeners
            setTimeout(() => {
                this.setupEventListeners();
                this.updateWalletStatus();
                this.startWalletMonitoring();
                this.initialized = true;
                console.log('Wallet manager initialization completed');
            }, 500);
            
            console.log('Wallet manager initialization started');
        } catch (error) {
            console.error('Failed to initialize wallet manager:', error);
            // Still create the UI even if initialization fails
            this.createWalletModal();
            setTimeout(() => {
                this.setupEventListeners();
                this.startWalletMonitoring();
                this.initialized = true;
            }, 500);
        }
    }

    // Create wallet connection modal
    createWalletModal() {
        console.log('Creating wallet modal...');
        this.walletModal = document.createElement('div');
        this.walletModal.id = 'walletModal';
        this.walletModal.className = 'wallet-modal';
        this.walletModal.innerHTML = `
            <div class="wallet-content">
                <div class="wallet-header">
                    <h2>🔗 Connect Your Wallet</h2>
                    <button id="closeWallet" class="close-btn">×</button>
                </div>
                
                <div class="wallet-info">
                    <div class="wallet-status" id="walletStatus">
                        <div class="status-item">
                            <span class="status-label">Status:</span>
                            <span id="connectionStatus" class="status-value">Not Connected</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Account:</span>
                            <span id="accountAddress" class="status-value">-</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Balance:</span>
                            <span id="accountBalance" class="status-value">-</span>
                        </div>
                    </div>
                    
                    <div class="wallet-actions">
                        <button id="connectWalletBtn" class="connect-btn">Connect Wallet</button>
                        <button id="disconnectWalletBtn" class="disconnect-btn" style="display: none;">Disconnect</button>
                    </div>
                    
                    <div class="username-section">
                        <h4>👤 Set Your Username</h4>
                        <div class="username-input">
                            <input type="text" id="usernameInput" placeholder="Enter your username" maxlength="20">
                            <button id="saveUsernameBtn" class="save-btn">Save</button>
                        </div>
                    </div>
                    
                    <div class="wallet-help">
                        <h4>💡 How to Connect:</h4>
                        <ol>
                            <li>Install MetaMask or compatible wallet extension</li>
                            <li>Create or import your wallet</li>
                            <li>Ensure you have MON tokens for entry fees</li>
                            <li>Click "Connect Wallet" and approve the connection</li>
                        </ol>
                        

                        
                        <div class="wallet-requirements">
                            <h4>🎮 Game Requirements:</h4>
                            <ul>
                                <li>Minimum 0.1 MON balance for entry fees</li>
                                <li>Connected wallet to play games</li>
                                <li>Wallet required for leaderboard participation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.walletModal);
        this.addWalletStyles();
        console.log('Wallet modal created and added to DOM:', this.walletModal);
    }

    // Add wallet modal styles
    addWalletStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .wallet-modal {
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

            .wallet-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 20px;
                padding: 30px;
                width: 90%;
                max-width: 500px;
                border: 2px solid #4ecdc4;
                box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
            }

            .wallet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
                border-bottom: 2px solid #4ecdc4;
                padding-bottom: 15px;
            }

            .wallet-header h2 {
                color: #4ecdc4;
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

            .wallet-status {
                background: rgba(78, 205, 196, 0.1);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 25px;
                border: 1px solid #4ecdc4;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
            }

            .status-item:last-child {
                margin-bottom: 0;
            }

            .status-label {
                color: #888;
                font-size: 14px;
                font-weight: 500;
            }

            .status-value {
                color: #4ecdc4;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                font-size: 14px;
            }

            .status-value.connected {
                color: #00ff88;
            }

                    .status-value.insufficient {
            color: #ff6b6b;
        }
        
        .status-value.available {
            color: #4ecdc4;
        }

            .wallet-actions {
                text-align: center;
                margin-bottom: 25px;
            }
            
            .username-section {
                background: rgba(78, 205, 196, 0.1);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 25px;
                border: 1px solid #4ecdc4;
            }
            
            .username-section h4 {
                color: #4ecdc4;
                font-family: 'Orbitron', monospace;
                margin-bottom: 15px;
                font-size: 16px;
                text-align: center;
            }
            
            .username-input {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .username-input input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #4ecdc4;
                border-radius: 5px;
                padding: 10px;
                color: white;
                font-family: 'Orbitron', monospace;
                font-size: 14px;
            }
            
            .username-input input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .save-btn {
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            
            .save-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
            }

            .connect-btn, .disconnect-btn {
                padding: 15px 30px;
                border: none;
                border-radius: 25px;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 16px;
                margin: 0 10px;
            }

            .connect-btn {
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                color: white;
            }

            .connect-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
            }

            .disconnect-btn {
                background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
                color: white;
            }

            .disconnect-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
            }




            .wallet-help {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                padding: 20px;
                border-left: 4px solid #4ecdc4;
                text-align: left;
            }

            .wallet-help h4 {
                color: #4ecdc4;
                font-family: 'Orbitron', monospace;
                margin-bottom: 15px;
                font-size: 16px;
                text-align: left;
            }

            .wallet-help ol, .wallet-help ul {
                color: #ccc;
                font-size: 14px;
                margin: 0 0 20px 20px;
                line-height: 1.6;
                text-align: left;
            }

            .wallet-help li {
                margin-bottom: 8px;
                text-align: left;
            }

            .wallet-requirements {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(78, 205, 196, 0.3);
                text-align: left;
            }

            .wallet-requirements h4 {
                color: #00ff88;
                text-align: left;
            }

            .wallet-requirements ul {
                color: #00ff88;
                text-align: left;
            }

            .network-warning {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 193, 7, 0.3);
            }

            .network-warning h4 {
                color: #ffc107;
            }

            .network-warning ul {
                color: #ffc107;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        // Prevent duplicate event listeners
        if (this.eventListenersSetup) {
            console.log('Event listeners already setup, skipping...');
            return;
        }
        
        console.log('Setting up wallet manager event listeners...');
        
        // Wallet connect button in header
        const walletConnectBtn = document.getElementById('walletConnect');
        console.log('Wallet connect button found:', walletConnectBtn);
        
        if (walletConnectBtn) {
            // Remove existing listeners first
            walletConnectBtn.replaceWith(walletConnectBtn.cloneNode(true));
            const newWalletConnectBtn = document.getElementById('walletConnect');
            
            newWalletConnectBtn.addEventListener('click', (e) => {
                console.log('Wallet connect button clicked');
                this.show();
            });
        } else {
            console.error('Wallet connect button not found');
        }

        // Close wallet modal
        const closeWalletBtn = document.getElementById('closeWallet');
        console.log('Close wallet button found:', closeWalletBtn);
        if (closeWalletBtn) {
            // Remove existing listeners first
            closeWalletBtn.replaceWith(closeWalletBtn.cloneNode(true));
            const newCloseWalletBtn = document.getElementById('closeWallet');
            
            newCloseWalletBtn.addEventListener('click', (e) => {
                console.log('Close wallet button clicked');
                this.hide();
            });
        } else {
            console.error('Close wallet button not found');
        }

        // Connect wallet button
        const connectWalletBtn = document.getElementById('connectWalletBtn');
        console.log('Connect wallet button found:', connectWalletBtn);
        if (connectWalletBtn) {
            // Remove existing listeners first
            connectWalletBtn.replaceWith(connectWalletBtn.cloneNode(true));
            const newConnectWalletBtn = document.getElementById('connectWalletBtn');
            
            newConnectWalletBtn.addEventListener('click', (e) => {
                console.log('Connect wallet button clicked');
                this.connectWallet();
            });
        } else {
            console.error('Connect wallet button not found');
        }

        // Disconnect wallet button
        const disconnectWalletBtn = document.getElementById('disconnectWalletBtn');
        console.log('Disconnect wallet button found:', disconnectWalletBtn);
        if (disconnectWalletBtn) {
            // Remove existing listeners first
            disconnectWalletBtn.replaceWith(disconnectWalletBtn.cloneNode(true));
            const newDisconnectWalletBtn = document.getElementById('disconnectWalletBtn');
            
            newDisconnectWalletBtn.addEventListener('click', (e) => {
                console.log('Disconnect wallet button clicked');
                this.disconnectWallet();
            });
        } else {
            console.error('Disconnect wallet button not found');
        }

        // Save username button
        const saveUsernameBtn = document.getElementById('saveUsernameBtn');
        console.log('Save username button found:', saveUsernameBtn);
        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', (e) => {
                console.log('Save username button clicked');
                this.saveUsername();
            });
        } else {
            console.error('Save username button not found');
        }

        // Close on outside click
        if (this.walletModal) {
            this.walletModal.addEventListener('click', (e) => {
                if (e.target.id === 'walletModal') {
                    this.hide();
                }
            });
        }
        
        this.eventListenersSetup = true;
        console.log('Event listeners setup completed');
    }

    // Show wallet modal
    show() {
        console.log('Show method called, walletModal:', this.walletModal);
        if (this.walletModal) {
            this.walletModal.style.display = 'block';
            console.log('Modal displayed, updating status...');
            this.updateWalletStatus();
            
            // Populate username input with current username
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput) {
                const currentUsername = this.getUsername();
                usernameInput.value = currentUsername || '';
            }
        } else {
            console.error('Wallet modal not found');
        }
    }

    // Hide wallet modal
    hide() {
        this.walletModal.style.display = 'none';
    }

    // Connect wallet
    async connectWallet() {
        const connectBtn = document.getElementById('connectWalletBtn');
        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        try {
            if (!window.monadWallet) {
                this.showError('No wallet found. Please install MetaMask or compatible wallet extension.');
                return;
            }

            const success = await window.monadWallet.connect();
            if (success) {
                this.isConnected = true;
                this.account = window.monadWallet.account;
                // Update status immediately and then again after a short delay to ensure balance is loaded
                this.updateWalletStatus();
                setTimeout(() => this.updateWalletStatus(), 500);
                this.showSuccess('Wallet connected successfully!');
            } else {
                this.showError('Failed to connect wallet. Please try again.');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            if (error.message.includes('No wallet available')) {
                this.showError('No wallet found. Please install MetaMask or compatible wallet extension.');
            } else if (error.message.includes('User rejected')) {
                this.showError('Connection cancelled. Please try again and approve the connection.');
            } else if (error.message.includes('Monad Testnet')) {
                this.showError('Please add Monad Testnet to your wallet manually, then try connecting again.');
            } else {
                this.showError('Wallet connection failed. Please try again.');
            }
        } finally {
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    }

    // Disconnect wallet
    disconnectWallet() {
        window.monadWallet.disconnect();
        this.isConnected = false;
        this.account = null;
        this.balance = 0;
        this.updateWalletStatus();
        this.showSuccess('Wallet disconnected successfully!');
    }




    // Update wallet status display
    async updateWalletStatus() {
        console.log('Updating wallet status...');
        
        const statusElement = document.getElementById('connectionStatus');
        const addressElement = document.getElementById('accountAddress');
        const balanceElement = document.getElementById('accountBalance');
        const connectBtn = document.getElementById('connectWalletBtn');
        const disconnectBtn = document.getElementById('disconnectWalletBtn');
        const headerBtn = document.getElementById('walletConnect');

        // Check if DOM elements exist
        if (!statusElement || !addressElement || !balanceElement || !connectBtn || !disconnectBtn || !headerBtn) {
            console.error('Wallet status elements not found, re-initializing...');
            // Re-initialize if elements are missing
            setTimeout(() => {
                this.setupEventListeners();
                this.updateWalletStatus();
            }, 100);
            return;
        }

        // Check if wallet is available
        if (!window.monadWallet) {
            // Check if MetaMask is installed
            if (typeof window.ethereum !== 'undefined') {
                // MetaMask is available but not connected
                this.isConnected = false;
                this.account = null;
                this.balance = 0;

                statusElement.textContent = 'MetaMask Available';
                statusElement.className = 'status-value available';
                addressElement.textContent = 'Click Connect to Start';
                balanceElement.textContent = 'N/A';
                balanceElement.className = 'status-value insufficient';

                connectBtn.style.display = 'block';
                disconnectBtn.style.display = 'none';
                headerBtn.textContent = '🔗';
                headerBtn.className = 'control-btn wallet-btn';
                headerBtn.title = 'Connect MetaMask Wallet';
            } else {
                // No MetaMask installed
                this.isConnected = false;
                this.account = null;
                this.balance = 0;

                statusElement.textContent = 'MetaMask Not Found';
                statusElement.className = 'status-value insufficient';
                addressElement.textContent = 'Install MetaMask Extension';
                balanceElement.textContent = 'N/A';
                balanceElement.className = 'status-value insufficient';

                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'none';
                headerBtn.textContent = '🔗';
                headerBtn.className = 'control-btn wallet-btn';
                headerBtn.title = 'Install MetaMask to Connect';
            }
            
            // Update main page wallet details
            this.updateMainPageWalletDetails();
            return;
        }

        if (window.monadWallet.isConnected) {
            try {
                this.isConnected = true;
                this.account = window.monadWallet.account;
                
                // Get balance with error handling
                try {
                    this.balance = await window.monadWallet.getBalance();
                    console.log('WalletManager: Balance fetched:', this.balance, 'MON');
                } catch (balanceError) {
                    console.warn('WalletManager: Failed to get balance, using cached value:', balanceError);
                    this.balance = this.balance || 0;
                }

                statusElement.textContent = 'Connected';
                statusElement.className = 'status-value connected';
                addressElement.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                balanceElement.textContent = `${parseFloat(this.balance).toFixed(3)} MON`;
                
                if (parseFloat(this.balance) < 0.1) {
                    balanceElement.className = 'status-value insufficient';
                } else {
                    balanceElement.className = 'status-value connected';
                }

                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                headerBtn.textContent = '🔗 ✓';
                headerBtn.className = 'control-btn wallet-btn connected';
                headerBtn.title = 'Wallet Connected';
                
                // Update main page wallet details
                this.updateMainPageWalletDetails();
            } catch (error) {
                console.error('Failed to update wallet status:', error);
                this.isConnected = false;
                this.account = null;
                this.balance = 0;

                statusElement.textContent = 'Connection Error';
                statusElement.className = 'status-value insufficient';
                addressElement.textContent = 'Reconnect Required';
                balanceElement.textContent = 'N/A';
                balanceElement.className = 'status-value insufficient';

                connectBtn.style.display = 'inline-block';
                disconnectBtn.style.display = 'none';
                headerBtn.textContent = '🔗';
                headerBtn.className = 'control-btn wallet-btn';
                headerBtn.title = 'Reconnect Wallet';
                
                // Update main page wallet details
                this.updateMainPageWalletDetails();
            }
        } else {
            this.isConnected = false;
            this.account = null;
            this.balance = 0;

            statusElement.textContent = 'Not Connected';
            statusElement.className = 'status-value';
            addressElement.textContent = '-';
            balanceElement.textContent = '-';
            balanceElement.className = 'status-value';

            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            headerBtn.textContent = '🔗';
            headerBtn.className = 'control-btn wallet-btn';
            headerBtn.title = 'Connect Wallet';
            
            // Update main page wallet details
            this.updateMainPageWalletDetails();
        }
    }

    // Update main page wallet details display
    updateMainPageWalletDetails() {
        const walletDetails = document.getElementById('walletDetails');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');
        const depositAmount = document.getElementById('depositAmount');
        const userDeposited = document.getElementById('userDeposited');
        const usernameDisplay = document.getElementById('usernameDisplay');
        
        if (!walletDetails || !walletAddress || !walletBalance || !depositAmount || !userDeposited || !usernameDisplay) {
            console.log('Wallet details elements not found, skipping update');
            return;
        }
        
        if (this.isConnected && this.account) {
            // Show wallet details
            walletDetails.style.display = 'block';
            walletAddress.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            walletBalance.textContent = `${parseFloat(this.balance).toFixed(3)} MON`;
            depositAmount.textContent = '0.1 MON';
            
            // Calculate total deposited (this would come from blockchain in production)
            const totalDeposited = this.calculateTotalDeposited();
            userDeposited.textContent = `${totalDeposited.toFixed(3)} MON`;
            
            // Get username from localStorage or blockchain
            const username = this.getUsername();
            usernameDisplay.textContent = username || 'Not set';
            
            // Update deposit amount color based on balance
            if (parseFloat(this.balance) < 0.1) {
                depositAmount.style.color = '#ff6b6b';
            } else {
                depositAmount.style.color = '#4ecdc4';
            }
        } else {
            // Hide wallet details
            walletDetails.style.display = 'none';
        }
    }
    
    // Calculate total deposited amount (placeholder - would come from blockchain)
    calculateTotalDeposited() {
        // Get total deposited from localStorage (tracks user's deposits)
        const totalDeposited = localStorage.getItem('monadPlayhouseTotalDeposited');
        if (totalDeposited) {
            return parseFloat(totalDeposited);
        }
        
        // For now, return a placeholder value
        // In production, this would query the blockchain for total deposits
        return 0.0;
    }
    
    // Get username from localStorage or blockchain
    getUsername() {
        // Check localStorage first
        const savedUsername = localStorage.getItem('monadPlayhouseUsername');
        if (savedUsername) {
            return savedUsername;
        }
        
        // If no saved username, return null (will show "Not set")
        return null;
    }
    
    // Track when user deposits and plays a game
    trackGameDeposit(gameType, playerName) {
        // Save username if provided
        if (playerName && playerName.trim()) {
            localStorage.setItem('monadPlayhouseUsername', playerName.trim());
        }
        
        // Track deposit amount (0.1 MON per game)
        const currentTotal = this.calculateTotalDeposited();
        const newTotal = currentTotal + 0.1;
        localStorage.setItem('monadPlayhouseTotalDeposited', newTotal.toString());
        
        // Update the display
        this.updateMainPageWalletDetails();
        
        console.log('Game deposit tracked:', { gameType, playerName, newTotal });
    }
    
    // Save username from input field
    saveUsername() {
        const usernameInput = document.getElementById('usernameInput');
        const username = usernameInput.value.trim();
        
        if (username) {
            localStorage.setItem('monadPlayhouseUsername', username);
            this.showSuccess('Username saved successfully!');
            
            // Update the display
            this.updateMainPageWalletDetails();
            
            // Clear the input
            usernameInput.value = '';
            
            console.log('Username saved:', username);
        } else {
            this.showError('Please enter a valid username');
        }
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;
        
        const bgColor = type === 'success' ? 'linear-gradient(45deg, #00ff88, #4ecdc4)' : 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Check if wallet is connected and has sufficient balance
    async canPlayGames() {
        if (!window.monadWallet) {
            return {
                canPlay: false,
                reason: 'No wallet found',
                action: 'Please install MetaMask or compatible wallet extension'
            };
        }

        if (!this.isConnected) {
            return {
                canPlay: false,
                reason: 'Wallet not connected',
                action: 'Please connect your wallet first'
            };
        }

        if (this.balance < 0.1) {
            return {
                canPlay: false,
                reason: 'Insufficient balance',
                action: 'You need at least 0.1 MON to play games'
            };
        }

        return {
            canPlay: true,
            reason: 'Ready to play',
            action: 'You can start playing games!'
        };
    }

    // Start wallet monitoring to detect disconnections and restore state
    startWalletMonitoring() {
        console.log('Starting wallet monitoring...');
        
        // Monitor wallet connection every 5 seconds
        setInterval(() => {
            this.checkWalletHealth();
        }, 5000);
        
        // Monitor MetaMask account changes
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('MetaMask accounts changed:', accounts);
                this.handleAccountChange(accounts);
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('MetaMask chain changed:', chainId);
                this.handleChainChange(chainId);
            });
            
            window.ethereum.on('disconnect', () => {
                console.log('MetaMask disconnected');
                this.handleDisconnect();
            });
        }
    }

    // Check wallet health and restore if needed
    async checkWalletHealth() {
        try {
            if (!window.monadWallet) {
                console.log('MonadWallet not available, skipping health check');
                return;
            }

            // DO NOT auto-restore connection - user must manually approve each time
            // Only check if DOM elements are still working (less aggressive)
            const connectBtn = document.getElementById('connectWalletBtn');
            if (!connectBtn) {
                console.log('Wallet button not found, re-initializing...');
                this.setupEventListeners();
            }
        } catch (error) {
            console.error('Wallet health check failed:', error);
        }
    }

    // Handle MetaMask account changes
    handleAccountChange(accounts) {
        if (accounts.length === 0) {
            // User disconnected
            this.isConnected = false;
            this.account = null;
            this.balance = 0;
            this.updateWalletStatus();
        } else if (accounts[0] !== this.account) {
            // User switched accounts - require manual re-approval
            this.isConnected = false;
            this.account = null;
            this.balance = 0;
            this.updateWalletStatus();
            console.log('Account changed, requiring manual re-approval');
        }
    }

    // Handle MetaMask chain changes
    handleChainChange(chainId) {
        console.log('Chain changed to:', chainId);
        // Check if we're still on Monad Testnet
        const monadChainId = '0x' + parseInt('10143').toString(16);
        if (chainId !== monadChainId) {
            console.log('Not on Monad Testnet, attempting to switch back...');
            if (window.monadWallet) {
                window.monadWallet.ensureMonadNetwork();
            }
        }
    }

    // Handle MetaMask disconnect
    handleDisconnect() {
        this.isConnected = false;
        this.account = null;
        this.balance = 0;
        this.updateWalletStatus();
    }
}

// Global wallet manager instance - will be initialized by script.js
// Removed duplicate initialization to prevent conflicts
