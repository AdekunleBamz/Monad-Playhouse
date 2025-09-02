// Direct MGID Integration using wallet connection
// Following MGID documentation pattern but with direct wallet access

class MGIDWalletIntegration {
    constructor() {
        this.isConnected = false;
        this.userInfo = null;
        this.mgidUsername = null;
        this.mgidWallet = null;
        this.crossAppId = 'cmd8euall0037le0my79qpz42'; // Monad Games ID Cross App ID
        
        this.setupEventListeners();
        console.log('🎮 MGID Wallet Integration initialized');
    }

    setupEventListeners() {
        const setupListeners = () => {
            const connectBtn = document.getElementById('connectWallet');
            const logoutBtn = document.getElementById('logoutBtn');
            
            console.log('🔗 Setting up MGID Wallet event listeners');
            console.log('connectBtn found:', !!connectBtn);
            console.log('logoutBtn found:', !!logoutBtn);
            
            if (connectBtn) {
                console.log('✅ Adding click listener to connectWallet button');
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🎮 Connect button clicked - starting MGID wallet login');
                    this.connectWalletAndMGID();
                });
            } else {
                console.error('❌ connectWallet button not found!');
            }
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupListeners);
        } else {
            setupListeners();
        }
    }

    async connectWalletAndMGID() {
        try {
            console.log('🔗 Starting wallet connection for MGID...');
            
            // Connect wallet first (using existing wallet system)
            if (window.monadWallet && typeof window.monadWallet.connect === 'function') {
                console.log('💰 Connecting via MonadWallet...');
                const connected = await window.monadWallet.connect();
                if (connected) {
                    this.mgidWallet = window.monadWallet.address;
                    console.log('✅ Wallet connected:', this.mgidWallet);
                } else {
                    throw new Error('Failed to connect wallet');
                }
            } else {
                // Fallback to direct MetaMask connection
                console.log('💰 Connecting via MetaMask...');
                if (!window.ethereum) {
                    throw new Error('MetaMask not found');
                }
                
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.mgidWallet = accounts[0];
                    console.log('✅ Wallet connected:', this.mgidWallet);
                } else {
                    throw new Error('No accounts found');
                }
            }

            // Now check MGID username
            await this.fetchMGIDUsername();
            
            if (this.mgidUsername) {
                this.isConnected = true;
                this.userInfo = {
                    username: this.mgidUsername,
                    wallet: this.mgidWallet
                };
                
                console.log('✅ MGID connection successful:', this.userInfo);
                this.updateUI();
                this.showSuccessMessage(`Welcome ${this.mgidUsername}! Connected via MGID.`);
            } else {
                console.log('⚠️ No MGID username found for wallet:', this.mgidWallet);
                this.promptRegister();
            }

        } catch (error) {
            console.error('❌ MGID wallet connection failed:', error);
            this.showError('Failed to connect wallet for MGID. Please try again.');
        }
    }

    async fetchMGIDUsername() {
        try {
            if (!this.mgidWallet) return;

            console.log('🔍 Fetching MGID username for wallet:', this.mgidWallet);
            
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.mgidWallet}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📝 MGID API Response:', data);
                
                if (data.hasUsername && data.user && data.user.username) {
                    this.mgidUsername = data.user.username;
                    console.log('✅ MGID username found:', this.mgidUsername);
                } else {
                    console.log('⚠️ No username registered for this wallet');
                    this.mgidUsername = null;
                }
            } else {
                console.log('⚠️ MGID API request failed:', response.status);
                this.mgidUsername = null;
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch MGID username:', error);
            this.mgidUsername = null;
        }
    }

    promptRegister() {
        // Create a custom popup instead of using confirm
        this.showRegistrationPrompt();
    }

    showRegistrationPrompt() {
        // Remove any existing popup
        const existingPopup = document.querySelector('.mgid-registration-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'mgid-registration-popup';
        popup.innerHTML = `
            <div class="mgid-popup-overlay">
                <div class="mgid-popup-content">
                    <h3>🎮 MGID Registration Required</h3>
                    <p>Your wallet <strong>${this.mgidWallet.slice(0,6)}...${this.mgidWallet.slice(-4)}</strong> is not registered with Monad Games ID.</p>
                    <p>Register a username to compete on the global leaderboard!</p>
                    <div class="mgid-popup-buttons">
                        <button class="mgid-register-btn" onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')">
                            🔗 Register on MGID
                        </button>
                        <button class="mgid-cancel-btn" onclick="this.parentElement.parentElement.parentElement.parentElement.remove()">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        `;

        const overlay = popup.querySelector('.mgid-popup-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = popup.querySelector('.mgid-popup-content');
        content.style.cssText = `
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
            border: 2px solid #00ff88;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
            color: #fff;
        `;

        const registerBtn = popup.querySelector('.mgid-register-btn');
        registerBtn.style.cssText = `
            background: #00ff88;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        `;

        const cancelBtn = popup.querySelector('.mgid-cancel-btn');
        cancelBtn.style.cssText = `
            background: #ff4444;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            margin: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(popup);
    }

    logout() {
        try {
            this.isConnected = false;
            this.userInfo = null;
            this.mgidUsername = null;
            this.mgidWallet = null;
            this.updateUI();
            console.log('🚪 Logged out of MGID');
            
        } catch (error) {
            console.error('❌ Logout failed:', error);
        }
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
                        <span class="wallet">${this.userInfo.wallet.slice(0,6)}...${this.userInfo.wallet.slice(-4)}</span>
                        <span class="mgid-badge">MGID</span>
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
        return this.isConnected && this.mgidUsername && this.mgidWallet;
    }

    getUserInfo() {
        return this.userInfo;
    }

    getUsername() {
        return this.mgidUsername;
    }

    getMGIDWallet() {
        return this.mgidWallet;
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
                wallet: this.mgidWallet,
                duration
            });

            // Submit to backend with MGID wallet
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameType,
                    score,
                    playerName: this.mgidUsername,
                    playerAddress: this.mgidWallet, // Use MGID wallet
                    mgidUsername: this.mgidUsername,
                    duration,
                    wallet: this.mgidWallet
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

// Initialize MGID Wallet Integration
const initMGIDWallet = () => {
    console.log('🚀 Initializing MGID Wallet Integration...');
    window.mgidIntegration = new MGIDWalletIntegration();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMGIDWallet);
} else {
    initMGIDWallet();
}
