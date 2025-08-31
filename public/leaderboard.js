// Monad Playhouse - Online Leaderboard System
// Uses API server for instant leaderboard access

class LeaderboardManager {
    constructor() {
        this.currentGameType = null;
        this.leaderboardData = [];
        this.isVisible = false;
        this.refreshInterval = null;
        // Use production backend URL when not on localhost
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api' 
            : 'https://monad-playhouse-leaderboard.onrender.com/api';
    }

    // Initialize leaderboard system
    async init() {
        try {
            console.log('Initializing online leaderboard manager...');
            this.createLeaderboardUI();
            this.setupEventListeners();
            await this.loadLeaderboard(1); // Load Snake game by default
            console.log('Online leaderboard manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize leaderboard manager:', error);
            this.createLeaderboardUI();
            this.setupEventListeners();
        }
    }

    // Create leaderboard UI elements
    createLeaderboardUI() {
        // Create leaderboard modal
        const leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboardModal';
        leaderboardModal.className = 'leaderboard-modal';
        leaderboardModal.innerHTML = `
            <div class="leaderboard-content">
                <div class="leaderboard-header">
                    <h2>🏆 Global Leaderboard</h2>
                    <button id="closeLeaderboard" class="close-btn">×</button>
                </div>
                
                <div class="game-selector">
                    <select id="gameTypeSelect">
                        <option value="1">🐍 Snake</option>
                        <option value="2">🧠 Memory</option>
                        <option value="3">🔢 Math</option>
                        <option value="4">🎨 Color</option>
                        <option value="5">🧩 Tetris</option>
                        <option value="6">🐦 Flappy Bird</option>
                        <option value="7">📝 Spelling Bee</option>
                        <option value="8">🏎️ Car Race</option>
                        <option value="9">🏃 Monad Runner</option>
                        <option value="10">🧩 Crypto Puzzle</option>
                        <option value="11">🪙 Token Collector</option>
                        <option value="12">🔗 Blockchain Tetris</option>
                    </select>
                    <button id="refreshLeaderboard" class="refresh-btn">🔄</button>
                </div>

                <div class="leaderboard-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Players:</span>
                        <span id="totalPlayers" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Top Score:</span>
                        <span id="topScore" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Your Rank:</span>
                        <span id="playerRank" class="stat-value">-</span>
                    </div>
                </div>

                <div class="leaderboard-list" id="leaderboardList">
                    <div class="loading">Loading leaderboard...</div>
                </div>

                <div class="leaderboard-actions">
                    <button id="claimReward" class="claim-btn" disabled>Claim Reward</button>
                    <button id="viewRewards" class="view-btn">View Rewards</button>
                </div>
            </div>
        `;

        document.body.appendChild(leaderboardModal);

        // Add leaderboard button to header controls
        const headerControls = document.querySelector('.header-controls');
        console.log('Header controls found:', headerControls);
        
        const leaderboardBtn = document.createElement('button');
        leaderboardBtn.id = 'showLeaderboard';
        leaderboardBtn.className = 'control-btn';
        leaderboardBtn.innerHTML = '🏆';
        leaderboardBtn.title = 'View Leaderboard';

        // Ensure header controls exist before adding button
        if (headerControls) {
            headerControls.appendChild(leaderboardBtn);
            console.log('Leaderboard button added to header controls');
        } else {
            console.warn('Header controls not found, will retry later');
            // Retry after a short delay
            setTimeout(() => {
                const retryHeaderControls = document.querySelector('.header-controls');
                if (retryHeaderControls) {
                    retryHeaderControls.appendChild(leaderboardBtn);
                    console.log('Leaderboard button added to header controls on retry');
                } else {
                    console.error('Header controls still not found after retry');
                }
            }, 1000);
        }

        // Add CSS styles
        this.addLeaderboardStyles();
    }

    // Load leaderboard data from API
    async loadLeaderboard(gameType) {
        this.currentGameType = gameType;
        const listElement = document.getElementById('leaderboardList');
        
        // Show loading
        listElement.innerHTML = '<div class="loading">Loading leaderboard...</div>';
        
        try {
            console.log('Loading leaderboard for game type:', gameType);
            
            // Fetch from API
            const response = await fetch(`${this.apiBaseUrl}/leaderboard/${gameType}?limit=20`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Leaderboard data received:', data);
            
            this.leaderboardData = data.scores;
            
            // Update stats
            this.updateStats(data);
            
            // Render leaderboard
            this.renderLeaderboard(data.scores);
            
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            listElement.innerHTML = '<div class="error">Failed to load leaderboard. Please try again.</div>';
        }
    }

    // Submit score to API
    async submitScore(gameType, score, playerName, gameDuration) {
        console.log('submitScore called with:', { gameType, score, playerName, gameDuration });
        console.log('API Base URL:', this.apiBaseUrl);
        
        try {
            // First, submit to MGID if available
            if (window.mgidManager && window.mgidManager.isAuthenticated) {
                console.log('Submitting to MGID...');
                await window.mgidManager.submitScoreToMGID(gameType, score, 1);
            }
            
            // Get player address from wallet
            const playerAddress = window.monadWallet?.account || 'unknown';
            
            const scoreData = {
                gameType,
                score,
                playerName,
                gameDuration,
                playerAddress
            };
            
            console.log('Submitting score data:', scoreData);
            
            // Submit to API
            const response = await fetch(`${this.apiBaseUrl}/submit-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scoreData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('API response:', result);
            
            if (result.success) {
                console.log('Score submitted successfully:', result);
                this.showNotification('Score Submitted!', `Your score of ${score} has been submitted! Rank: #${result.rank}`);
                
                // Refresh leaderboard to show new score
                await this.loadLeaderboard(gameType);
                
                return true;
            } else {
                console.error('Score submission failed:', result.error);
                this.showNotification('Submission Failed', result.error);
                return false;
            }
            
        } catch (error) {
            console.error('Score submission error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                apiUrl: this.apiBaseUrl
            });
            this.showNotification('Error', `Failed to submit score: ${error.message}`);
            return false;
        }
    }

    // Update statistics
    updateStats(data) {
        // Update total players
        document.getElementById('totalPlayers').textContent = data.totalPlayers || 0;
        
        // Update top score
        const topScore = data.scores && data.scores.length > 0 ? data.scores[0].score : 0;
        document.getElementById('topScore').textContent = topScore.toLocaleString();
        
        // Find player rank
        const playerAddress = window.monadWallet?.account;
        let playerRank = -1;
        
        if (playerAddress && data.scores) {
            const playerScore = data.scores.find(s => s.playerAddress === playerAddress);
            if (playerScore) {
                playerRank = data.scores.indexOf(playerScore) + 1;
            }
        }
        
        document.getElementById('playerRank').textContent = playerRank > 0 ? `#${playerRank}` : '-';
        
        // Enable/disable claim button (top 3 can claim)
        const claimBtn = document.getElementById('claimReward');
        claimBtn.disabled = playerRank < 0 || playerRank > 3;
    }

    // Render leaderboard data
    renderLeaderboard(scores) {
        const listElement = document.getElementById('leaderboardList');
        
        if (!scores || scores.length === 0) {
            listElement.innerHTML = '<div class="no-data">No scores yet. Be the first to play!</div>';
            return;
        }
        
        const leaderboardHTML = scores.map((entry, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const isCurrentPlayer = entry.playerAddress === window.monadWallet?.account;
            
            return `
                <div class="leaderboard-entry ${rankClass} ${isCurrentPlayer ? 'current-player' : ''}">
                    <div class="rank">${rank}</div>
                    <div class="player-info">
                        <div class="player-name">
                            ${entry.playerName || 'Anonymous'}
                            ${isCurrentPlayer ? '<span class="you-indicator">(You)</span>' : ''}
                        </div>
                        <div class="player-address">${entry.playerAddress ? `${entry.playerAddress.slice(0, 6)}...${entry.playerAddress.slice(-4)}` : 'Unknown'}</div>
                    </div>
                    <div class="score">${entry.score.toLocaleString()}</div>
                    <div class="timestamp">${this.formatTimestamp(entry.timestamp)}</div>
                </div>
            `;
        }).join('');
        
        listElement.innerHTML = leaderboardHTML;
    }

    // Format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Show notification
    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'leaderboard-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 5000);
    }

    // Setup event listeners
    setupEventListeners() {
        // Show leaderboard button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'showLeaderboard') {
                this.show();
            }
        });

        // Close leaderboard
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeLeaderboard') {
                this.hide();
            }
        });

        // Game type selector
        document.addEventListener('change', (e) => {
            if (e.target.id === 'gameTypeSelect') {
                this.loadLeaderboard(parseInt(e.target.value));
            }
        });

        // Refresh button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshLeaderboard') {
                this.loadLeaderboard(this.currentGameType);
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'leaderboardModal') {
                this.hide();
            }
        });
    }

    // Show leaderboard
    show() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) {
            modal.style.display = 'flex';
            this.isVisible = true;
        }
    }

    // Hide leaderboard
    hide() {
        const modal = document.getElementById('leaderboardModal');
        if (modal) {
            modal.style.display = 'none';
            this.isVisible = false;
        }
    }

    // Add leaderboard styles
    addLeaderboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .leaderboard-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }

            .leaderboard-content {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #4ecdc4;
                border-radius: 15px;
                padding: 20px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                color: white;
                font-family: 'Orbitron', monospace;
            }

            .leaderboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #4ecdc4;
                padding-bottom: 10px;
            }

            .leaderboard-header h2 {
                margin: 0;
                color: #4ecdc4;
                font-size: 24px;
            }

            .close-btn {
                background: none;
                border: none;
                color: #4ecdc4;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
            }

            .game-selector {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }

            .game-selector select {
                background: #16213e;
                color: white;
                border: 1px solid #4ecdc4;
                border-radius: 5px;
                padding: 8px;
                font-family: 'Orbitron', monospace;
            }

            .refresh-btn {
                background: #4ecdc4;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 8px 12px;
                cursor: pointer;
                font-size: 16px;
            }

            .leaderboard-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(78, 205, 196, 0.1);
                border-radius: 10px;
            }

            .stat-item {
                text-align: center;
            }

            .stat-label {
                display: block;
                font-size: 12px;
                color: #4ecdc4;
                margin-bottom: 5px;
            }

            .stat-value {
                display: block;
                font-size: 18px;
                font-weight: bold;
                color: white;
            }

            .leaderboard-list {
                margin-bottom: 20px;
            }

            .leaderboard-entry {
                display: grid;
                grid-template-columns: 60px 1fr 100px 100px;
                gap: 15px;
                padding: 12px;
                margin-bottom: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border-left: 4px solid #4ecdc4;
                transition: all 0.3s ease;
            }

            .leaderboard-entry:hover {
                background: rgba(78, 205, 196, 0.1);
                transform: translateX(5px);
            }

            .leaderboard-entry.current-player {
                background: rgba(78, 205, 196, 0.2);
                border-left-color: #6dd5ed;
            }

            .rank-1 {
                background: linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
                border-left-color: #ffd700;
            }

            .rank-2 {
                background: linear-gradient(45deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
                border-left-color: #c0c0c0;
            }

            .rank-3 {
                background: linear-gradient(45deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
                border-left-color: #cd7f32;
            }

            .rank {
                font-size: 18px;
                font-weight: bold;
                color: #4ecdc4;
                text-align: center;
                line-height: 40px;
            }

            .player-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .player-name {
                font-size: 14px;
                font-weight: bold;
                color: white;
                margin-bottom: 2px;
            }

            .player-address {
                font-size: 11px;
                color: #888;
            }

            .you-indicator {
                color: #4ecdc4;
                font-size: 12px;
            }

            .score {
                font-size: 16px;
                font-weight: bold;
                color: #4ecdc4;
                text-align: center;
                line-height: 40px;
            }

            .timestamp {
                font-size: 11px;
                color: #888;
                text-align: center;
                line-height: 40px;
            }

            .leaderboard-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }

            .claim-btn, .view-btn {
                background: linear-gradient(45deg, #4ecdc4, #6dd5ed);
                color: white;
                border: none;
                border-radius: 5px;
                padding: 10px 20px;
                cursor: pointer;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .claim-btn:hover, .view-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
            }

            .claim-btn:disabled {
                background: #666;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .loading, .error, .no-data {
                text-align: center;
                padding: 40px;
                color: #4ecdc4;
                font-size: 16px;
            }
            
            .error {
                color: #ff6b6b;
            }

            .no-data {
                color: #888;
            }
        `;
        document.head.appendChild(style);
    }
}

// Global leaderboard instance
window.leaderboardManager = new LeaderboardManager();

