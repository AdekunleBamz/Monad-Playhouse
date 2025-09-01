// Monad Games ID Authentication System
// Direct integration with MGID using Privy Global Wallet approach

class MGIDAuth {
    constructor() {
        this.isInitialized = false;
        this.privy = null;
        this.user = null;
        this.mgidWallet = null;
        this.mgidUsername = null;
        this.isAuthenticated = false;
        
        // MGID Configuration
        this.MGID_CROSS_APP_ID = 'cmd8euall0037le0my79qpz42';
        this.PRIVY_APP_ID = 'cmezonnoq008yjv0b4lnrusih'; // Your Privy App ID
        
        this.init();
    }

    async init() {
        try {
            console.log('🎯 Initializing MGID Authentication System...');
            
            // Wait for Privy SDK to load
            await this.waitForPrivy();
            
            if (typeof Privy !== 'undefined') {
                // Initialize Privy with MGID configuration
                this.privy = new Privy({
                    appId: this.PRIVY_APP_ID,
                    config: {
                        // Use loginMethodsAndOrder to prioritize MGID
                        loginMethodsAndOrder: [`privy:${this.MGID_CROSS_APP_ID}`],
                        appearance: {
                            theme: 'dark',
                            accentColor: '#4ECDC4'
                        },
                        // Disable other login methods to focus on MGID
                        embeddedWallets: {
                            createOnLogin: 'users-without-wallets'
                        }
                    }
                });
                
                // Set up authentication state listener
                this.privy.onAuthStateChanged(async (user) => {
                    if (user) {
                        console.log('✅ User authenticated via Privy:', user.id);
                        await this.setupMGIDUser(user);
                        this.updateUI();
                    } else {
                        console.log('❌ User logged out');
                        this.clearUser();
                        this.updateUI();
                    }
                });
                
                console.log('✅ MGID Authentication initialized');
            } else {
                throw new Error('Privy SDK not available');
            }
            
            this.isInitialized = true;
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Failed to initialize MGID Authentication:', error);
            this.showError('Failed to initialize Monad Games ID. Please refresh the page.');
        }
    }

    async waitForPrivy(maxRetries = 15) {
        let retryCount = 0;
        
        while (typeof Privy === 'undefined' && retryCount < maxRetries) {
            console.log(`Waiting for Privy SDK... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
        }
        
        if (typeof Privy === 'undefined') {
            throw new Error('Privy SDK failed to load');
        }
    }

    setupEventListeners() {
        // MGID Login button
        const mgidLoginBtn = document.getElementById('mgidLogin') || document.getElementById('privyLoginBtn');
        if (mgidLoginBtn) {
            mgidLoginBtn.addEventListener('click', () => this.login());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async login() {
        try {
            console.log('🎯 Starting MGID login...');
            
            if (!this.privy) {
                throw new Error('MGID Authentication not initialized');
            }

            // Show loading state
            this.showLoadingState(true);
            
            // Use Privy login which will show MGID option
            await this.privy.login();
            
            console.log('✅ MGID login completed');
            
        } catch (error) {
            console.error('❌ MGID login failed:', error);
            this.showError('Failed to login with Monad Games ID. Please try again.');
        } finally {
            this.showLoadingState(false);
        }
    }

    async logout() {
        try {
            if (this.privy) {
                await this.privy.logout();
            }
            this.clearUser();
            console.log('✅ Logged out successfully');
        } catch (error) {
            console.error('❌ Logout failed:', error);
        }
    }

    async setupMGIDUser(privyUser) {
        try {
            console.log('🔧 Setting up MGID user:', privyUser);

            // Find the MGID cross-app account
            const crossAppAccount = privyUser.linkedAccounts.find(
                account => account.type === 'cross_app' && 
                account.providerApp.id === this.MGID_CROSS_APP_ID
            );

            if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
                this.mgidWallet = crossAppAccount.embeddedWallets[0].address;
                console.log('✅ MGID wallet found:', this.mgidWallet);
                
                // Get username from MGID API
                await this.fetchMGIDUsername();
                
                this.user = {
                    id: privyUser.id,
                    wallet: this.mgidWallet,
                    username: this.mgidUsername,
                    type: 'mgid',
                    hasUsername: !!this.mgidUsername
                };
                
                this.isAuthenticated = true;
                
                // Show username registration prompt if needed
                if (!this.mgidUsername) {
                    this.showUsernameRegistrationPrompt();
                }
                
            } else {
                console.warn('⚠️ No MGID cross-app account found');
                throw new Error('No Monad Games ID account found. Please make sure you signed in with Monad Games ID.');
            }
        } catch (error) {
            console.error('❌ Failed to setup MGID user:', error);
            this.showError(error.message || 'Failed to setup Monad Games ID account');
        }
    }

    async fetchMGIDUsername() {
        try {
            if (!this.mgidWallet) return;

            console.log('🔍 Fetching MGID username for:', this.mgidWallet);
            
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.mgidWallet}`);
            
            if (!response.ok) {
                throw new Error('Failed to check MGID username');
            }
            
            const data = await response.json();

            if (data.hasUsername && data.user) {
                this.mgidUsername = data.user.username;
                console.log('✅ MGID username found:', this.mgidUsername);
            } else {
                console.log('⚠️ No MGID username found - user needs to register');
                this.mgidUsername = null;
            }
        } catch (error) {
            console.error('❌ Failed to fetch MGID username:', error);
            this.mgidUsername = null;
        }
    }

    clearUser() {
        this.user = null;
        this.mgidWallet = null;
        this.mgidUsername = null;
        this.isAuthenticated = false;
    }

    updateUI() {
        const mgidLoginBtn = document.getElementById('mgidLogin') || document.getElementById('privyLoginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');

        if (this.isAuthenticated && this.user) {
            // Update login button to show connected state
            if (mgidLoginBtn) {
                const displayName = this.mgidUsername || `${this.mgidWallet.slice(0, 6)}...${this.mgidWallet.slice(-4)}`;
                mgidLoginBtn.innerHTML = `🎯 ${displayName}`;
                mgidLoginBtn.style.background = 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)';
                mgidLoginBtn.disabled = true;
            }

            // Show logout button
            if (logoutBtn) {
                logoutBtn.style.display = 'inline-block';
            }

            // Show user info
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="mgid-user-info">
                        <span class="mgid-badge">🎯 MGID</span>
                        <span class="mgid-username">${this.mgidUsername || 'No Username'}</span>
                        <span class="mgid-wallet">${this.mgidWallet.slice(0, 6)}...${this.mgidWallet.slice(-4)}</span>
                    </div>
                `;
                userInfo.style.display = 'block';
            }
        } else {
            // Reset to login state
            if (mgidLoginBtn) {
                mgidLoginBtn.innerHTML = '🎯 Sign in with Monad Games ID';
                mgidLoginBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
                mgidLoginBtn.disabled = false;
            }

            // Hide logout button
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }

            // Hide user info
            if (userInfo) {
                userInfo.style.display = 'none';
            }
        }
    }

    showLoadingState(loading) {
        const mgidLoginBtn = document.getElementById('mgidLogin') || document.getElementById('privyLoginBtn');
        if (mgidLoginBtn) {
            if (loading) {
                mgidLoginBtn.innerHTML = '🔄 Connecting...';
                mgidLoginBtn.disabled = true;
            } else {
                this.updateUI();
            }
        }
    }

    showUsernameRegistrationPrompt() {
        const notification = document.createElement('div');
        notification.className = 'mgid-notification';
        notification.innerHTML = `
            <div class="mgid-notification-content">
                <h4>🎯 Complete Your MGID Setup</h4>
                <p>Register a username to appear on the global leaderboard and compete with players from all games!</p>
                <div class="mgid-notification-buttons">
                    <button onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')" class="mgid-register-btn">
                        Register Username
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

    showError(message) {
        console.error('MGID Error:', message);
        
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mgid-error';
        errorDiv.innerHTML = `
            <div class="mgid-error-content">
                <h4>❌ Error</h4>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="mgid-error-close">Close</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }

    // Public API methods
    getUser() {
        return this.user;
    }

    getMGIDWallet() {
        return this.mgidWallet;
    }

    getMGIDUsername() {
        return this.mgidUsername;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    hasUsername() {
        return !!this.mgidUsername;
    }

    // Score submission method
    async submitScore(gameType, score, playerName, gameDuration) {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Please sign in with Monad Games ID first');
            }

            if (!this.mgidWallet) {
                throw new Error('No MGID wallet found');
            }

            const payload = {
                gameType,
                score,
                playerName: this.mgidUsername || playerName || 'Anonymous',
                gameDuration,
                playerAddress: this.mgidWallet,
                mgidUsername: this.mgidUsername
            };

            console.log('🎯 Submitting score via MGID:', payload);

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
            return result;

        } catch (error) {
            console.error('❌ Score submission failed:', error);
            throw error;
        }
    }
}

// Initialize MGID Auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mgidAuth = new MGIDAuth();
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
    
    .mgid-notification-buttons {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }
    
    .mgid-register-btn, .mgid-close-btn, .mgid-error-close {
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
    }
    
    .mgid-register-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-1px);
    }
    
    .mgid-close-btn, .mgid-error-close {
        background: rgba(0,0,0,0.2);
        color: white;
    }
    
    .mgid-close-btn:hover, .mgid-error-close:hover {
        background: rgba(0,0,0,0.3);
    }
    
    .mgid-user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 15px;
        background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
        border-radius: 10px;
        color: white;
        font-size: 14px;
    }
    
    .mgid-badge {
        background: rgba(255,255,255,0.2);
        padding: 4px 8px;
        border-radius: 5px;
        font-weight: bold;
    }
    
    .mgid-username {
        font-weight: bold;
    }
    
    .mgid-wallet {
        font-family: monospace;
        opacity: 0.8;
    }
`;
document.head.appendChild(style);
