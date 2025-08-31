// Server-side MGID score submission to prevent hacking
const { ethers } = require('ethers');

// MGID Contract details
const MGID_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const MGID_CONTRACT_ABI = [
    "function updatePlayerData(address player, uint256 scoreAmount, uint256 transactionAmount) external"
];

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const privateKey = process.env.MGID_PRIVATE_KEY; // Server private key
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(MGID_CONTRACT_ADDRESS, MGID_CONTRACT_ABI, wallet);

async function submitScoreToMGID(playerAddress, scoreAmount, transactionAmount) {
    try {
        console.log('Submitting score to MGID contract:', {
            player: playerAddress,
            score: scoreAmount,
            transactions: transactionAmount
        });

        // Call the updatePlayerData function
        const tx = await contract.updatePlayerData(
            playerAddress,
            scoreAmount,
            transactionAmount
        );

        console.log('MGID transaction hash:', tx.hash);
        await tx.wait();
        console.log('Score submitted to MGID successfully');

        return {
            success: true,
            transactionHash: tx.hash
        };

    } catch (error) {
        console.error('Failed to submit score to MGID:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { submitScoreToMGID };

