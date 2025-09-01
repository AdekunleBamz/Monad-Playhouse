class MGIDIntegration {
    constructor() {
        this.isConnected = false;
        this.userInfo = null;
        this.mgidUsername = null;
        this.walletAddress = null;
        this.setupEventListeners();
        console.log('🎮 MGID Integration initialized');
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const connectBtn = document.getElementById('connectWallet');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (connectBtn) {
                connectBtn.addEventListener('click', () => this.showUsernamePrompt());
            }
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        });
    }

    showUsernamePrompt() {
        const overlay = document.createElement('div');
        overlay.className = 'mgid-username-overlay';
        overlay.innerHTML = `
            <div class="mgid-username-popup">
                <h3>🎮 Connect to Monad Games ID</h3>
                <p>Enter your MGID username or register a new one</p>
                
                <div class="username-input-section">
                    <input 
                        type="text" 
                        id="mgidUsernameInput" 
                        placeholder="Enter your MGID username"
                        class="mgid-username-input"
                    />
                </div>
                
                <div class="mgid-auth-actions">
                    <button id="mgidConnectBtn" class="btn btn-primary">
                        🚀 Connect with MGID
                    </button>
                    <button id="mgidRegisterBtn" class="btn mgid-register-btn">
                        ✨ Register New Username
                    </button>
                    <button id="mgidCancelBtn" class="btn btn-secondary">
                        ❌ Cancel
                    </button>
                </div>
                
                <div class="mgid-instructions">
                    <p><strong>New to MGID?</strong></p>
                    <ol>
                        <li>Click "Register New Username" to go to MGID</li>
                        <li>Create your account and username</li>
                        <li>Return here and enter your username</li>
                        <li>Click "Connect with MGID"</li>
                    </ol>
                </div>
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
        const usernameInput = document.getElementById('mgidUsernameInput');
        const connectBtn = document.getElementById('mgidConnectBtn');
        const registerBtn = document.getElementById('mgidRegisterBtn');
        const cancelBtn = document.getElementById('mgidCancelBtn');

        connectBtn.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username) {
                this.connectWithUsername(username);
                document.body.removeChild(overlay);
            } else {
                alert('Please enter a username');
            }
        });

        registerBtn.addEventListener('click', () => {
            window.open('https://monad-games-id-site.vercel.app/', '_blank');
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Handle Enter key
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                connectBtn.click();
            }
        });

        // Focus on input
        setTimeout(() => usernameInput.focus(), 100);

        // Close on background click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }

    async connectWithUsername(username) {
        try {
            console.log('🔗 Connecting with MGID username:', username);
            
            // Simulate connection process
            this.mgidUsername = username;
            this.isConnected = true;
            this.userInfo = {
                username: username,
                displayName: username,
                wallet: await this.getWalletAddress()
            };

            console.log('✅ MGID connection successful:', this.userInfo);
            this.updateUI();
            this.showSuccessMessage(`Welcome ${username}! Connected to MGID.`);
            
            // Optional: Verify with MGID API
            await this.verifyMGIDConnection(username);
            
        } catch (error) {
            console.error('❌ MGID connection failed:', error);
            this.showError('Failed to connect to MGID. Please try again.');
        }
    }

    async getWalletAddress() {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                return accounts[0];
            }
        } catch (error) {
            console.error('Failed to get wallet address:', error);
        }
        return null;
    }

    async verifyMGIDConnection(username) {
        try {
            // Try to verify the username exists on MGID
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/users/${username}`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ MGID username verified:', data);
            } else {
                console.log('⚠️ Username not found on MGID - user may need to register');
            }
        } catch (error) {
            console.log('ℹ️ Could not verify MGID username (API may be unavailable)');
        }
    }

    logout() {
        this.isConnected = false;
        this.userInfo = null;
        this.mgidUsername = null;
        this.walletAddress = null;
        this.updateUI();
        console.log('🚪 Logged out of MGID');
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWallet');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');

        if (this.isConnected && this.userInfo) {
            if (connectBtn) connectBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userInfo) {
                userInfo.style.display = 'block';
                userInfo.innerHTML = `
                    <div class="user-details">
                        <span class="username">🎮 ${this.userInfo.username}</span>
                        ${this.userInfo.wallet ? `<span class="wallet">${this.userInfo.wallet.slice(0,6)}...${this.userInfo.wallet.slice(-4)}</span>` : ''}
                    </div>
                `;
            }
        } else {
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    // API methods for game integration
    isUserAuthenticated() {
        return this.isConnected && this.mgidUsername;
    }

    getUserInfo() {
        return this.userInfo;
    }

    getUsername() {
        return this.mgidUsername;
    }

    async submitScore(gameType, score, playerName, duration) {
        try {
            if (!this.isUserAuthenticated()) {
                throw new Error('User not authenticated with MGID');
            }

            console.log('📊 Submitting score to MGID leaderboard:', {
                gameType,
                score,
                playerName: this.mgidUsername,
                duration
            });

            // Submit to backend
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameType,
                    score,
                    playerName: this.mgidUsername,
                    duration,
                    wallet: this.userInfo?.wallet
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Score submitted successfully:', result);
                return { success: true, data: result };
            } else {
                throw new Error('Score submission failed');
            }
        } catch (error) {
            console.error('❌ Score submission failed:', error);
            return { success: false, error: error.message };
        }
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'mgid-notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00ff88;
            color: #000;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'mgid-notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: #fff;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize MGID Integration
document.addEventListener('DOMContentLoaded', () => {
    window.mgidIntegration = new MGIDIntegration();
});
