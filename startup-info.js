#!/usr/bin/env node

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function printBanner() {
    console.log('\n' + colors.bright + colors.green + '🚀 CROP PREDICTION APP - ALL SERVICES STARTING' + colors.reset);
    console.log(colors.cyan + '=' .repeat(55) + colors.reset);
    console.log('');
    console.log(colors.bright + '📱 FRONTEND (React + Vite):' + colors.reset);
    console.log('   ' + colors.blue + '🔗 http://localhost:3000' + colors.reset);
    console.log('   ' + colors.dim + '   → Main application interface' + colors.reset);
    console.log('');
    console.log(colors.bright + '🔧 NODE.JS BACKEND:' + colors.reset);
    console.log('   ' + colors.blue + '🔗 http://localhost:5000' + colors.reset);
    console.log('   ' + colors.dim + '   → Express server, MongoDB, CSV uploads' + colors.reset);
    console.log('');
    console.log(colors.bright + '🤖 FASTAPI ML BACKEND:' + colors.reset);
    console.log('   ' + colors.blue + '🔗 http://localhost:8000' + colors.reset);
    console.log('   ' + colors.blue + '📚 http://localhost:8000/docs' + colors.reset + colors.dim + ' (API docs)' + colors.reset);
    console.log('   ' + colors.dim + '   → Machine Learning predictions, Real ML models' + colors.reset);
    console.log('');
    console.log(colors.yellow + '⏱️  Please wait while all services start up...' + colors.reset);
    console.log(colors.cyan + '=' .repeat(55) + colors.reset);
    console.log('');
    console.log(colors.bright + '💡 QUICK TEST:' + colors.reset);
    console.log('   1. Go to http://localhost:3000/data-input');
    console.log('   2. Fill crop data (temperature & rainfall required)');
    console.log('   3. Click "Predict Yield" → Get ML predictions!');
    console.log('');
}

// Show banner after a short delay to let concurrently start
setTimeout(printBanner, 1500);

// Keep the process running
setInterval(() => {}, 60000);