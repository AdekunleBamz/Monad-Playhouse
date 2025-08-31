// Hybrid Login System for Monad Playhouse
// Supports both Wallet and Privy authentication

class HybridLogin {
  constructor() {
    this.user = null;
    this.authType = null; // 'wallet' or 'privy'
    this.privy = null;
    this.initialized = false;
    
    this.init();
  }

  async init() {
    try {
      // Initialize Privy SDK
      if (typeof Privy !== 'undefined') {
        this.privy = new Privy({
          appId: 'cmezonnoq008yjv0b4lnrusih',
          config: {
            loginMethodsAndOrder: ['privy:cmd8euall0037le0my79qpz42'],
            appearance: {
              theme: 'dark',
              accentColor: '#6366f1'
            }
          }
        });
        
        // Check if user is already authenticated
        this.privy.onAuthStateChanged((user) => {
          if (user) {
            this.user = user;
            this.authType = 'privy';
            this.updateLoginButtons();
            console.log('Privy user authenticated:', user.id);
          } else {
            this.user = null;
            this.authType = null;
            this.updateLoginButtons();
          }
        });
        
        this.initialized = true;
        console.log('Hybrid login system initialized');
      } else {
        console.warn('Privy SDK not loaded');
        // Hide Privy button gracefully for wallet-only mode
        const privyLoginBtn = document.getElementById('privyLoginBtn');
        if (privyLoginBtn) {
          privyLoginBtn.style.display = 'none';
        }
        // Ensure wallet button stays visible
        const walletLoginBtn = document.getElementById('walletLoginBtn');
        if (walletLoginBtn) {
          walletLoginBtn.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Failed to initialize hybrid login:', error);
    }
  }

  async loginWithWallet() {
    try {
      // Use existing wallet connection
      if (window.monadWallet) {
        const connected = await window.monadWallet.connect();
        if (connected) {
          this.user = {
            id: window.monadWallet.address || window.monadWallet.account,
            address: window.monadWallet.address || window.monadWallet.account,
            type: 'wallet'
          };
          this.authType = 'wallet';
          this.updateLoginButtons();
          console.log('Wallet login successful:', this.user.address);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Wallet login failed:', error);
      return false;
    }
  }

  async loginWithPrivy() {
    try {
      if (!this.privy) {
        console.error('Privy not initialized');
        return false;
      }
      
      await this.privy.login();
      return true;
    } catch (error) {
      console.error('Privy login failed:', error);
      return false;
    }
  }

  async logout() {
    try {
      if (this.authType === 'privy' && this.privy) {
        await this.privy.logout();
      } else if (this.authType === 'wallet' && window.monadWallet) {
        await window.monadWallet.disconnect();
      }
      
      this.user = null;
      this.authType = null;
      this.updateLoginButtons();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  updateLoginButtons() {
    const walletLoginBtn = document.getElementById('walletLoginBtn');
    const privyLoginBtn = document.getElementById('privyLoginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');

    if (this.user) {
      // User is logged in
      if (walletLoginBtn) walletLoginBtn.style.display = 'none';
      if (privyLoginBtn) privyLoginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      
      if (userInfo) {
        const address = this.user && this.user.address ? this.user.address : '';
        const id = this.user && this.user.id ? this.user.id : '';
        const displayName = this.authType === 'wallet' && address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : (id ? `Player_${id.slice(-6)}` : 'Player');
        
        userInfo.innerHTML = `
          <div class="user-info">
            <span class="auth-type">${this.authType.toUpperCase()}</span>
            <span class="user-id">${displayName}</span>
          </div>
        `;
        userInfo.style.display = 'block';
      }
    } else {
      // User is not logged in
      if (walletLoginBtn) walletLoginBtn.style.display = 'block';
      if (privyLoginBtn) privyLoginBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
    }
  }

  async submitScore(score, gameType) {
    try {
      if (!this.user) {
        throw new Error('User not authenticated');
      }

      const payload = {
        score: score,
        gameType: gameType
      };

      // Add authentication info based on auth type
      if (this.authType === 'wallet') {
        payload.playerAddress = this.user.address;
      } else if (this.authType === 'privy') {
        payload.privyId = this.user.id;
      }

      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Score submitted successfully:', result);
      return result;
    } catch (error) {
      console.error('Score submission failed:', error);
      throw error;
    }
  }

  getUserInfo() {
    return {
      user: this.user,
      authType: this.authType,
      isAuthenticated: !!this.user
    };
  }
}

// Initialize hybrid login when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.hybridLogin = new HybridLogin();
  
  // Set up event listeners for login buttons
  const walletLoginBtn = document.getElementById('walletLoginBtn');
  const privyLoginBtn = document.getElementById('privyLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (walletLoginBtn) {
    walletLoginBtn.addEventListener('click', async () => {
      const success = await window.hybridLogin.loginWithWallet();
      if (success) {
        console.log('Wallet login successful');
      } else {
        alert('Wallet login failed. Please make sure MetaMask is installed and connected.');
      }
    });
  }

  if (privyLoginBtn) {
    privyLoginBtn.addEventListener('click', async () => {
      const success = await window.hybridLogin.loginWithPrivy();
      if (!success) {
        alert('Privy login failed. Please try again.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.hybridLogin.logout();
      console.log('Logout successful');
    });
  }
});
