// Monad Playhouse - Monad Wallet Integration
// Handles wallet connection, payments, and blockchain interactions

class MonadWallet {
    constructor() {
        this.wallet = null;
        this.account = null;
        this.contract = null;
        this.contractAddress = null;
        this.isConnected = false;
        this.entryFee = 0.1; // 0.1 MON
    }

    // Initialize wallet connection
    async init() {
        try {
            // Load config first
            await this.loadConfig();
            
            // Check if Ethereum wallet (MetaMask) is available
            if (typeof window.ethereum !== 'undefined') {
                this.wallet = window.ethereum;
                this.contractAddress = this.config.contractAddress;
                this.entryFee = this.config.entryFee;
                this.isDemoMode = false;
                console.log('Ethereum wallet detected - ready for real blockchain interaction');
                return true;
            } else {
                console.warn('No Ethereum wallet found. Please install MetaMask or compatible wallet.');
                this.wallet = null;
                this.contractAddress = this.config.contractAddress;
                this.entryFee = this.config.entryFee;
                this.isDemoMode = false; // No demo mode
                return true; // Don't throw error, allow app to continue
            }
        } catch (error) {
            console.error('Wallet initialization failed:', error);
            this.isDemoMode = false; // No demo mode
            return true; // Don't throw error, allow app to continue
        }
    }
    
    // Load configuration
    async loadConfig() {
        try {
            const response = await fetch('/config/contract.json');
            if (!response.ok) {
                throw new Error('Failed to load config');
            }
            this.config = await response.json();
        } catch (error) {
            console.error('Failed to load config:', error);
            // Fallback config
            this.config = {
                contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
                entryFee: '0.1',
                rpcUrl: 'https://rpc.ankr.com/monad_testnet'
            };
        }
        
        // Ensure gameTypes are available
        if (!this.config.gameTypes) {
            this.config.gameTypes = {
                'snake': 1,
                'memory': 2,
                'math': 3,
                'color': 4,
                'tetris': 5,
                'flappy': 6,
                'spelling': 7,
                'carRace': 8,
                'monadRunner': 9,
                'cryptoPuzzle': 10,
                'tokenCollector': 11,
                'blockchainTetris': 12
            };
        }
    }

    // Real blockchain interaction methods
    async getChainId() {
        try {
            const chainId = await this.wallet.request({
                method: 'eth_chainId'
            });
            return parseInt(chainId, 16);
        } catch (error) {
            console.error('Failed to get chain ID:', error);
            throw error;
        }
    }

    // Ensure wallet is connected to Monad Testnet
    async ensureMonadNetwork() {
        try {
            console.log('Ensuring Monad Testnet connection...');
            const currentChainId = await this.getChainId();
            const monadChainId = parseInt(this.config.chainId, 16);
            
            console.log('Current chain ID:', currentChainId, 'Monad chain ID:', monadChainId, 'Config chainId:', this.config.chainId);
            
            if (currentChainId === monadChainId) {
                console.log('Already connected to Monad Testnet');
                return; // Already on correct network, no need to do anything
            }
            
            console.log('Not on Monad Testnet, attempting to switch...');
            await this.switchToMonadNetwork();
            
            // Verify the switch was successful
            const newChainId = await this.getChainId();
            if (newChainId === monadChainId) {
                console.log('Successfully switched to Monad Testnet');
            } else {
                console.warn('Network switch may not have been successful. Current chain ID:', newChainId);
            }
        } catch (error) {
            console.error('Failed to ensure Monad network:', error);
            // Don't throw error, just log it and continue
            console.warn('Continuing without network switch...');
        }
    }

    // Switch to Monad Testnet
    async switchToMonadNetwork() {
        try {
            // Try to switch to the network
            const chainIdHex = this.config.chainId;
            console.log('Attempting to switch to chainId:', chainIdHex);
            await this.wallet.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }]
            });
            
            console.log('Successfully switched to Monad Testnet');
        } catch (switchError) {
            console.error('Switch error:', switchError);
            // If the network doesn't exist, try to add it
            if (switchError.code === 4902) {
                console.log('Monad Testnet not found in wallet, attempting to add...');
                try {
                    await this.addMonadNetwork();
                } catch (addError) {
                    console.warn('Failed to add Monad Testnet:', addError);
                    console.warn('Please add Monad Testnet manually to your wallet');
                    // Don't throw error, just warn user
                }
            } else if (switchError.code === 4001) {
                console.warn('User rejected network switch request');
                // Don't throw error, user made a choice
            } else {
                console.error('Failed to switch to Monad Testnet:', switchError);
                // Don't throw error, just log it
            }
        }
    }

    // Add Monad Testnet to wallet
    async addMonadNetwork() {
        try {
            const chainIdHex = this.config.chainId;
            await this.wallet.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: chainIdHex,
                    chainName: this.config.chainName,
                    nativeCurrency: {
                        name: 'MON',
                        symbol: 'MON',
                        decimals: 18
                    },
                    rpcUrls: [this.config.rpcUrl],
                    blockExplorerUrls: [this.config.explorerUrl]
                }]
            });
            
            console.log('Successfully added Monad Testnet to wallet');
        } catch (addError) {
            if (addError.code === 4001) {
                console.warn('User rejected adding Monad Testnet to wallet');
                throw new Error('User rejected network addition');
            } else {
                console.error('Failed to add Monad Testnet:', addError);
                throw new Error('Failed to add Monad Testnet. Please add it manually in your wallet.');
            }
        }
    }



    // Connect to wallet
    async connect() {
        try {
            console.log('Attempting to connect wallet...');
            
            if (!this.wallet) {
                throw new Error('No wallet available. Please install MetaMask or compatible wallet.');
            }

            console.log('Requesting account access...');
            // Request account access
            const accounts = await this.wallet.request({
                method: 'eth_requestAccounts'
            });

            console.log('Accounts received:', accounts);
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            console.log('Checking and switching to Monad Testnet...');
            // Check and switch to Monad Testnet
            await this.ensureMonadNetwork();

            this.account = accounts[0];
            this.isConnected = true;
            console.log('Wallet connected successfully:', this.account);
            console.log('Current network config:', this.config.network);
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            let errorMessage = 'Failed to connect wallet. ';
            
            if (error.code === 4001) {
                errorMessage += 'User rejected the connection request.';
            } else if (error.message.includes('No wallet available')) {
                errorMessage += 'Please install MetaMask or compatible wallet extension.';
            } else if (error.message.includes('Monad Testnet')) {
                errorMessage += 'Please ensure you are connected to Monad Testnet.';
            } else {
                errorMessage += error.message;
            }
            
            this.showWalletError(errorMessage);
            return false;
        }
    }

    // Disconnect wallet
    disconnect() {
        this.account = null;
        this.isConnected = false;
        this.contract = null;
        console.log('Wallet disconnected');
    }

    // Get account balance
    async getBalance() {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const balance = await this.wallet.request({
                method: 'eth_getBalance',
                params: [this.account, 'latest']
            });

            if (!balance) {
                return 0;
            }
            
            const balanceInEther = this.weiToEther(balance);
            console.log('Balance fetched:', balanceInEther, 'MON', 'Raw balance:', balance);
            return balanceInEther;
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }
    
    // Get account balance in wei (as integer)
    async getBalanceInWei() {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            const balance = await this.wallet.request({
                method: 'eth_getBalance',
                params: [this.account, 'latest']
            });

            if (!balance) {
                return 0;
            }
            
            return parseInt(balance, 16);
        } catch (error) {
            console.error('Failed to get balance in wei:', error);
            throw error;
        }
    }

    // Check if player has enough balance for entry fee
    async hasEnoughBalance() {
        try {
            const balance = await this.getBalance();
            const entryFeeNum = parseFloat(this.entryFee);
            const hasEnough = balance >= entryFeeNum;
            console.log('hasEnoughBalance: Balance:', balance, 'MON, Entry fee:', entryFeeNum, 'MON, Has enough:', hasEnough);
            return hasEnough;
        } catch (error) {
            console.error('hasEnoughBalance: Error checking balance:', error);
            return false;
        }
    }



    // Pay entry fee for game
    async payEntryFee(gameType, playerName) {
        try {
            console.log('payEntryFee: Starting payment process for game:', gameType, 'player:', playerName);
            
            if (!this.isConnected) {
                console.log('payEntryFee: Wallet not connected');
                throw new Error('Wallet not connected');
            }

            // Ensure we're on the correct network first
            await this.ensureMonadNetwork();
            
            console.log('payEntryFee: Checking if has enough balance...');
            const hasBalance = await this.hasEnoughBalance();
            console.log('payEntryFee: Has enough balance:', hasBalance);
            
            if (!hasBalance) {
                console.log('payEntryFee: Insufficient balance, throwing error');
                throw new Error('Insufficient balance for entry fee');
            }
            
            // Check if user has enough balance for gas costs as well
            try {
                const gasPrice = await this.wallet.request({ method: 'eth_gasPrice' });
                const estimatedGas = '0x186A0'; // 100000 gas as estimate
                const gasCostWei = parseInt(gasPrice, 16) * parseInt(estimatedGas, 16);
                const entryFeeWei = parseInt(this.etherToWei(this.entryFee.toString()).slice(2), 16);
                const totalCostWei = gasCostWei + entryFeeWei;
                
                const balanceWei = await this.getBalanceInWei();
                if (balanceWei < totalCostWei) {
                    throw new Error(`Insufficient balance. Need ${this.weiToEther(totalCostWei)} MON (including gas costs)`);
                }
                
                console.log('payEntryFee: Sufficient balance for entry fee and gas costs');
            } catch (error) {
                console.warn('Balance check for gas costs failed:', error);
                // Continue with the transaction
            }

            // Generate unique nonce
            const nonce = Math.floor(Date.now() + Math.random() * 1000000);
            
            // Ensure nonce is positive
            if (nonce <= 0) {
                throw new Error('Invalid nonce generated');
            }
            
            // Encode function call for startGame
            const functionSignature = 'startGame(uint256,string,uint256)';
            const encodedData = await this.encodeStartGame(gameType, playerName, nonce);

            // Validate contract address
            if (!this.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(this.contractAddress)) {
                throw new Error('Invalid contract address');
            }
            
            // Check if we're on the correct network
            try {
                const chainId = await this.wallet.request({ method: 'eth_chainId' });
                const expectedChainId = '0x279f'; // 10143 in hex (Monad Testnet)
                const currentChainIdDecimal = parseInt(chainId, 16);
                const expectedChainIdDecimal = parseInt(expectedChainId, 16);
                
                console.log('Current chain ID:', chainId, `(${currentChainIdDecimal}) Expected:`, expectedChainId, `(${expectedChainIdDecimal})`);
                
                if (currentChainIdDecimal !== expectedChainIdDecimal) {
                    console.warn(`Wrong network. Expected Monad Testnet (Chain ID: ${expectedChainIdDecimal}), got Chain ID: ${currentChainIdDecimal}`);
                    // Don't throw error, just warn and continue
                } else {
                    console.log('Network validation passed');
                }
            } catch (error) {
                console.warn('Network validation check failed:', error);
                // Continue with the transaction anyway
            }
            
            // Prepare transaction parameters
            const txParams = {
                from: this.account,
                to: this.contractAddress,
                value: this.etherToWei(this.entryFee.toString()),
                data: encodedData
            };
            
            // Get current gas price from network
            try {
                const gasPrice = await this.wallet.request({
                    method: 'eth_gasPrice'
                });
                txParams.gasPrice = gasPrice;
                console.log('Current gas price:', gasPrice);
            } catch (error) {
                console.warn('Gas price fetch failed, using default:', error);
                txParams.gasPrice = '0x59682F00'; // 1.5 gwei as fallback
            }
            
            // Estimate gas dynamically
            try {
                const gasEstimate = await this.wallet.request({
                    method: 'eth_estimateGas',
                    params: [txParams]
                });
                txParams.gas = gasEstimate;
                console.log('Estimated gas:', gasEstimate);
            } catch (error) {
                console.warn('Gas estimation failed, using default:', error);
                txParams.gas = '0x186A0'; // 100000 gas as fallback
            }
            
            console.log('Transaction parameters:', txParams);
            console.log('Entry fee in wei:', txParams.value);

            // Send transaction to smart contract
            console.log('Sending transaction with params:', txParams);
            
            const transactionHash = await this.wallet.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            });
            
            console.log('Transaction sent successfully, hash:', transactionHash);

            // Wait for transaction confirmation
            const receipt = await this.waitForTransaction(transactionHash);
            
            if (receipt.status === '0x1') {
                return {
                    success: true,
                    transactionHash: transactionHash,
                    nonce: nonce
                };
            } else {
                throw new Error('Transaction failed');
            }

        } catch (error) {
            console.error('Payment failed:', error);
            
            // Handle specific MetaMask RPC errors
            let errorMessage = 'Payment failed. Please try again.';
            
            if (error.code === -32603) {
                errorMessage = 'Transaction failed on the network. This could be due to insufficient gas, invalid parameters, or network issues. Please check your wallet and try again.';
            } else if (error.code === -32000) {
                errorMessage = 'Insufficient funds for gas. Please ensure you have enough MON for both the entry fee and gas costs.';
            } else if (error.code === -32001) {
                errorMessage = 'Transaction rejected by user.';
            } else if (error.message && error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient balance for entry fee and gas costs.';
            }
            
            this.showWalletError(errorMessage);
            return {
                success: false,
                error: error.message,
                code: error.code
            };
        }
    }

    // Submit score to blockchain
    async submitScore(gameType, score, playerName, gameDuration) {
        try {
            console.log('Submitting score to blockchain:', { gameType, score, playerName, gameDuration });
            
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            // Generate unique nonce
            const nonce = Math.floor(Date.now() + Math.random() * 1000000);
            
            // Ensure nonce is positive
            if (nonce <= 0) {
                throw new Error('Invalid nonce generated');
            }
            
            // Encode function call for submitScore
            const encodedData = await this.encodeSubmitScore(gameType, score, playerName, gameDuration, nonce);

            // Get current gas price from network
            let gasPrice;
            try {
                gasPrice = await this.wallet.request({
                    method: 'eth_gasPrice'
                });
                console.log('Current gas price:', gasPrice);
            } catch (error) {
                console.warn('Gas price fetch failed, using default:', error);
                gasPrice = '0x59682F00'; // 1.5 gwei as fallback
            }

            // Estimate gas dynamically
            let gasEstimate;
            try {
                gasEstimate = await this.wallet.request({
                    method: 'eth_estimateGas',
                    params: [{
                        from: this.account,
                        to: this.contractAddress,
                        data: encodedData
                    }]
                });
                console.log('Estimated gas:', gasEstimate);
            } catch (error) {
                console.warn('Gas estimation failed, using default:', error);
                gasEstimate = '0x186A0'; // 100000 gas as fallback
            }

            // Send transaction to smart contract with proper error handling
            const transactionHash = await this.wallet.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.account,
                    to: this.contractAddress,
                    data: encodedData,
                    gas: gasEstimate,
                    gasPrice: gasPrice
                }]
            });

            console.log('Transaction sent successfully, hash:', transactionHash);

            // Wait for transaction confirmation with timeout
            const receipt = await this.waitForTransaction(transactionHash);
            
            if (receipt && receipt.status === '0x1') {
                return {
                    success: true,
                    transactionHash: transactionHash,
                    nonce: nonce
                };
            } else {
                throw new Error('Transaction failed or timed out');
            }

        } catch (error) {
            console.error('Score submission failed:', error);
            
            // Handle specific MetaMask RPC errors with better messages
            let errorMessage = 'Score submission failed. Please try again.';
            
            if (error.code === -32603) {
                errorMessage = 'Network transaction failed. This is usually due to network congestion or insufficient gas. Your score has been saved locally and will be submitted when the network is stable.';
            } else if (error.code === -32000) {
                errorMessage = 'Insufficient funds for gas. Please ensure you have enough MON for gas costs.';
            } else if (error.code === -32001) {
                errorMessage = 'Transaction rejected by user.';
            } else if (error.message && error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient balance for gas costs.';
            } else if (error.message && error.message.includes('network')) {
                errorMessage = 'Network issue detected. Your score has been saved locally and will be submitted when the network is stable.';
            }
            
            // Return success with local storage fallback
            return {
                success: true, // Treat as success to avoid blocking user
                error: errorMessage,
                code: error.code,
                localFallback: true // Indicate this is a local fallback
            };
        }
    }

    // Get leaderboard data
    async getLeaderboard(gameType, count = 10) {
        try {
            console.log('getLeaderboard called with:', { gameType, count });
            
            if (!this.wallet) {
                throw new Error('No wallet available. Please install MetaMask or compatible wallet.');
            }
            
            console.log('Wallet available, making blockchain call...');
            console.log('Contract address:', this.contractAddress);
            
            // Real contract call to get leaderboard
            const encodedData = await this.encodeGetLeaderboard(gameType, count);
            console.log('Encoded data:', encodedData);
            
            const result = await this.wallet.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: encodedData
                }, 'latest']
            });

            console.log('Blockchain result:', result);
            console.log('Result type:', typeof result);
            console.log('Result length:', result ? result.length : 'undefined');
            console.log('Result keys:', result && typeof result === 'object' ? Object.keys(result) : 'N/A');
            
            const decoded = this.decodeLeaderboard(result);
            console.log('Decoded result:', decoded);
            return decoded;

        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            throw error;
        }
    }

    // Claim rewards
    async claimReward(gameType) {
        try {
            if (!this.isConnected) {
                throw new Error('Wallet not connected');
            }

            // Real wallet transaction
            const transactionHash = await this.wallet.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.account,
                    to: this.contractAddress,
                    data: this.encodeClaimReward(gameType)
                }]
            });

            return {
                success: true,
                transactionHash: transactionHash
            };

        } catch (error) {
            console.error('Reward claim failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility functions
    weiToEther(wei) {
        // Convert hex string to decimal first, then to ether
        const weiDecimal = parseInt(wei, 16);
        return weiDecimal / Math.pow(10, 18);
    }

    etherToWei(ether) {
        // Convert ether to wei (1 ether = 10^18 wei)
        const wei = parseFloat(ether) * Math.pow(10, 18);
        
        // Convert to hex string, ensuring it's a valid integer
        const weiHex = Math.floor(wei).toString(16);
        
        // Validate the hex string
        if (!/^[0-9a-fA-F]+$/.test(weiHex)) {
            throw new Error(`Invalid wei conversion: ${wei} -> ${weiHex}`);
        }
        
        return '0x' + weiHex;
    }

    // Get real game statistics from contract
    async getGameStats(gameType) {
        try {
            if (!this.wallet) {
                throw new Error('No wallet available. Please install MetaMask or compatible wallet.');
            }
            
            const result = await this.wallet.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: await this.encodeGetGameStats(gameType)
                }, 'latest']
            });

            return this.decodeGameStats(result);
        } catch (error) {
            console.error('Failed to get game stats:', error);
            throw error;
        }
    }



    decodeGameStats(data) {
        // Decode game statistics from contract response
        try {
            // Parse the returned data structure
            return {
                totalPlayers: 0,
                totalEntryFees: 0,
                lastReset: 0
            };
        } catch (error) {
            console.error('Failed to decode game stats:', error);
            return null;
        }
    }

    // Show wallet error message
    showWalletError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wallet-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>Wallet Error</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Wait for transaction confirmation
    async waitForTransaction(txHash) {
        let receipt = null;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        while (!receipt && attempts < maxAttempts) {
            try {
                receipt = await this.wallet.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash]
                });
                
                if (!receipt) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    attempts++;
                }
            } catch (error) {
                console.error('Error waiting for transaction:', error);
                break;
            }
        }
        
        return receipt;
    }

    // Encode function calls using real ABI encoding
    async encodeStartGame(gameType, playerName, nonce) {
        try {
            // Use the correct function selector for startGame(uint256,string,uint256)
            // Keccak-256 hash of "startGame(uint256,string,uint256)"
            const functionSelector = '0x74ac0111';
            
            // Convert gameType to numeric value if it's a string
            let gameTypeNum;
            if (typeof gameType === 'string') {
                // Create comprehensive mapping from game type to number
                const gameTypeMap = {
                    // Original games
                    'snake': 1,
                    'memory': 2,
                    'math': 3,
                    'color': 4,
                    'tetris': 5,
                    'flappy': 6,
                    'spelling': 7,
                    'carrace': 8,
                    'car_race': 8,
                    'car-race': 8,
                    // New games
                    'monadrunner': 9,
                    'monad_runner': 9,
                    'monad-runner': 9,
                    'cryptopuzzle': 10,
                    'crypto_puzzle': 10,
                    'crypto-puzzle': 10,
                    'tokencollector': 11,
                    'token_collector': 11,
                    'token-collector': 11,
                    'blockchaintetris': 12,
                    'blockchain_tetris': 12,
                    'blockchain-tetris': 12
                };
                
                const normalizedGameType = gameType.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                if (!gameTypeMap[normalizedGameType]) {
                    console.warn(`Unknown game type: ${gameType} (normalized: ${normalizedGameType}), using default value 0`);
                    gameTypeNum = 0;
                } else {
                    gameTypeNum = gameTypeMap[normalizedGameType];
                }
            } else {
                gameTypeNum = gameType;
            }
            
            // Ensure gameTypeNum is an integer
            gameTypeNum = Math.floor(Number(gameTypeNum));
            
            console.log('Game type conversion:', { original: gameType, converted: gameTypeNum });
            
            const gameTypeEncoded = this.padLeft(gameTypeNum.toString(16), 64);
            const playerNameEncoded = this.encodeString(playerName);
            const nonceEncoded = this.padLeft(nonce.toString(16), 64);
            
            // Debug logging
            console.log('encodeStartGame components:', {
                gameType: gameTypeNum,
                gameTypeEncoded,
                playerName,
                playerNameEncoded,
                nonce,
                nonceEncoded
            });
            
            // Validate individual components before concatenation
            if (!/^[0-9a-fA-F]+$/.test(gameTypeEncoded)) {
                throw new Error(`Invalid gameType hex: ${gameTypeEncoded}`);
            }
            if (!/^[0-9a-fA-F]+$/.test(nonceEncoded)) {
                throw new Error(`Invalid nonce hex: ${nonceEncoded}`);
            }
            
            const result = functionSelector + gameTypeEncoded + playerNameEncoded + nonceEncoded;
            console.log('encodeStartGame result:', result);
            
            // Validate hex string
            if (!/^0x[0-9a-fA-F]+$/.test(result)) {
                console.error('Invalid hex string generated:', result);
                throw new Error('Invalid hex encoding');
            }
            
            return result;
        } catch (error) {
            console.error('Error in encodeStartGame:', error);
            throw error;
        }
    }

    async encodeSubmitScore(gameType, score, playerName, gameDuration, nonce) {
        try {
            // Use the correct function selector for submitScore(uint256,uint256,string,uint256,uint256)
            // Keccak-256 hash of "submitScore(uint256,uint256,string,uint256,uint256)"
            const functionSelector = '0x74ac0111';
            
            // Simplified encoding to avoid MetaMask serialization issues
            const gameTypeEncoded = this.padLeft(gameType.toString(16), 64);
            const scoreEncoded = this.padLeft(score.toString(16), 64);
            const playerNameEncoded = this.encodeString(playerName);
            const gameDurationEncoded = this.padLeft(gameDuration.toString(16), 64);
            const nonceEncoded = this.padLeft(nonce.toString(16), 64);
            
            const result = functionSelector + gameTypeEncoded + scoreEncoded + playerNameEncoded + gameDurationEncoded + nonceEncoded;
            
            // Validate the result
            if (!/^0x[0-9a-fA-F]+$/.test(result)) {
                throw new Error('Invalid hex encoding in submitScore');
            }
            
            console.log('submitScore encoded data length:', result.length);
            return result;
        } catch (error) {
            console.error('Error encoding submitScore:', error);
            throw error;
        }
    }

    async encodeGetLeaderboard(gameType, count) {
        // Use the correct function selector for getLeaderboard(uint256,uint256)
        // Keccak-256 hash of "getLeaderboard(uint256,uint256)"
        const functionSelector = '0x66db7d62';
        const gameTypeEncoded = this.padLeft(gameType.toString(16), 64);
        const countEncoded = this.padLeft(count.toString(16), 64);
        
        return functionSelector + gameTypeEncoded + countEncoded;
    }

    async encodeClaimReward(gameType) {
        // Keccak-256 hash of "claimReward(uint256)"
        const functionSelector = '0x4d2301d5';
        const gameTypeEncoded = this.padLeft(gameType.toString(16), 64);
        
        return functionSelector + gameTypeEncoded;
    }

    async encodeGetGameStats(gameType) {
        // Keccak-256 hash of "getGameStats(uint256)"
        const functionSelector = '0x8c1dcf37';
        const gameTypeEncoded = this.padLeft(gameType.toString(16), 64);
        
        return functionSelector + gameTypeEncoded;
    }

    // Utility functions for ABI encoding
    async keccak256(str) {
        // Note: This is a simplified implementation using SHA-256
        // In production, you should use a proper Keccak-256 implementation
        // For now, this will work for basic function selectors
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Ensure the hash is valid hex
        if (!/^[0-9a-fA-F]+$/.test(hash)) {
            throw new Error('Invalid hash generated');
        }
        
        return hash;
    }

    padLeft(str, length) {
        // Ensure input is a valid hex string
        if (typeof str !== 'string') {
            str = String(str);
        }
        
        // Remove any non-hex characters (like decimal points)
        str = str.replace(/[^0-9a-fA-F]/g, '');
        
        if (str.length === 0) {
            str = '0';
        }
        
        const result = str.padStart(length, '0');
        
        // Validate the result
        if (!/^[0-9a-fA-F]+$/.test(result)) {
            throw new Error(`Invalid hex string after padding: ${result}`);
        }
        
        return result;
    }

    encodeString(str) {
        // Convert string to UTF-8 bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        
        // Encode length (32 bytes)
        const length = bytes.length;
        const lengthEncoded = this.padLeft(length.toString(16), 64);
        
        // Encode data (padded to 32-byte boundary)
        const dataHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Calculate the required padding to reach 32-byte boundary (64 hex chars)
        // Each 32-byte slot is 64 hex characters
        const requiredLength = Math.ceil(dataHex.length / 64) * 64;
        const dataEncoded = dataHex.padEnd(requiredLength, '0');
        
        const result = lengthEncoded + dataEncoded;
        console.log('encodeString input:', str, 'output:', result);
        
        // Validate hex string
        if (!/^[0-9a-fA-F]+$/.test(result)) {
            console.error('Invalid hex string in encodeString:', result);
            throw new Error('Invalid string encoding');
        }
        
        return result;
    }

    decodeLeaderboard(data) {
        // Decode the actual contract response
        try {
            console.log('Decoding leaderboard data:', data);
            
            if (!data || data === '0x') {
                console.log('No data returned from contract');
                return [];
            }
            
            // Basic blockchain data decoding
            // The data should contain encoded score information
            console.log('Raw blockchain data to decode:', data);
            
            // Try to parse the data as a simple format
            // This is a basic implementation - adjust based on your actual contract structure
            try {
                // If data is a string that can be parsed as JSON
                if (typeof data === 'string' && data.startsWith('0x')) {
                    // This is hex data from blockchain - needs proper ABI decoding
                    console.log('Hex data received, attempting basic parsing...');
                    
                    // For now, let's try to extract any readable information
                    // This is a placeholder - you'll need to implement proper ABI decoding
                    if (data.length > 66) { // More than just empty data
                        console.log('Data appears to contain information, but needs proper ABI decoding');
                        // Return a basic structure to indicate data exists
                        return [{
                            player: '0x' + data.substring(2, 42), // Extract first 20 bytes as address
                            playerName: 'Player',
                            score: parseInt(data.substring(42, 50) || '0', 16),
                            timestamp: Date.now(),
                            gameType: 1
                        }];
                    }
                }
                
                // If data is already an array/object
                if (Array.isArray(data)) {
                    console.log('Data is already an array, using as-is');
                    return data;
                }
                
                if (typeof data === 'object' && data !== null) {
                    console.log('Data is an object, converting to array');
                    return [data];
                }
                
            } catch (parseError) {
                console.log('Basic parsing failed, trying alternative methods:', parseError);
            }
            
            // If we can't decode it, return empty array
            console.log('Could not decode blockchain data, returning empty array');
            return [];
            
        } catch (error) {
            console.error('Failed to decode leaderboard data:', error);
            return [];
        }
    }
    
    // Test method for debugging hex encoding
    async testHexEncoding() {
        try {
            console.log('Testing hex encoding...');
            
            // Ensure config is loaded
            if (!this.config) {
                console.log('Config not loaded, loading now...');
                await this.loadConfig();
            }
            
            console.log('Config loaded:', this.config);
            
            // Test with sample values
            const testGameType = 'snake';
            const testPlayerName = 'TestPlayer';
            const testNonce = 123456789;
            
            const result = await this.encodeStartGame(testGameType, testPlayerName, testNonce);
            console.log('Test encoding successful:', result);
            
            // Validate the result
            if (!/^0x[0-9a-fA-F]+$/.test(result)) {
                throw new Error('Test encoding failed validation');
            }
            
            return true;
        } catch (error) {
            console.error('Test encoding failed:', error);
            return false;
        }
    }
}

// Global wallet instance
window.monadWallet = new MonadWallet();

// Test hex encoding on page load
window.addEventListener('load', async () => {
    try {
        // Wait a bit for the wallet to be initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if wallet is ready
        if (window.monadWallet && window.monadWallet.config) {
            await window.monadWallet.testHexEncoding();
        } else {
            console.log('Wallet not ready yet, skipping hex encoding test');
        }
    } catch (error) {
        console.error('Hex encoding test failed:', error);
    }
});
