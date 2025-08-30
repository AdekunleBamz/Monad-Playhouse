#!/usr/bin/env node

/**
 * Monad Playhouse - Fixes Verification Script
 * Verifies that all fixes have been applied correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Monad Playhouse - Fixes Verification\n');

// Check if files exist and have expected content
const checks = [
    {
        file: 'public/leaderboard.js',
        check: (content) => {
            return content.includes('setTimeout(() => {') && 
                   content.includes('retryHeaderControls') &&
                   content.includes('LeaderboardManager');
        },
        description: 'Leaderboard button creation fix'
    },
    {
        file: 'public/wallet.js',
        check: (content) => {
            return content.includes('0x74ac0111') && 
                   content.includes('0x66db7d62') &&
                   content.includes('0x4d2301d5') &&
                   content.includes('MonadWallet');
        },
        description: 'Function selector fixes'
    },
    {
        file: 'config/contract.json',
        check: (content) => {
            const config = JSON.parse(content);
            return config.chainId === '0x2797' && 
                   config.rpcUrl === 'https://rpc.testnet.monad.xyz' &&
                   config.chainName === 'Monad Testnet';
        },
        description: 'Network configuration fix'
    },
    {
        file: 'public/script.js',
        check: (content) => {
            return content.includes('initMonadRunnerGame') && 
                   content.includes('initCryptoPuzzleGame') &&
                   content.includes('initTokenCollectorGame') &&
                   content.includes('initBlockchainTetrisGame') &&
                   content.includes('MonadPlayhouse');
        },
        description: 'Game implementations fix'
    },
    {
        file: 'public/wallet-manager.js',
        check: (content) => {
            return content.includes('createWalletModal()') && 
                   content.includes('setTimeout(() => {') &&
                   content.includes('WalletManager');
        },
        description: 'Wallet manager initialization fix'
    },
    {
        file: 'public/payment.js',
        check: (content) => {
            return content.includes('console.log(\'Initializing payment gateway...\')') && 
                   content.includes('PaymentGateway');
        },
        description: 'Payment system initialization fix'
    }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    try {
        const filePath = path.join(__dirname, check.file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (check.check(content)) {
                console.log(`✅ ${check.description} - PASSED`);
                passed++;
            } else {
                console.log(`❌ ${check.description} - FAILED`);
                failed++;
            }
        } else {
            console.log(`❌ ${check.description} - FILE NOT FOUND`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${check.description} - ERROR: ${error.message}`);
        failed++;
    }
});

console.log('\n📊 Verification Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All fixes verified successfully!');
    console.log('🚀 The application should now work properly.');
} else {
    console.log('\n⚠️  Some fixes may not be applied correctly.');
    console.log('🔧 Please review the failed checks above.');
}

// Check if test files exist
console.log('\n📁 Test Files:');
const testFiles = ['test-fixes.html', 'FIXES_SUMMARY.md'];
testFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? 'exists' : 'missing'}`);
});

console.log('\n🔗 Access the application at: http://localhost:8080/public/index.html');
console.log('🧪 Test page at: http://localhost:8080/test-fixes.html');
