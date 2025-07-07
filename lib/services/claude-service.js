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
    
    // claude command
    const command = `echo "${question}" | claude`;
    logger.debug(`Executing command: ${command}`);
    
    const timeout = setTimeout(() => {
      logger.warn(`Claude process timeout after ${config.timeout}ms`);
      reject(new Error('Claude response timeout'));
    }, config.timeout);
    
    try {
      logger.debug(`Command timeout set to: ${config.timeout}ms`);
      const startTime = Date.now();
      
      // Clean environment to avoid Claude Code conflicts
      const cleanEnv = { ...process.env };
      delete cleanEnv.CLAUDE_CODE_SSE_PORT;
      delete cleanEnv.CLAUDE_CODE_ENTRYPOINT;
      delete cleanEnv.CLAUDECODE;
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: config.timeout,
        env: cleanEnv
      });
      const endTime = Date.now();
      clearTimeout(timeout);
      
      logger.debug(`Command execution took: ${endTime - startTime}ms`);
      
      if (stderr) {
        logger.debug(`Claude stderr: ${stderr.trim()}`);
      }
      
      if (stdout) {
        logger.info('Claude session completed successfully');
        logger.debug(`Claude stdout: ${stdout.trim()}`);
        logger.debug(`Claude output length: ${stdout.length} chars`);
        resolve(true);
      } else {
        logger.error('Claude session failed: No output received');
        reject(new Error('No output received from Claude'));
      }
    } catch (error) {
      clearTimeout(timeout);
      logger.error(`Claude session failed: ${error.message}`);
      logger.debug(`Error details: ${JSON.stringify(error, null, 2)}`);
      reject(new Error(`Claude execution error: ${error.message}`));
    }
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