// MGID-focused Leaderboard Management System
// Works with Monad Games ID global leaderboard

class MGIDLeaderboard {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001' 
            : 'https://monad-playhouse-leaderboard.onrender.com';
        this.currentGameType = null;
        this.mgidGlobalUrl = 'https://monad-games-id-site.vercel.app/leaderboard';
    }

    async init() {
        console.log('🎯 Initializing MGID Leaderboard System');
        return true;
    }

    // Show leaderboard with both local and global options
    async show(gameType) {
        try {
            const container = document.getElementById('leaderboard');
            if (container) {
                container.style.display = 'block';
            }
            
            const type = gameType || this.currentGameType || 1;
            await this.loadLeaderboard(type);
            
            // Smooth scroll into view
            if (container && container.scrollIntoView) {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return true;
        } catch (err) {
            console.error('❌ Failed to show leaderboard:', err);
            return false;
        }
    }

    async loadLeaderboard(gameType) {
        try {
            this.currentGameType = gameType;
            
            console.log(`🎯 Loading MGID leaderboard for game type ${gameType}`);
            
            // Load both game-specific and global leaderboards
            const [gameLeaderboard, globalLeaderboard] = await Promise.allSettled([
                this.loadGameLeaderboard(gameType),
                this.loadGlobalLeaderboard()
            ]);

            const gameData = gameLeaderboard.status === 'fulfilled' ? gameLeaderboard.value : null;
            const globalData = globalLeaderboard.status === 'fulfilled' ? globalLeaderboard.value : null;

            this.displayMGIDLeaderboard(gameData, globalData, gameType);
            
            return { game: gameData, global: globalData };
        } catch (error) {
            console.error('❌ Failed to load MGID leaderboard:', error);
            this.showNotification('Leaderboard Error', 
                'Failed to load leaderboard. Please try again.', 'error');
            throw error;
        }
    }

    async loadGameLeaderboard(gameType) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/leaderboard/${gameType}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load game leaderboard:', error);
            return null;
        }
    }

    async loadGlobalLeaderboard() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/leaderboard/global?limit=10`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load global leaderboard:', error);
            return null;
        }
    }

    displayMGIDLeaderboard(gameData, globalData, gameType) {
        const leaderboardContainer = document.getElementById('leaderboard');
        if (!leaderboardContainer) {
            console.warn('⚠️ Leaderboard container not found');
            return;
        }

        // Clear existing content
        leaderboardContainer.innerHTML = '';

        // Create main header
        const mainHeader = document.createElement('div');
        mainHeader.className = 'mgid-leaderboard-header';
        mainHeader.innerHTML = `
            <h2>🎯 Monad Games ID Leaderboard</h2>
            <p>Global cross-game competition powered by MGID</p>
            <div class="leaderboard-tabs">
                <button class="tab-btn active" data-tab="game">🎮 ${this.getGameName(gameType)}</button>
                <button class="tab-btn" data-tab="global">🌍 Global Rankings</button>
                <button class="tab-btn" data-tab="mgid-global">🎯 MGID Official</button>
            </div>
        `;
        leaderboardContainer.appendChild(mainHeader);

        // Create tab content container
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        leaderboardContainer.appendChild(tabContent);

        // Game-specific leaderboard tab
        const gameTab = document.createElement('div');
        gameTab.className = 'tab-panel active';
        gameTab.id = 'game-tab';
        
        if (gameData && gameData.leaderboard && gameData.leaderboard.length > 0) {
            gameTab.appendChild(this.createLeaderboardTable(gameData.leaderboard, 'game'));
        } else {
            gameTab.innerHTML = `
                <div class="empty-leaderboard">
                    <h3>🎮 ${this.getGameName(gameType)} Leaderboard</h3>
                    <p>No scores yet for this game. Be the first to play!</p>
                    <p class="mgid-hint">🎯 Sign in with Monad Games ID to submit scores</p>
                </div>
            `;
        }
        tabContent.appendChild(gameTab);

        // Global leaderboard tab
        const globalTab = document.createElement('div');
        globalTab.className = 'tab-panel';
        globalTab.id = 'global-tab';
        
        if (globalData && globalData.leaderboard && globalData.leaderboard.length > 0) {
            globalTab.appendChild(this.createLeaderboardTable(globalData.leaderboard, 'global'));
        } else {
            globalTab.innerHTML = `
                <div class="empty-leaderboard">
                    <h3>🌍 Global Rankings</h3>
                    <p>No global scores available yet.</p>
                    <p class="mgid-hint">🎯 Play games with MGID to appear here</p>
                </div>
            `;
        }
        tabContent.appendChild(globalTab);

        // MGID Official leaderboard tab
        const mgidTab = document.createElement('div');
        mgidTab.className = 'tab-panel';
        mgidTab.id = 'mgid-global-tab';
        mgidTab.innerHTML = `
            <div class="mgid-official">
                <h3>🎯 Official MGID Global Leaderboard</h3>
                <p>View the complete cross-game leaderboard with all MGID games</p>
                <button onclick="window.open('${this.mgidGlobalUrl}', '_blank')" class="mgid-view-btn">
                    🎯 View MGID Global Leaderboard
                </button>
                <div class="mgid-info">
                    <h4>About MGID Global Leaderboard:</h4>
                    <ul>
                        <li>🌍 Combines scores from ALL games using Monad Games ID</li>
                        <li>🏆 Real-time rankings across the entire ecosystem</li>
                        <li>🎮 Your username appears consistently across all games</li>
                        <li>⚡ Powered by Monad blockchain technology</li>
                    </ul>
                </div>
            </div>
        `;
        tabContent.appendChild(mgidTab);

        // Add tab switching functionality
        this.setupTabSwitching();

        // Add refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'refresh-btn';
        refreshBtn.innerHTML = '🔄 Refresh Leaderboards';
        refreshBtn.onclick = () => this.loadLeaderboard(gameType);
        leaderboardContainer.appendChild(refreshBtn);

        // Add authentication prompt if not logged in
        if (!window.mgidAuth || !window.mgidAuth.isUserAuthenticated()) {
            this.addAuthenticationPrompt(leaderboardContainer);
        }
    }

    createLeaderboardTable(leaderboard, type) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'leaderboard-table-container';

        const table = document.createElement('table');
        table.className = 'mgid-leaderboard-table';
        
        // Table header
        const thead = document.createElement('thead');
        const headerColumns = type === 'global' 
            ? ['Rank', 'Player', 'Total Score', 'Games Played', 'Last Played']
            : ['Rank', 'Player', 'Score', 'Duration', 'Date'];
            
        thead.innerHTML = `
            <tr>
                ${headerColumns.map(col => `<th>${col}</th>`).join('')}
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = index < 3 ? `top-${index + 1}` : '';
            
            let rowContent;
            if (type === 'global') {
                const lastPlayed = entry.lastPlayed ? new Date(entry.lastPlayed).toLocaleDateString() : 'N/A';
                rowContent = `
                    <td class="rank">${entry.rank || index + 1}</td>
                    <td class="player">
                        <div class="player-info">
                            <span class="mgid-badge">🎯</span>
                            <span class="player-name">${entry.playerName || 'Anonymous'}</span>
                        </div>
                    </td>
                    <td class="score">${entry.totalScore?.toLocaleString() || '0'}</td>
                    <td class="games-played">${entry.gamesPlayed || 0}</td>
                    <td class="last-played">${lastPlayed}</td>
                `;
            } else {
                const playDate = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A';
                const duration = entry.gameDuration ? `${entry.gameDuration}s` : 'N/A';
                rowContent = `
                    <td class="rank">${entry.rank || index + 1}</td>
                    <td class="player">
                        <div class="player-info">
                            <span class="mgid-badge">🎯</span>
                            <span class="player-name">${entry.playerName || 'Anonymous'}</span>
                        </div>
                    </td>
                    <td class="score">${entry.score?.toLocaleString() || '0'}</td>
                    <td class="duration">${duration}</td>
                    <td class="play-date">${playDate}</td>
                `;
            }
            
            row.innerHTML = rowContent;
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        return tableContainer;
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                button.classList.add('active');
                const targetPanel = document.getElementById(`${targetTab}-tab`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    addAuthenticationPrompt(container) {
        const authPrompt = document.createElement('div');
        authPrompt.className = 'mgid-auth-prompt';
        authPrompt.innerHTML = `
            <div class="auth-prompt-content">
                <h4>🎯 Join the Global Competition!</h4>
                <p>Sign in with Monad Games ID to:</p>
                <ul>
                    <li>📊 Submit scores to global leaderboards</li>
                    <li>🏆 Compete across all MGID games</li>
                    <li>👤 Reserve your unique username</li>
                    <li>🌍 See your rank worldwide</li>
                </ul>
                <button onclick="window.mgidAuth && window.mgidAuth.login()" class="mgid-auth-btn">
                    🎯 Sign in with Monad Games ID
                </button>
            </div>
        `;
        container.appendChild(authPrompt);
    }

    getGameName(gameType) {
        const gameNames = {
            1: 'Snake', 2: 'Memory', 3: 'Math', 4: 'Color',
            5: 'Tetris', 6: 'Flappy', 7: 'Spelling', 8: 'Car Race',
            9: 'Monad Runner', 10: 'Crypto Puzzle', 11: 'Token Collector', 12: 'Blockchain Tetris'
        };
        return gameNames[gameType] || `Game ${gameType}`;
    }

    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `mgid-notification mgid-notification-${type}`;
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
            z-index: 10000;
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

    // Public API methods for compatibility
    isUserAuthenticated() {
        return window.mgidAuth && window.mgidAuth.isUserAuthenticated();
    }

    getCurrentUser() {
        return window.mgidAuth ? window.mgidAuth.getUser() : null;
    }

    async submitScore(gameType, score, playerName, gameDuration) {
        if (!window.mgidAuth || !window.mgidAuth.isUserAuthenticated()) {
            throw new Error('Please sign in with Monad Games ID to submit scores');
        }

        return await window.mgidAuth.submitScore(gameType, score, playerName, gameDuration);
    }
}

// Initialize MGID leaderboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new MGIDLeaderboard();
    
    // Add MGID-specific styles
    if (!document.getElementById('mgid-leaderboard-styles')) {
        const style = document.createElement('style');
        style.id = 'mgid-leaderboard-styles';
        style.textContent = `
            .mgid-leaderboard-header {
                text-align: center;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
                color: white;
                padding: 20px;
                border-radius: 15px;
            }
            
            .leaderboard-tabs {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 15px;
            }
            
            .tab-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .tab-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }
            
            .tab-btn.active {
                background: rgba(255,255,255,0.4);
                font-weight: bold;
            }
            
            .tab-content {
                margin: 20px 0;
            }
            
            .tab-panel {
                display: none;
                animation: fadeIn 0.3s ease-in;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            .mgid-leaderboard-table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .mgid-leaderboard-table th,
            .mgid-leaderboard-table td {
                padding: 15px;
                text-align: left;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .mgid-leaderboard-table th {
                background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
                color: white;
                font-weight: bold;
            }
            
            .mgid-leaderboard-table tr.top-1 {
                background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                color: white;
                font-weight: bold;
            }
            
            .mgid-leaderboard-table tr.top-2 {
                background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
                color: white;
            }
            
            .mgid-leaderboard-table tr.top-3 {
                background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
                color: white;
            }
            
            .player-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .mgid-badge {
                background: rgba(78, 205, 196, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .player-name {
                font-weight: 500;
            }
            
            .score {
                font-weight: bold;
                color: #4ECDC4;
            }
            
            .empty-leaderboard {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .mgid-hint {
                color: #4ECDC4;
                font-weight: 500;
                margin-top: 10px;
            }
            
            .mgid-official {
                text-align: center;
                padding: 40px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            
            .mgid-view-btn {
                background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin: 20px 0;
                transition: all 0.3s ease;
            }
            
            .mgid-view-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
            }
            
            .mgid-info {
                text-align: left;
                max-width: 400px;
                margin: 0 auto;
            }
            
            .mgid-info ul {
                list-style: none;
                padding: 0;
            }
            
            .mgid-info li {
                padding: 8px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .mgid-auth-prompt {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 25px;
                border-radius: 15px;
                margin: 20px 0;
                text-align: center;
            }
            
            .mgid-auth-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid rgba(255,255,255,0.3);
                padding: 12px 25px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 15px;
                transition: all 0.3s ease;
            }
            
            .mgid-auth-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }
            
            .refresh-btn {
                background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                margin: 20px auto;
                display: block;
                transition: all 0.3s ease;
            }
            
            .refresh-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});
