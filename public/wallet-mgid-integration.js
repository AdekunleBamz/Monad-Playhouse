// Wallet-based MGID Integration
// Works with wallet connection to integrate with MGID system

class WalletMGIDIntegration {
    constructor() {
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.walletAddress = null;
        this.mgidUsername = null;
        this.hasUsername = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('🎯 Initializing Wallet-based MGID Integration...');
            
            this.setupEventListeners();
            this.updateUI();
            
            this.isInitialized = true;
            console.log('✅ Wallet MGID Integration initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Wallet MGID Integration:', error);
        }
    }

    setupEventListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.disconnect());
        }

        // Listen for wallet connection events
        window.addEventListener('walletConnected', (event) => {
            this.handleWalletConnection(event.detail.address);
        });

        window.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnection();
        });
    }

    async connectWallet() {
        try {
            console.log('🔗 Connecting wallet for MGID integration...');
            
            if (!window.monadWallet) {
                throw new Error('Monad Wallet not available');
            }

            const success = await window.monadWallet.connect();
            if (success && window.monadWallet.account) {
                await this.handleWalletConnection(window.monadWallet.account);
            } else {
                throw new Error('Failed to connect wallet');
            }
            
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.showError(error.message || 'Failed to connect wallet');
        }
    }

    async handleWalletConnection(address) {
        try {
            this.walletAddress = address;
            this.isAuthenticated = true;
            
            console.log('✅ Wallet connected:', address);
            
            // Check MGID username
            await this.fetchMGIDUsername();
            
            this.updateUI();
            this.showSuccess('Wallet connected successfully!');
            
                    // Show username registration prompt if needed
        if (!this.hasUsername) {
            this.showUsernameRegistrationPrompt();
        }

        // Set up periodic username check (every 30 seconds)
        this.startUsernameCheckInterval();
            
        } catch (error) {
            console.error('❌ Failed to handle wallet connection:', error);
        }
    }

    handleWalletDisconnection() {
        this.walletAddress = null;
        this.isAuthenticated = false;
        this.mgidUsername = null;
        this.hasUsername = false;
        
        // Clear username check interval
        if (this.usernameCheckInterval) {
            clearInterval(this.usernameCheckInterval);
            this.usernameCheckInterval = null;
        }
        
        this.updateUI();
        console.log('🚪 Wallet disconnected');
    }

    disconnect() {
        if (window.monadWallet) {
            window.monadWallet.disconnect();
        }
        this.handleWalletDisconnection();
    }

    async fetchMGIDUsername() {
        try {
            if (!this.walletAddress) return;

            console.log('🔍 Fetching MGID username for:', this.walletAddress);
            
            // First, try to connect directly to MGID site and see if user is already signed in
            try {
                // Check if user has MGID session by trying to access the API
                const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.walletAddress}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`📝 MGID API Response:`, data);
                    
                    if (data.hasUsername && data.user) {
                        this.mgidUsername = data.user.username;
                        this.hasUsername = true;
                        console.log('✅ MGID username found:', this.mgidUsername);
                        return;
                    }
                }
                
                // If no direct username found, redirect user to MGID for proper authentication
                console.log('⚠️ No MGID username found - redirecting to MGID for authentication');
                this.mgidUsername = null;
                this.hasUsername = false;
                this.showMGIDAuthenticationPrompt();
                
            } catch (err) {
                console.log(`❌ MGID API call failed:`, err.message);
                this.mgidUsername = null;
                this.hasUsername = false;
                this.showMGIDAuthenticationPrompt();
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch MGID username:', error);
            this.mgidUsername = null;
            this.hasUsername = false;
        }
    }

    showMGIDAuthenticationPrompt() {
        const overlay = document.createElement('div');
        overlay.className = 'mgid-auth-overlay';
        overlay.innerHTML = `
            <div class="mgid-auth-popup">
                <h3>🎮 Complete MGID Authentication</h3>
                <p>To use the global leaderboard, you need to authenticate with Monad Games ID.</p>
                <p><strong>Your wallet:</strong> ${this.walletAddress?.slice(0,6)}...${this.walletAddress?.slice(-4)}</p>
                
                <div class="mgid-instructions">
                    <h4>📋 Authentication Steps:</h4>
                    <ol>
                        <li>Click "Go to MGID" below</li>
                        <li>Sign in with the same wallet (${this.walletAddress?.slice(0,6)}...${this.walletAddress?.slice(-4)})</li>
                        <li>Complete authentication/registration if needed</li>
                        <li>Return here and refresh the page</li>
                    </ol>
                </div>
                
                <div class="mgid-auth-actions">
                    <button id="mgidGoToSite" class="btn btn-primary">
                        🚀 Go to MGID
                    </button>
                    <button id="mgidRefreshCheck" class="btn mgid-refresh-btn">
                        🔄 I'm Authenticated - Check Again
                    </button>
                    <button id="mgidSkipAuth" class="btn btn-secondary">
                        ⏭️ Skip for Now
                    </button>
                </div>
                <p class="mgid-note">
                    <small>💡 MGID uses embedded wallets. After authentication, your username should be detected automatically.</small>
                </p>
            </div>
        `;

        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(overlay);

        // Add event listeners
        document.getElementById('mgidGoToSite').addEventListener('click', () => {
            window.open('https://monad-games-id-site.vercel.app/', '_blank');
        });

        document.getElementById('mgidRefreshCheck').addEventListener('click', async () => {
            const refreshBtn = document.getElementById('mgidRefreshCheck');
            refreshBtn.textContent = '🔄 Checking...';
            refreshBtn.disabled = true;
            
            await this.fetchMGIDUsername();
            this.updateUI();
            
            if (this.hasUsername) {
                document.body.removeChild(overlay);
                this.showSuccessMessage(`✅ Welcome ${this.mgidUsername}! MGID authentication confirmed.`);
            } else {
                refreshBtn.textContent = '🔄 I\'m Authenticated - Check Again';
                refreshBtn.disabled = false;
                // Show helpful message
                const noteEl = overlay.querySelector('.mgid-note small');
                noteEl.innerHTML = '⚠️ Username still not found. Make sure you completed authentication with the same wallet address, then try again.';
                noteEl.style.color = '#ffa500';
            }
        });

        document.getElementById('mgidSkipAuth').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    startUsernameCheckInterval() {
        // Clear any existing interval
        if (this.usernameCheckInterval) {
            clearInterval(this.usernameCheckInterval);
        }

        // Check for username every 30 seconds
        this.usernameCheckInterval = setInterval(async () => {
            if (this.isAuthenticated && this.walletAddress && !this.hasUsername) {
                console.log('🔄 Checking for MGID username update...');
                const oldUsername = this.mgidUsername;
                await this.fetchMGIDUsername();
                
                // If username was found, update UI and clear interval
                if (this.hasUsername && this.mgidUsername !== oldUsername) {
                    console.log('✅ MGID username detected:', this.mgidUsername);
                    this.updateUI();
                    this.showSuccess(`Welcome ${this.mgidUsername}! Your MGID username is now active.`);
                    clearInterval(this.usernameCheckInterval);
                    this.usernameCheckInterval = null;
                }
            }
        }, 30000); // Check every 30 seconds
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWallet');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');

        if (this.isAuthenticated && this.walletAddress) {
            // Update connect button
            if (connectBtn) {
                connectBtn.innerHTML = `🔗 ${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
                connectBtn.style.background = 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)';
                connectBtn.disabled = true;
            }

            // Show logout button
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
            }

            // Show user info
            if (userInfo) {
                const displayName = this.mgidUsername || `${this.walletAddress.slice(0, 6)}...${this.walletAddress.slice(-4)}`;
                const mgidStatus = this.hasUsername ? '🎯 MGID User' : '⚠️ No MGID Username';
                
                userInfo.innerHTML = `
                    <div class="wallet-user-info">
                        <span class="wallet-badge">🔗 Connected</span>
                        <span class="user-display">${displayName}</span>
                        <span class="mgid-status">${mgidStatus}</span>
                    </div>
                `;
                userInfo.style.display = 'block';
            }
        } else {
            // Reset to disconnected state
            if (connectBtn) {
                connectBtn.innerHTML = '🔗 Connect Wallet';
                connectBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
                connectBtn.disabled = false;
            }

            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }

            if (userInfo) {
                userInfo.style.display = 'none';
            }
        }
    }

    showUsernameRegistrationPrompt() {
        const notification = document.createElement('div');
        notification.className = 'mgid-username-prompt';
        notification.innerHTML = `
            <div class="mgid-prompt-content">
                <h4>🎯 Register Your MGID Username</h4>
                <p>Register a unique username to appear on the global MGID leaderboard and compete with players from all games!</p>
                <div class="mgid-prompt-buttons">
                    <button onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')" class="mgid-register-btn">
                        🎯 Register Username
                    </button>
                    <button onclick="window.walletMGID.checkUsernameNow(); this.parentElement.parentElement.parentElement.remove()" class="mgid-refresh-btn">
                        🔄 Check Again
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="mgid-close-btn">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.4s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.4s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 400);
            }
        }, 15000);
    }

    showSuccess(message) {
        this.showNotification('✅ Success', message, 'success');
    }

    showError(message) {
        this.showNotification('❌ Error', message, 'error');
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `wallet-notification wallet-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;

        const bgColor = type === 'success' ? '#4ECDC4' : 
                       type === 'error' ? '#ff6b6b' : '#667eea';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Score submission method
    async submitScore(gameType, score, playerName, gameDuration) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Please connect your wallet first');
            }

            if (!this.walletAddress) {
                throw new Error('No wallet address found');
            }

            const payload = {
                gameType,
                score,
                playerName: this.mgidUsername || playerName || 'Anonymous',
                gameDuration,
                playerAddress: this.walletAddress,
                mgidUsername: this.mgidUsername
            };

            console.log('🎯 Submitting score via wallet MGID integration:', payload);

            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to submit score');
            }

            const result = await response.json();
            console.log('✅ Score submitted successfully:', result);
            
            this.showSuccess('Score submitted to leaderboard! 🎯');
            return result;

        } catch (error) {
            console.error('❌ Score submission failed:', error);
            this.showError(error.message || 'Failed to submit score');
            throw error;
        }
    }

    // Public API methods
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getUser() {
        if (!this.isAuthenticated) return null;
        
        return {
            wallet: this.walletAddress,
            username: this.mgidUsername,
            hasUsername: this.hasUsername,
            type: 'wallet-mgid'
        };
    }

    getWalletAddress() {
        return this.walletAddress;
    }

    getMGIDUsername() {
        return this.mgidUsername;
    }

    hasUsernameRegistered() {
        return this.hasUsername;
    }

    // Manual username check method
    async checkUsernameNow() {
        if (!this.isAuthenticated || !this.walletAddress) {
            this.showError('Please connect your wallet first');
            return;
        }

        console.log('🔄 Manual MGID username check...');
        const oldUsername = this.mgidUsername;
        await this.fetchMGIDUsername();
        
        if (this.hasUsername && this.mgidUsername !== oldUsername) {
            console.log('✅ MGID username found:', this.mgidUsername);
            this.updateUI();
            this.showSuccess(`Welcome ${this.mgidUsername}! Your MGID username is now active.`);
            
            // Clear the check interval since we found the username
            if (this.usernameCheckInterval) {
                clearInterval(this.usernameCheckInterval);
                this.usernameCheckInterval = null;
            }
        } else if (!this.hasUsername) {
            this.showError('Username not found yet. Please make sure you completed registration on the MGID site.');
        } else {
            this.showSuccess('Username already detected!');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.walletMGID = new WalletMGIDIntegration();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .mgid-prompt-buttons {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .mgid-register-btn, .mgid-close-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .mgid-register-btn {
        background: rgba(255,255,255,0.2);
        color: white;
        flex: 1;
    }
    
    .mgid-refresh-btn {
        background: rgba(100,200,255,0.2);
        color: white;
        flex: 1;
    }
    
    .mgid-refresh-btn:hover {
        background: rgba(100,200,255,0.3);
        transform: translateY(-1px);
    }
    
    .mgid-register-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-1px);
    }
    
    .mgid-close-btn {
        background: rgba(0,0,0,0.2);
        color: white;
    }
    
    .mgid-close-btn:hover {
        background: rgba(0,0,0,0.3);
    }
    
    .wallet-user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 15px;
        background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
        border-radius: 10px;
        color: white;
        font-size: 14px;
    }
    
    .wallet-badge {
        background: rgba(255,255,255,0.2);
        padding: 4px 8px;
        border-radius: 5px;
        font-weight: bold;
        font-size: 12px;
    }
    
    .user-display {
        font-weight: bold;
    }
    
    .mgid-status {
        font-size: 12px;
        opacity: 0.9;
    }
`;
document.head.appendChild(style);
