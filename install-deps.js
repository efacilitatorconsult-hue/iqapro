const { execSync } = require('child_process');
const path = require('path');
const npmCmd = '"C:\\Program Files\\nodejs\\npm.cmd"';
console.log('Running', npmCmd, 'in', process.cwd());
execSync(`${npmCmd} install tailwindcss postcss autoprefixer`, { stdio: 'inherit', cwd: process.cwd() });
console.log('Install complete');
