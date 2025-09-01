// MGID Privy Integration - Proper implementation following MGID documentation
// This replaces wallet-mgid-integration.js with correct Privy embedded wallet support

class MGIDPrivyIntegration {
    constructor() {
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.mgidWalletAddress = null;
        this.mgidUsername = null;
        this.hasUsername = false;
        this.privyUser = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('🎯 Initializing MGID Privy Integration...');
            
            // Wait for Privy SDK to load
            await this.waitForPrivy();
            
            this.setupEventListeners();
            this.updateUI();
            
            this.isInitialized = true;
            console.log('✅ MGID Privy Integration initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize MGID Privy Integration:', error);
            this.showError('Failed to initialize MGID integration. Please refresh the page.');
        }
    }

    async waitForPrivy() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 15;
            
            const checkPrivy = () => {
                attempts++;
                console.log(`🔍 Waiting for Privy SDK... (${attempts}/${maxAttempts})`);
                
                if (window.Privy && window.Privy.PrivyProvider) {
                    console.log('✅ Privy SDK loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Privy SDK failed to load'));
                } else {
                    setTimeout(checkPrivy, 1000);
                }
            };
            
            checkPrivy();
        });
    }

    setupEventListeners() {
        // MGID Login button
        const mgidLoginBtn = document.getElementById('mgidLogin');
        if (mgidLoginBtn) {
            mgidLoginBtn.addEventListener('click', () => this.loginWithMGID());
        }

        // Connect wallet button (fallback)
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.loginWithMGID());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async loginWithMGID() {
        try {
            console.log('🔐 Starting MGID login process...');
            
            if (!window.Privy) {
                throw new Error('Privy SDK not loaded');
            }

            // Login with Privy - this will trigger MGID flow
            const user = await window.Privy.login();
            
            if (user) {
                console.log('👤 Privy user authenticated:', user);
                this.privyUser = user;
                await this.handlePrivyAuthentication(user);
            }
            
        } catch (error) {
            console.error('❌ MGID login failed:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async handlePrivyAuthentication(user) {
        try {
            console.log('🔍 Processing Privy authentication...');
            
            // Check if user has linked accounts (cross-app accounts)
            if (user.linkedAccounts && user.linkedAccounts.length > 0) {
                
                // Get the cross app account created using Monad Games ID
                const crossAppAccount = user.linkedAccounts.filter(account => 
                    account.type === "cross_app" && 
                    account.providerApp.id === "cmd8euall0037le0my79qpz42"
                )[0];
                
                if (crossAppAccount && crossAppAccount.embeddedWallets && crossAppAccount.embeddedWallets.length > 0) {
                    // The first embedded wallet created using Monad Games ID is the wallet address
                    this.mgidWalletAddress = crossAppAccount.embeddedWallets[0].address;
                    console.log('🏦 MGID embedded wallet found:', this.mgidWalletAddress);
                    
                    this.isAuthenticated = true;
                    
                    // Fetch username using the embedded wallet address
                    await this.fetchMGIDUsername();
                    this.updateUI();
                    
                    // Trigger wallet connected event for other components
                    window.dispatchEvent(new CustomEvent('mgidWalletConnected', {
                        detail: { address: this.mgidWalletAddress, username: this.mgidUsername }
                    }));
                    
                } else {
                    console.warn('⚠️ No MGID embedded wallet found in cross-app account');
                    this.showError('MGID wallet not found. Please ensure you signed in with Monad Games ID.');
                }
                
            } else {
                console.warn('⚠️ No linked accounts found');
                this.showError('You need to link your Monad Games ID account to continue.');
            }
            
        } catch (error) {
            console.error('❌ Failed to handle Privy authentication:', error);
            this.showError('Authentication processing failed.');
        }
    }

    async fetchMGIDUsername() {
        try {
            if (!this.mgidWalletAddress) return;

            console.log('🔍 Fetching MGID username for embedded wallet:', this.mgidWalletAddress);
            
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.mgidWalletAddress}`);
            
            if (!response.ok) {
                console.warn('Failed to check MGID username - API not available');
                return;
            }
            
            const data = await response.json();
            console.log('📝 MGID API Response:', data);

            if (data.hasUsername && data.user) {
                this.mgidUsername = data.user.username;
                this.hasUsername = true;
                console.log('✅ MGID username found:', this.mgidUsername);
            } else {
                console.log('⚠️ No MGID username found - user needs to register');
                this.mgidUsername = null;
                this.hasUsername = false;
                this.showUsernameRegistrationPrompt();
            }
        } catch (error) {
            console.error('❌ Failed to fetch MGID username:', error);
            this.mgidUsername = null;
            this.hasUsername = false;
        }
    }

    async logout() {
        try {
            if (window.Privy && window.Privy.logout) {
                await window.Privy.logout();
            }
            
            this.handleLogout();
            
        } catch (error) {
            console.error('❌ Logout failed:', error);
            this.handleLogout(); // Force logout locally
        }
    }

    handleLogout() {
        this.mgidWalletAddress = null;
        this.isAuthenticated = false;
        this.mgidUsername = null;
        this.hasUsername = false;
        this.privyUser = null;
        
        this.updateUI();
        
        // Trigger wallet disconnected event
        window.dispatchEvent(new CustomEvent('mgidWalletDisconnected'));
    }

    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const connectBtn = document.getElementById('connectWallet');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (this.isAuthenticated && this.mgidWalletAddress) {
            // Show user info
            if (userInfo) {
                const displayName = this.hasUsername ? `@${this.mgidUsername}` : 
                    `${this.mgidWalletAddress.slice(0, 6)}...${this.mgidWalletAddress.slice(-4)}`;
                
                userInfo.innerHTML = `
                    <div class="user-details">
                        <span class="user-name">${displayName}</span>
                        <span class="user-address">${this.mgidWalletAddress.slice(0, 6)}...${this.mgidWalletAddress.slice(-4)}</span>
                        ${this.hasUsername ? '<span class="mgid-badge">🎮 MGID</span>' : '<span class="mgid-pending">⏳ Register Username</span>'}
                    </div>
                `;
                userInfo.style.display = 'block';
            }
            
            // Hide connect button, show logout
            if (connectBtn) connectBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
        } else {
            // Show connect button, hide user info
            if (userInfo) userInfo.style.display = 'none';
            if (connectBtn) connectBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    showUsernameRegistrationPrompt() {
        const notification = document.createElement('div');
        notification.className = 'mgid-username-prompt';
        notification.innerHTML = `
            <div class="mgid-prompt-content">
                <h4>🎯 Complete Your MGID Profile</h4>
                <p>You're connected with your MGID wallet, but need to choose a username to appear on leaderboards!</p>
                <p><strong>Wallet:</strong> ${this.mgidWalletAddress?.slice(0, 6)}...${this.mgidWalletAddress?.slice(-4)}</p>
                <div class="mgid-prompt-buttons">
                    <button onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')" class="mgid-register-btn">
                        🎯 Choose Username
                    </button>
                    <button onclick="window.mgidPrivy.fetchMGIDUsername(); this.parentElement.parentElement.parentElement.remove()" class="mgid-refresh-btn">
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
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #00ff88;
            color: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }

    showError(message) {
        console.error('MGID Error:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mgid-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 1001;
            max-width: 300px;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Public methods for other components
    isConnected() {
        return this.isAuthenticated && this.mgidWalletAddress;
    }

    getWalletAddress() {
        return this.mgidWalletAddress;
    }

    getUsername() {
        return this.mgidUsername;
    }

    hasValidUsername() {
        return this.hasUsername;
    }

    getUserInfo() {
        return {
            address: this.mgidWalletAddress,
            username: this.mgidUsername,
            hasUsername: this.hasUsername,
            displayName: this.hasUsername ? this.mgidUsername : 
                (this.mgidWalletAddress ? `${this.mgidWalletAddress.slice(0, 6)}...${this.mgidWalletAddress.slice(-4)}` : 'Guest')
        };
    }

    async submitScore(gameType, score) {
        try {
            if (!this.isAuthenticated || !this.mgidWalletAddress) {
                throw new Error('Not authenticated with MGID');
            }

            console.log('📊 Submitting score to MGID leaderboard...', {
                gameType,
                score,
                wallet: this.mgidWalletAddress,
                username: this.mgidUsername
            });

            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameType: parseInt(gameType),
                    score: parseInt(score),
                    playerAddress: this.mgidWalletAddress,
                    username: this.mgidUsername || 'Anonymous',
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Score submission failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Score submitted successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Failed to submit score:', error);
            throw error;
        }
    }
}

// Initialize MGID Privy Integration
console.log('🚀 Loading MGID Privy Integration...');
window.mgidPrivy = new MGIDPrivyIntegration();
