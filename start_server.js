const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting POS System Server...\n');

// Set the project directory
const projectPath = 'C:\\Users\\Hassa\\OneDrive\\سطح المكتب\\pos_system_modern_ui\\pos';

console.log(`📁 Project directory: ${projectPath}\n`);

// Change to project directory
process.chdir(projectPath);

console.log(`📂 Current directory: ${process.cwd()}\n`);

// Install dependencies
console.log('📦 Installing dependencies...\n');
const installProcess = spawn('npm', ['install'], { 
    stdio: 'inherit',
    shell: true 
});

installProcess.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ Dependencies installed successfully!\n');
        
        // Start development server
        console.log('🌐 Starting development server...\n');
        const devProcess = spawn('npm', ['run', 'dev'], { 
            stdio: 'inherit',
            shell: true 
        });
        
        devProcess.on('close', (code) => {
            console.log(`\n🛑 Server stopped with code: ${code}`);
        });
        
        // Handle Ctrl+C
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping server...');
            devProcess.kill('SIGINT');
        });
        
    } else {
        console.log(`\n❌ Failed to install dependencies with code: ${code}`);
    }
});

installProcess.on('error', (err) => {
    console.error('❌ Error installing dependencies:', err);
});
