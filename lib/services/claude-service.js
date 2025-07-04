const { spawn, exec } = require('child_process');
const { getConfig } = require('../utils/config-manager');
const logger = require('../utils/logger');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Get Claude CLI executable path
 */
async function getClaudePath() {
  try {
    const { stdout } = await execAsync('which claude');
    return stdout.trim();
  } catch (error) {
    logger.debug('which claude failed, trying whereis...');
    try {
      const { stdout } = await execAsync('whereis claude');
      const path = stdout.split(' ').find(p => p.includes('/claude'));
      return path ? path.trim() : 'claude';
    } catch (error2) {
      return 'claude'; // fallback to PATH lookup
    }
  }
}

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
  
  return new Promise(async (resolve, reject) => {
    logger.info(`Starting Claude session with question: "${question}"`);
    
    // Get Claude CLI path for more reliable execution
    const claudePath = await getClaudePath();
    logger.debug(`Using Claude CLI path: ${claudePath}`);
    
    // Use claude -p for single prompt mode with proper environment and options
    const claudeProcess = spawn(claudePath, ['-p', '--output-format', 'text', question], { 
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
      shell: false
    });
    
    let output = '';
    let error = '';
    let timeout;
    
    // Set timeout
    timeout = setTimeout(() => {
      logger.warn(`Claude process timeout after ${config.timeout}ms, killing process`);
      claudeProcess.kill('SIGTERM');
      reject(new Error('Claude response timeout'));
    }, config.timeout);
    
    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
      logger.debug(`Claude stdout: ${data.toString().trim()}`);
    });
    
    claudeProcess.stderr.on('data', (data) => {
      error += data.toString();
      logger.debug(`Claude stderr: ${data.toString().trim()}`);
    });
    
    claudeProcess.on('error', (err) => {
      clearTimeout(timeout);
      logger.error(`Claude process spawn error: ${err.message}`);
      reject(new Error(`Claude process error: ${err.message}`));
    });
    
    claudeProcess.on('close', (code, signal) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        logger.info('Claude session completed successfully');
        logger.debug(`Claude output length: ${output.length} chars`);
        resolve(true);
      } else {
        const errorMessage = error || `Claude process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
        logger.error(`Claude session failed: ${errorMessage}`);
        if (error) {
          logger.debug(`Claude stderr content: ${error}`);
        }
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
  
  logger.info(`Starting burst sequence (${burstCount} attempts)...`);
  
  let successCount = 0;
  
  // Execute first attempt immediately
  try {
    logger.info(`Burst attempt 1/${burstCount}`);
    await pingClaude();
    successCount++;
  } catch (error) {
    logger.error(`Burst attempt 1 failed: ${error.message}`);
  }
  
  // Schedule remaining attempts
  for (let i = 1; i < burstCount; i++) {
    await new Promise(resolve => {
      setTimeout(async () => {
        try {
          logger.info(`Burst attempt ${i+1}/${burstCount}`);
          await pingClaude();
          successCount++;
        } catch (error) {
          logger.error(`Burst attempt ${i+1} failed: ${error.message}`);
        } finally {
          resolve();
        }
      }, burstInterval);
    });
  }
  
  logger.info(`Burst sequence complete. ${successCount}/${burstCount} attempts succeeded.`);
  return successCount;
}

module.exports = {
  checkClaudeInstallation,
  pingClaude,
  executeBurstSequence,
  getClaudePath
};