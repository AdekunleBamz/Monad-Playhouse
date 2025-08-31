// Script to register Monad Playhouse with Monad Games ID
const { ethers } = require('ethers');

// MGID Contract Address
const MGID_CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';

// Game registration details
const GAME_DETAILS = {
    name: 'Monad Playhouse',
    image: 'https://monad-playhouse.vercel.app/favicon.svg',
    url: 'https://monad-playhouse.vercel.app',
    gameAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' // Our contract address
};

// ABI for registerGame function
const REGISTER_GAME_ABI = [
    "function registerGame(address _game, string memory _name, string memory _image, string memory _url) external"
];

async function registerGame() {
    try {
        // Connect to Monad Testnet
        const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
        
        // You'll need to add your private key here
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error('Please set PRIVATE_KEY environment variable');
            return;
        }
        
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(MGID_CONTRACT_ADDRESS, REGISTER_GAME_ABI, wallet);
        
        console.log('Registering game with MGID...');
        console.log('Game Details:', GAME_DETAILS);
        
        const tx = await contract.registerGame(
            GAME_DETAILS.gameAddress,
            GAME_DETAILS.name,
            GAME_DETAILS.image,
            GAME_DETAILS.url
        );
        
        console.log('Transaction hash:', tx.hash);
        await tx.wait();
        console.log('Game registered successfully!');
        
    } catch (error) {
        console.error('Failed to register game:', error);
    }
}

registerGame();

