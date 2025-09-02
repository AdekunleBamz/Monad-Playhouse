// Monad Games ID Integration using Privy SDK
// Cross App ID: cmd8euall0037le0my79qpz42

class MGIDPrivyIntegration {
    constructor() {
        this.isConnected = false;
        this.userInfo = null;
        this.mgidUsername = null;
        this.mgidWallet = null;
        this.crossAppId = 'cmd8euall0037le0my79qpz42'; // Monad Games ID Cross App ID
        
        this.initPrivy();
        this.setupEventListeners();
        console.log('🎮 MGID Privy Integration initialized');
    }

    async initPrivy() {
        try {
            // Check if Privy is loaded
            if (typeof window.Privy === 'undefined') {
                console.log('📦 Loading Privy SDK...');
                await this.loadPrivySDK();
            }

            // Initialize Privy with MGID configuration
            this.privy = window.Privy.initialize({
                appId: 'clzmk22w5001t12l5kxvp0hsl', // Your Privy App ID
                config: {
                    loginMethods: ['cross_app'],
                    appearance: {
                        theme: 'dark',
                        accentColor: '#00ff88',
                        logo: 'https://monad-games-id-site.vercel.app/logo.png'
                    },
                    embeddedWallets: {
                        createOnLogin: 'users-without-wallets'
                    }
                }
            });

            console.log('✅ Privy SDK initialized for MGID');

        } catch (error) {
            console.error('❌ Failed to initialize Privy SDK:', error);
        }
    }

    async loadPrivySDK() {
        return new Promise((resolve, reject) => {
            if (window.Privy) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://auth.privy.io/js/privy.js';
            script.onload = () => {
                console.log('✅ Privy SDK loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Privy SDK');
                reject(new Error('Failed to load Privy SDK'));
            };
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        const setupListeners = () => {
            const connectBtn = document.getElementById('connectWallet');
            const logoutBtn = document.getElementById('logoutBtn');
            
            console.log('🔗 Setting up MGID Privy event listeners');
            console.log('connectBtn found:', !!connectBtn);
            console.log('logoutBtn found:', !!logoutBtn);
            
            if (connectBtn) {
                console.log('✅ Adding click listener to connectWallet button');
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🎮 Connect button clicked - starting MGID login');
                    this.loginWithMGID();
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

    async loginWithMGID() {
        try {
            if (!this.privy) {
                throw new Error('Privy SDK not initialized');
            }

            console.log('🔗 Starting MGID login with Privy...');
            
            // Login with Privy (this will show MGID login if configured)
            await this.privy.login();
            
            // Check if user is authenticated
            if (this.privy.authenticated) {
                await this.handleAuthenticatedUser();
            }

        } catch (error) {
            console.error('❌ MGID login failed:', error);
            this.showError('Failed to login with MGID. Please try again.');
        }
    }

    async handleAuthenticatedUser() {
        try {
            const user = this.privy.user;
            console.log('👤 Authenticated user:', user);

            // Find the MGID cross-app account
            const crossAppAccount = user.linkedAccounts.find(
                (account) =>
                    account.type === 'cross_app' &&
                    account.providerApp.id === this.crossAppId
            );

            if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
                this.mgidWallet = crossAppAccount.embeddedWallets[0].address;
                console.log('🎯 MGID wallet found:', this.mgidWallet);

                // Fetch username from MGID API
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
                    this.showError(`Wallet ${this.mgidWallet.slice(0,6)}...${this.mgidWallet.slice(-4)} needs to register a username on MGID!`);
                    this.promptRegister();
                }
            } else {
                console.error('❌ MGID cross-app account not found');
                this.showError('MGID wallet not found. Please ensure you have an MGID account linked.');
            }

        } catch (error) {
            console.error('❌ Failed to handle authenticated user:', error);
            this.showError('Failed to connect to MGID. Please try again.');
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
        const shouldRegister = confirm('No username found for your MGID wallet. Would you like to register one now?');
        if (shouldRegister) {
            window.open('https://monad-games-id-site.vercel.app/', '_blank');
        }
    }

    logout() {
        try {
            if (this.privy) {
                this.privy.logout();
            }
            
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

// Initialize MGID Privy Integration
const initMGIDPrivy = () => {
    console.log('🚀 Initializing MGID Privy Integration...');
    window.mgidIntegration = new MGIDPrivyIntegration();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMGIDPrivy);
} else {
    initMGIDPrivy();
}

