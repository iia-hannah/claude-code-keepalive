const fs = require('fs-extra');
const path = require('path');
const { CONFIG_DIR } = require('../utils/config-manager');
const logger = require('../utils/logger');

const PID_FILE = path.join(CONFIG_DIR, 'claude-code-keepalive.pid');

/**
 * Save process PID to file
 */
function savePid(pid) {
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeFileSync(PID_FILE, pid.toString());
  logger.info(`PID saved: ${pid}`);
}

/**
 * Read PID from file
 */
function getPid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const pidStr = fs.readFileSync(PID_FILE, 'utf8').trim();
      return parseInt(pidStr);
    }
  } catch (error) {
    logger.error('Error reading PID file', error);
  }
  return null;
}

/**
 * Remove PID file
 */
function removePid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
      logger.info('PID file removed');
    }
  } catch (error) {
    logger.error('Error removing PID file', error);
  }
}

/**
 * Check if process is running
 */
function isRunning(pid) {
  try {
    if (pid && process.kill(pid, 0)) {
      return true;
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      logger.error('Error checking process status', error);
    }
  }
  return false;
}

/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers() {
  ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      removePid();
      process.exit(0);
    });
  });
}

/**
 * Stop process by PID
 */
function stopProcess(pid) {
  try {
    if (isRunning(pid)) {
      process.kill(pid, 'SIGTERM');
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error stopping process ${pid}`, error);
    return false;
  }
}

module.exports = {
  savePid,
  getPid,
  removePid,
  isRunning,
  setupSignalHandlers,
  stopProcess,
  PID_FILE
};