const { spawn } = require('child_process');
const { getConfig } = require('../utils/config-manager');

/**
 * Check if Claude CLI is installed and accessible
 */
async function checkClaudeInstallation() {
  return new Promise((resolve) => {
    const process = spawn('claude', ['--version'], { stdio: 'pipe' });
    
    process.on('error', () => resolve(false));
    process.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Send a ping message to Claude CLI to refresh the session
 */
async function pingClaude() {
  const config = getConfig();
  const question = config.question;
  
  return new Promise((resolve, reject) => {
    console.log(`[${new Date().toISOString()}] Starting Claude session...`);
    
    // Use claude -p for single prompt mode
    const claudeProcess = spawn('claude', ['-p', question], { 
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    let output = '';
    let error = '';
    let timeout;
    
    // Set timeout
    timeout = setTimeout(() => {
      claudeProcess.kill();
      reject(new Error('Claude response timeout'));
    }, config.timeout);
    
    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    claudeProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    claudeProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Claude process error: ${err.message}`));
    });
    
    claudeProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        console.log(`[${new Date().toISOString()}] Claude session completed successfully`);
        resolve(true);
      } else {
        const errorMessage = error || `Claude process exited with code ${code}`;
        console.error(`[${new Date().toISOString()}] Claude session failed: ${errorMessage}`);
        reject(new Error(errorMessage));
      }
    });
  });
}

/**
 * Execute burst sequence of Claude pings
 */
async function executeBurstSequence() {
  const config = getConfig();
  const burstCount = config.burstCount;
  const burstInterval = config.burstInterval * 60 * 1000; // convert to ms
  
  console.log(`[${new Date().toISOString()}] Starting burst sequence (${burstCount} attempts)...`);
  
  let successCount = 0;
  
  // Execute first attempt immediately
  try {
    console.log(`[${new Date().toISOString()}] Burst attempt 1/${burstCount}`);
    await pingClaude();
    successCount++;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Burst attempt 1 failed: ${error.message}`);
  }
  
  // Schedule remaining attempts
  for (let i = 1; i < burstCount; i++) {
    await new Promise(resolve => {
      setTimeout(async () => {
        try {
          console.log(`[${new Date().toISOString()}] Burst attempt ${i+1}/${burstCount}`);
          await pingClaude();
          successCount++;
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Burst attempt ${i+1} failed: ${error.message}`);
        } finally {
          resolve();
        }
      }, burstInterval);
    });
  }
  
  console.log(`[${new Date().toISOString()}] Burst sequence complete. ${successCount}/${burstCount} attempts succeeded.`);
  return successCount;
}

module.exports = {
  checkClaudeInstallation,
  pingClaude,
  executeBurstSequence
};