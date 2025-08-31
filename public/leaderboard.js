// Leaderboard Management System
// Supports both wallet and Privy authentication

class LeaderboardManager {
  constructor() {
    this.apiBaseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://monad-playhouse-backend.onrender.com';
    this.currentGameType = null;
  }

  async init() {
    // No-op initializer to satisfy callers
    return true;
  }

  // Show the leaderboard UI and load data for a game type
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
      console.error('Failed to show leaderboard:', err);
      return false;
    }
  }

  async submitScore(score, gameType) {
    try {
      // Check if user is authenticated via hybrid login
      if (!window.hybridLogin || !window.hybridLogin.getUserInfo().isAuthenticated) {
        throw new Error('User not authenticated. Please login first.');
      }

      console.log('Submitting score:', { score, gameType });
      
      // Use hybrid login to submit score
      const result = await window.hybridLogin.submitScore(score, gameType);
      
      console.log('Score submission result:', result);
      
      // Show success message
      this.showNotification('Score Submitted!', 
        `Your score of ${score} has been submitted successfully.`, 'success');
      
      // Refresh leaderboard
      await this.loadLeaderboard(gameType);
      
      return result;
    } catch (error) {
      console.error('Failed to submit score:', error);
      this.showNotification('Submission Failed', 
        error.message || 'Failed to submit score. Please try again.', 'error');
      throw error;
    }
  }

  async loadLeaderboard(gameType) {
    try {
      this.currentGameType = gameType;
      
      const response = await fetch(`${this.apiBaseUrl}/api/leaderboard/${gameType}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const leaderboard = await response.json();
      this.displayLeaderboard(leaderboard, gameType);
      
      return leaderboard;
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.showNotification('Leaderboard Error', 
        'Failed to load leaderboard. Please try again.', 'error');
      throw error;
    }
  }

  displayLeaderboard(leaderboard, gameType) {
    const leaderboardContainer = document.getElementById('leaderboard');
    if (!leaderboardContainer) {
      console.warn('Leaderboard container not found');
      return;
    }

    // Clear existing content
    leaderboardContainer.innerHTML = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'leaderboard-header';
    header.innerHTML = `
      <h2>🏆 Leaderboard - ${this.getGameName(gameType)}</h2>
      <p>Top ${leaderboard.length} Players</p>
    `;
    leaderboardContainer.appendChild(header);

    // Create leaderboard table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Rank</th>
        <th>Player</th>
        <th>Score</th>
        <th>Type</th>
      </tr>
    `;
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    
    if (leaderboard.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="4" class="empty-leaderboard">
          No scores yet. Be the first to play!
        </td>
      `;
      tbody.appendChild(emptyRow);
    } else {
      leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = index < 3 ? `top-${index + 1}` : '';
        
        const playerDisplay = entry.playerId || 'Anonymous';
        const authType = entry.isWalletUser ? 'Wallet' : 'Privy';
        
        row.innerHTML = `
          <td class="rank">${entry.rank}</td>
          <td class="player">${playerDisplay}</td>
          <td class="score">${entry.score.toLocaleString()}</td>
          <td class="auth-type">${authType}</td>
        `;
        
        tbody.appendChild(row);
      });
    }
    
    table.appendChild(tbody);
    leaderboardContainer.appendChild(table);

    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'refresh-btn';
    refreshBtn.innerHTML = '🔄 Refresh';
    refreshBtn.onclick = () => this.loadLeaderboard(gameType);
    leaderboardContainer.appendChild(refreshBtn);
  }

  getGameName(gameType) {
    const gameNames = {
      1: 'Snake',
      2: 'Memory',
      3: 'Math',
      4: 'Color',
      5: 'Tetris',
      6: 'Flappy',
      7: 'Spelling',
      8: 'Car Race',
      9: 'Monad Runner',
      10: 'Crypto Puzzle',
      11: 'Token Collector',
      12: 'Blockchain Tetris'
    };
    return gameNames[gameType] || `Game ${gameType}`;
  }

  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <h4>${title}</h4>
        <p>${message}</p>
      </div>
    `;

    // Add styles
    const bgColor = type === 'success' ? '#4CAF50' : 
                   type === 'error' ? '#f44336' : '#2196F3';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return window.hybridLogin && window.hybridLogin.getUserInfo().isAuthenticated;
  }

  // Get current user info
  getCurrentUser() {
    if (window.hybridLogin) {
      return window.hybridLogin.getUserInfo();
    }
    return null;
  }
}

// Initialize leaderboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.leaderboardManager = new LeaderboardManager();
  
  // Add CSS animations if not already present
  if (!document.getElementById('leaderboard-styles')) {
    const style = document.createElement('style');
    style.id = 'leaderboard-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .leaderboard-header {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .leaderboard-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      .leaderboard-table th,
      .leaderboard-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .leaderboard-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      
      .leaderboard-table tr.top-1 {
        background-color: #fff3cd;
      }
      
      .leaderboard-table tr.top-2 {
        background-color: #f8f9fa;
      }
      
      .leaderboard-table tr.top-3 {
        background-color: #fff5f5;
      }
      
      .rank {
        font-weight: bold;
        width: 60px;
      }
      
      .score {
        font-weight: bold;
        color: #2196F3;
      }
      
      .auth-type {
        font-size: 0.8em;
        color: #666;
      }
      
      .empty-leaderboard {
        text-align: center;
        color: #666;
        font-style: italic;
      }
      
      .refresh-btn {
        background: #2196F3;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .refresh-btn:hover {
        background: #1976D2;
      }
    `;
    document.head.appendChild(style);
  }
});

