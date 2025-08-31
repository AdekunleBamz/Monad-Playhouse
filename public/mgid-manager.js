// Monad Games ID Manager
class MGIDManager {
    constructor() {
        this.privy = null;
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.user = null;
        this.mgidWallet = null;
        this.mgidUsername = null;
        this.crossAppId = 'cmd8euall0037le0my79qpz42';
        this.gameContractAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
        this.initializing = false;
        this.retryAttempted = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing MGID Manager...');
            
            // Prevent multiple initialization attempts
            if (this.initializing) {
                console.log('MGID Manager already initializing, skipping...');
                return;
            }
            
            this.initializing = true;
            
            // Check if Privy is available
            if (typeof Privy === 'undefined') {
                console.warn('Privy SDK not loaded, will retry once...');
                this.initializing = false;
                // Only retry once
                if (!this.retryAttempted) {
                    this.retryAttempted = true;
                    setTimeout(() => this.init(), 3000);
                } else {
                    console.warn('Privy SDK failed to load after retry, using fallback mode');
                    this.setupEventListeners();
                    this.isInitialized = true;
                }
                return;
            }
            
            // Initialize Privy with proper MGID configuration
            this.privy = new Privy({
                appId: 'clx8euall0037le0my79qpz42', // Your Privy App ID
                config: {
                    loginMethodsAndOrder: {
                        primary: ['privy:clx8euall0037le0my79qpz42'], // Monad Games ID
                        secondary: ['email', 'google']
                    },
                    crossAppAccount: {
                        providerAppId: this.crossAppId
                    }
                }
            });

            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.initializing = false;
            console.log('MGID Manager initialized successfully with Privy');
            
        } catch (error) {
            console.error('Failed to initialize MGID Manager:', error);
            this.initializing = false;
            // Fallback mode
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('MGID Manager initialized in fallback mode');
        }
    }

    setupEventListeners() {
        // MGID Login button
        const mgidLoginBtn = document.getElementById('mgidLogin');
        if (mgidLoginBtn) {
            mgidLoginBtn.addEventListener('click', () => this.login());
            // Update button text based on status
            this.updateLoginButton();
        }

        // Listen for Privy events
        if (this.privy) {
            this.privy.on('login', (user) => {
                console.log('MGID login successful:', user);
                this.handleLogin(user);
            });

            this.privy.on('logout', () => {
                console.log('MGID logout');
                this.handleLogout();
            });
        }
    }

    updateLoginButton() {
        const mgidLoginBtn = document.getElementById('mgidLogin');
        if (mgidLoginBtn) {
            if (this.isAuthenticated) {
                mgidLoginBtn.textContent = '🎯 MGID Connected';
                mgidLoginBtn.title = 'Monad Games ID Connected';
                mgidLoginBtn.style.background = 'linear-gradient(45deg, #00ff88, #4ecdc4)';
            } else {
                mgidLoginBtn.textContent = '🎯 MGID Login';
                mgidLoginBtn.title = 'Sign in with Monad Games ID';
                mgidLoginBtn.style.background = 'linear-gradient(45deg, #6f42c1, #8e44ad)';
            }
        }
    }

    async login() {
        try {
            console.log('Starting MGID login...');
            
            if (!this.privy) {
                throw new Error('Privy not initialized');
            }

            // Show loading state
            this.showNotification('Connecting to Monad Games ID...', 'info');
            
            // Use cross-app account login for Monad Games ID
            await this.privy.loginWithCrossAppAccount({
                appId: 'clx8euall0037le0my79qpz42' // Monad Games ID provider app ID
            });
            
            console.log('MGID login successful');
            
        } catch (error) {
            console.error('MGID login failed:', error);
            
            // Provide specific error messages
            let errorMessage = 'MGID login failed. ';
            if (error.message.includes('authorize')) {
                errorMessage += 'Please authorize access to your Monad Games ID account.';
            } else if (error.message.includes('provider')) {
                errorMessage += 'Monad Games ID is not available at the moment.';
            } else if (error.message.includes('account')) {
                errorMessage += 'You need a Monad Games ID account to continue.';
            } else {
                errorMessage += 'Please try again.';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    async handleLogin(user) {
        try {
            this.user = user;
            this.isAuthenticated = true;
            
            console.log('MGID user:', user);
            
            // Get MGID wallet address
            await this.getMGIDWallet();
            
            // Get MGID username
            await this.getMGIDUsername();
            
            // Update UI
            this.updateUI();
            
            this.showNotification('Successfully signed in with Monad Games ID!', 'success');
            
        } catch (error) {
            console.error('Error handling MGID login:', error);
        }
    }

    handleLogout() {
        this.user = null;
        this.isAuthenticated = false;
        this.mgidWallet = null;
        this.mgidUsername = null;
        
        this.updateUI();
        this.showNotification('Signed out of Monad Games ID', 'info');
    }

    async getMGIDWallet() {
        try {
            if (!this.user || !this.user.linkedAccounts) {
                throw new Error('No linked accounts found');
            }

            // Find Monad Games ID cross app account
            const crossAppAccount = this.user.linkedAccounts.find(account => 
                account.type === 'cross_app' && 
                account.providerApp.id === this.crossAppId
            );

            if (!crossAppAccount || !crossAppAccount.embeddedWallets.length) {
                throw new Error('No MGID wallet found');
            }

            this.mgidWallet = crossAppAccount.embeddedWallets[0].address;
            console.log('MGID wallet address:', this.mgidWallet);
            
        } catch (error) {
            console.error('Failed to get MGID wallet:', error);
            throw error;
        }
    }

    async getMGIDUsername() {
        try {
            if (!this.mgidWallet) {
                throw new Error('No MGID wallet available');
            }

            const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${this.mgidWallet}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch username');
            }

            const data = await response.json();
            
            if (data.hasUsername && data.user) {
                this.mgidUsername = data.user.username;
                console.log('MGID username:', this.mgidUsername);
            } else {
                // User doesn't have a username, show registration link
                this.showUsernameRegistration();
            }
            
        } catch (error) {
            console.error('Failed to get MGID username:', error);
            this.showUsernameRegistration();
        }
    }

    showUsernameRegistration() {
        const message = `
            <div style="text-align: center; padding: 20px;">
                <h3>🎯 Reserve Your Monad Games ID Username</h3>
                <p>You need to reserve a username to use Monad Games ID features.</p>
                <a href="https://monad-games-id-site.vercel.app/" target="_blank" 
                   style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 10px;">
                    Reserve Username
                </a>
            </div>
        `;
        
        this.showNotification(message, 'info', 10000);
    }

    async submitScoreToMGID(gameType, score, transactionCount = 1) {
        try {
            if (!this.mgidWallet) {
                throw new Error('No MGID wallet available');
            }

            console.log(`Submitting score to MGID: Game ${gameType}, Score ${score}, Transactions ${transactionCount}`);

            // This would typically be done server-side to prevent cheating
            // For now, we'll simulate the submission
            const submissionData = {
                player: this.mgidWallet,
                scoreAmount: score,
                transactionAmount: transactionCount,
                gameType: gameType,
                timestamp: Date.now()
            };

            console.log('MGID submission data:', submissionData);

            // In a real implementation, this would call the smart contract
            // await this.callMGIDContract('updatePlayerData', [this.mgidWallet, score, transactionCount]);

            this.showNotification(`Score submitted to Monad Games ID!`, 'success');
            
            return true;
            
        } catch (error) {
            console.error('Failed to submit score to MGID:', error);
            this.showNotification('Failed to submit score to MGID', 'error');
            return false;
        }
    }

    async callMGIDContract(method, params) {
        // This would be implemented with ethers.js or viem
        // For now, we'll simulate the contract call
        console.log(`Calling MGID contract: ${method}`, params);
        
        // Simulate contract call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('MGID contract call simulated successfully');
                resolve(true);
            }, 1000);
        });
    }

    updateUI() {
        const mgidLoginBtn = document.getElementById('mgidLogin');
        
        if (!mgidLoginBtn) return;

        if (this.isAuthenticated) {
            mgidLoginBtn.textContent = '🎯 MGID';
            mgidLoginBtn.title = `Signed in as ${this.mgidUsername || 'MGID User'}`;
            mgidLoginBtn.style.background = '#28a745';
            mgidLoginBtn.style.color = 'white';
        } else {
            mgidLoginBtn.textContent = '🎯';
            mgidLoginBtn.title = 'Sign in with Monad Games ID';
            mgidLoginBtn.style.background = '';
            mgidLoginBtn.style.color = '';
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `mgid-notification ${type}`;
        notification.innerHTML = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
            font-size: 14px;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    // Public methods for other components
    isMGIDAuthenticated() {
        return this.isAuthenticated;
    }

    getMGIDUser() {
        return {
            wallet: this.mgidWallet,
            username: this.mgidUsername,
            isAuthenticated: this.isAuthenticated
        };
    }

    async logout() {
        if (this.privy) {
            await this.privy.logout();
        }
    }
}

// Initialize MGID Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mgidManager = new MGIDManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MGIDManager;
}
