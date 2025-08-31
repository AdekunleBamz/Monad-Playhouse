// Monad Games ID Manager
class MGIDManager {
    constructor() {
        this.isInitialized = false;
        this.privy = null;
        this.user = null;
        this.mgidWallet = null;
        this.mgidUsername = null;
        this.setupEventListeners();
    }

    async init() {
        try {
            console.log('Initializing MGID Manager...');
            
            // Wait for Privy SDK to load
            let retryCount = 0;
            const maxRetries = 10;
            
            while (typeof Privy === 'undefined' && retryCount < maxRetries) {
                console.log(`Waiting for Privy SDK... (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                retryCount++;
            }
            
            if (typeof Privy !== 'undefined') {
                this.privy = new Privy({
                    appId: 'cmezonnoq008yjv0b4lnrusih',
                    config: {
                        loginMethodsAndOrder: ['privy:cmd8euall0037le0my79qpz42'],
                        appearance: {
                            theme: 'dark',
                            accentColor: '#4ECDC4'
                        }
                    }
                });
                
                await this.privy.init();
                console.log('✅ Privy initialized with Monad Games ID support');
                
                // Check if user is already authenticated
                if (this.privy.authenticated && this.privy.user) {
                    await this.setupMGIDUser();
                }
            } else {
                console.warn('⚠️ Privy SDK not available, MGID integration disabled');
            }
            
            this.isInitialized = true;
            this.updateLoginButton();
            console.log('✅ MGID Manager initialized');
            
        } catch (error) {
            console.error('Failed to initialize MGID Manager:', error);
            this.isInitialized = true;
        }
    }

    setupEventListeners() {
        const mgidLoginBtn = document.getElementById('mgidLogin');
        if (mgidLoginBtn) {
            mgidLoginBtn.addEventListener('click', () => this.login());
        }
    }

    async login() {
        try {
            console.log('Starting MGID login...');
            
            if (!this.privy) {
                throw new Error('Privy not available');
            }

            // Use the standard Privy login which will include Monad Games ID
            await this.privy.login();
            
            if (this.privy.authenticated && this.privy.user) {
                await this.setupMGIDUser();
                this.updateLoginButton();
                console.log('✅ MGID login successful');
            } else {
                throw new Error('MGID login failed');
            }
        } catch (error) {
            console.error('MGID login failed:', error);
            alert('Failed to login with Monad Games ID. Please try again.');
        }
    }

    async setupMGIDUser() {
        try {
            const privyUser = this.privy.user;
            console.log('Setting up MGID user:', privyUser);

            // Get the cross-app account for Monad Games ID
            const crossAppAccount = privyUser.linkedAccounts.find(
                account => account.type === 'cross_app' && 
                account.providerApp.id === 'cmd8euall0037le0my79qpz42'
            );

            if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
                this.mgidWallet = crossAppAccount.embeddedWallets[0].address;
                console.log('MGID wallet found:', this.mgidWallet);
                
                // Get the username from MGID API
                await this.getMGIDUsername();
                
                this.user = {
                    id: privyUser.id,
                    wallet: this.mgidWallet,
                    username: this.mgidUsername,
                    type: 'mgid'
                };
            } else {
                console.warn('No MGID cross-app account found');
                // Still create user object but without MGID wallet
                this.user = {
                    id: privyUser.id,
                    wallet: null,
                    username: null,
                    type: 'privy'
                };
            }
        } catch (error) {
            console.error('Failed to setup MGID user:', error);
        }
    }

    async getMGIDUsername() {
        try {
            if (!this.mgidWallet) return;

            const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.mgidWallet}`);
            const data = await response.json();

            if (data.hasUsername && data.user) {
                this.mgidUsername = data.user.username;
                console.log('MGID username found:', this.mgidUsername);
            } else {
                console.log('No MGID username found, user needs to register');
                this.mgidUsername = null;
            }
        } catch (error) {
            console.error('Failed to get MGID username:', error);
        }
    }

    updateLoginButton() {
        const mgidLoginBtn = document.getElementById('mgidLogin');
        if (!mgidLoginBtn) return;

        if (this.user && this.user.type === 'mgid') {
            const displayName = this.mgidUsername || `${this.mgidWallet.slice(0, 6)}...${this.mgidWallet.slice(-4)}`;
            mgidLoginBtn.innerHTML = `🎯 ${displayName}`;
            mgidLoginBtn.title = `Connected to Monad Games ID as ${displayName}`;
            mgidLoginBtn.style.background = 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)';
        } else if (this.user && this.user.type === 'privy') {
            mgidLoginBtn.innerHTML = '🎯 Privy User';
            mgidLoginBtn.title = 'Connected with Privy (no MGID)';
            mgidLoginBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        } else {
            mgidLoginBtn.innerHTML = '🎯 MGID';
            mgidLoginBtn.title = 'Sign in with Monad Games ID';
            mgidLoginBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
        }
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    getMGIDWallet() {
        return this.mgidWallet;
    }

    getMGIDUsername() {
        return this.mgidUsername;
    }

    async submitScoreToMGID(gameType, score, playerName, gameDuration) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('User not authenticated');
            }

            if (this.user.type !== 'mgid') {
                throw new Error('User not authenticated with Monad Games ID');
            }

            const payload = {
                gameType,
                score,
                playerName,
                gameDuration,
                playerAddress: this.mgidWallet
            };

            console.log('Submitting score to MGID:', payload);

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
            console.log('Score submitted to MGID successfully:', result);
            return result;

        } catch (error) {
            console.error('MGID score submission failed:', error);
            throw error;
        }
    }

    showMGIDRegistrationPrompt() {
        if (!this.mgidWallet) return;

        const notification = document.createElement('div');
        notification.className = 'mgid-notification';
        notification.innerHTML = `
            <div class="mgid-notification-content">
                <h4>🎯 Monad Games ID</h4>
                <p>You don't have a username yet. Register one to appear on the global leaderboard!</p>
                <button onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')" class="mgid-register-btn">
                    Register Username
                </button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 10 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 10000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mgidManager = new MGIDManager();
    window.mgidManager.init();
});
