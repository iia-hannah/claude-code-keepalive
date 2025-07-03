const fs = require('fs-extra');
const path = require('path');
const { CONFIG_DIR } = require('../utils/config-manager');

const PID_FILE = path.join(CONFIG_DIR, 'claude-code-keepalive.pid');

/**
 * Save process PID to file
 */
function savePid(pid) {
  fs.ensureDirSync(CONFIG_DIR);
  fs.writeFileSync(PID_FILE, pid.toString());
  console.log(`[${new Date().toISOString()}] PID saved: ${pid}`);
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
    console.error(`[${new Date().toISOString()}] Error reading PID file:`, error.message);
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
      console.log(`[${new Date().toISOString()}] PID file removed`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error removing PID file:`, error.message);
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
      console.error(`[${new Date().toISOString()}] Error checking process status:`, error.message);
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
      console.log(`[${new Date().toISOString()}] Received ${signal}, shutting down gracefully...`);
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
    console.error(`[${new Date().toISOString()}] Error stopping process ${pid}:`, error.message);
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