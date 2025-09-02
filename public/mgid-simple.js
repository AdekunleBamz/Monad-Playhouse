// Simple MGID Integration - Direct username input approach
// Avoids wallet connection issues by letting users input their MGID username directly

class MGIDSimpleIntegration {
    constructor() {
        this.isConnected = false;
        this.userInfo = null;
        this.mgidUsername = null;
        this.mgidWallet = null;
        
        this.setupEventListeners();
        console.log('🎮 MGID Simple Integration initialized');
    }

    setupEventListeners() {
        const setupListeners = () => {
            const connectBtn = document.getElementById('connectWallet');
            const logoutBtn = document.getElementById('logoutBtn');
            
            console.log('🔗 Setting up MGID Simple event listeners');
            console.log('connectBtn found:', !!connectBtn);
            console.log('logoutBtn found:', !!logoutBtn);
            
            if (connectBtn) {
                console.log('✅ Adding click listener to connectWallet button');
                connectBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('🎮 Connect button clicked - showing MGID username prompt');
                    this.showMGIDPrompt();
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

    showMGIDPrompt() {
        // Remove any existing popup
        const existingPopup = document.querySelector('.mgid-username-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'mgid-username-popup';
        popup.innerHTML = `
            <div class="mgid-popup-overlay">
                <div class="mgid-popup-content">
                    <h3>🎮 Monad Games ID</h3>
                    <p>Enter your MGID username to compete on the global leaderboard!</p>
                    
                    <div class="mgid-input-section">
                        <label for="mgidUsernameInput">MGID Username:</label>
                        <input type="text" id="mgidUsernameInput" placeholder="Enter your username" maxlength="20">
                        <small>💡 Don't have one? <a href="https://monad-games-id-site.vercel.app/" target="_blank">Register here</a></small>
                    </div>
                    
                    <div class="mgid-popup-buttons">
                        <button class="mgid-connect-btn" onclick="window.mgidIntegration.connectWithUsername()">
                            ✅ Connect
                        </button>
                        <button class="mgid-register-btn" onclick="window.open('https://monad-games-id-site.vercel.app/', '_blank')">
                            🔗 Register New
                        </button>
                        <button class="mgid-cancel-btn" onclick="window.mgidIntegration.closePopup()">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Style the popup
        this.stylePopup(popup);
        document.body.appendChild(popup);

        // Focus on input
        setTimeout(() => {
            const input = document.getElementById('mgidUsernameInput');
            if (input) input.focus();
        }, 100);

        // Handle Enter key
        const input = document.getElementById('mgidUsernameInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.connectWithUsername();
                }
            });
        }
    }

    stylePopup(popup) {
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
            background: rgba(0, 0, 0, 0.9);
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
            max-width: 450px;
            width: 90%;
            text-align: center;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.6);
            color: #fff;
            animation: popupFadeIn 0.3s ease-out;
        `;

        const inputSection = popup.querySelector('.mgid-input-section');
        inputSection.style.cssText = `
            margin: 20px 0;
        `;

        const input = popup.querySelector('#mgidUsernameInput');
        input.style.cssText = `
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: 2px solid #333;
            border-radius: 8px;
            background: #1a1a1a;
            color: #fff;
            font-size: 16px;
            text-align: center;
            transition: border-color 0.3s ease;
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes popupFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            .mgid-username-popup input:focus {
                border-color: #00ff88 !important;
                outline: none;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
            }
            .mgid-username-popup a {
                color: #00ff88;
                text-decoration: none;
            }
            .mgid-username-popup a:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);

        // Style buttons
        const buttons = popup.querySelectorAll('.mgid-popup-buttons button');
        buttons.forEach((btn, index) => {
            const baseStyle = `
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                margin: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                font-size: 14px;
            `;
            
            if (btn.classList.contains('mgid-connect-btn')) {
                btn.style.cssText = baseStyle + `
                    background: #00ff88;
                    color: #000;
                `;
            } else if (btn.classList.contains('mgid-register-btn')) {
                btn.style.cssText = baseStyle + `
                    background: #007acc;
                    color: #fff;
                `;
            } else {
                btn.style.cssText = baseStyle + `
                    background: #ff4444;
                    color: #fff;
                `;
            }
        });
    }

    async connectWithUsername() {
        const input = document.getElementById('mgidUsernameInput');
        const username = input ? input.value.trim() : '';

        if (!username) {
            this.showError('Please enter a username');
            return;
        }

        console.log('🔗 Connecting with MGID username:', username);

        try {
            // Verify username exists in MGID
            const isValid = await this.verifyMGIDUsername(username);
            
            if (isValid) {
                this.mgidUsername = username;
                this.isConnected = true;
                this.userInfo = {
                    username: this.mgidUsername,
                    wallet: this.mgidWallet // Will be null but that's OK for this approach
                };
                
                this.closePopup();
                this.updateUI();
                this.showSuccessMessage(`Welcome ${this.mgidUsername}! Connected to MGID.`);
                console.log('✅ MGID connection successful:', this.userInfo);
            } else {
                this.showError(`Username "${username}" not found on MGID. Please register first.`);
            }
        } catch (error) {
            console.error('❌ MGID verification failed:', error);
            this.showError('Failed to verify MGID username. Please try again.');
        }
    }

    async verifyMGIDUsername(username) {
        try {
            console.log('🔍 Verifying MGID username:', username);
            
            // Try to fetch user info from MGID API
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/users/${username}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ MGID username verified:', data);
                
                // Store wallet address if available
                if (data.walletAddress) {
                    this.mgidWallet = data.walletAddress;
                }
                
                return true;
            } else if (response.status === 404) {
                console.log('⚠️ Username not found');
                return false;
            } else {
                console.log('⚠️ MGID API error:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error verifying MGID username:', error);
            return false;
        }
    }

    closePopup() {
        const popup = document.querySelector('.mgid-username-popup');
        if (popup) {
            popup.remove();
        }
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
        return this.isConnected && this.mgidUsername;
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

            // Submit to backend with MGID username
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameType,
                    score,
                    playerName: this.mgidUsername,
                    playerAddress: this.mgidWallet || null,
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

// Initialize MGID Simple Integration
const initMGIDSimple = () => {
    console.log('🚀 Initializing MGID Simple Integration...');
    window.mgidIntegration = new MGIDSimpleIntegration();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMGIDSimple);
} else {
    initMGIDSimple();
}
