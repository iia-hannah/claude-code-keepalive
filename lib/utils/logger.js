const fs = require('fs-extra');
const path = require('path');
const { CONFIG_DIR } = require('./config-manager');
const chalk = require('chalk');

// Ensure log directory exists
fs.ensureDirSync(CONFIG_DIR);

const LOG_FILE = path.join(CONFIG_DIR, 'output.log');
const ERROR_LOG_FILE = path.join(CONFIG_DIR, 'error.log');

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

let currentLogLevel = 'info';

/**
 * Set current log level
 */
function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLogLevel = level;
  }
}

/**
 * Check if message should be logged based on level
 */
function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

/**
 * Format message with timestamp (local time)
 */
function formatMessage(message) {
  const timestamp = new Date().toLocaleString('sv-SE'); // YYYY-MM-DD HH:mm:ss format
  return `[${timestamp}] ${message}`;
}

/**
 * Append message to log file
 */
function appendToLog(message, isError = false) {
  const formattedMessage = formatMessage(message);
  const file = isError ? ERROR_LOG_FILE : LOG_FILE;
  
  try {
    fs.appendFileSync(file, formattedMessage + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Rotate log files if they exceed size limit
 */
function rotateLogIfNeeded(filePath, maxSizeBytes = 10 * 1024 * 1024) { // 10MB
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > maxSizeBytes) {
        const backup = filePath + '.old';
        if (fs.existsSync(backup)) {
          fs.unlinkSync(backup);
        }
        fs.moveSync(filePath, backup);
      }
    }
  } catch (error) {
    console.error(`Failed to rotate log file: ${error.message}`);
  }
}

/**
 * Debug level logging
 */
function debug(message) {
  if (!shouldLog('debug')) return;
  
  console.log(chalk.gray(formatMessage(message)));
  rotateLogIfNeeded(LOG_FILE);
  appendToLog(`[DEBUG] ${message}`);
}

/**
 * Info level logging
 */
function info(message) {
  if (!shouldLog('info')) return;
  
  console.log(formatMessage(message));
  rotateLogIfNeeded(LOG_FILE);
  appendToLog(`[INFO] ${message}`);
}

/**
 * Warning level logging
 */
function warn(message) {
  if (!shouldLog('warn')) return;
  
  console.log(chalk.yellow(formatMessage(message)));
  rotateLogIfNeeded(LOG_FILE);
  appendToLog(`[WARN] ${message}`);
}

/**
 * Error level logging
 */
function error(message, err) {
  if (!shouldLog('error')) return;
  
  const errorMessage = err ? `${message}: ${err.message}` : message;
  console.error(chalk.red(formatMessage(errorMessage)));
  
  rotateLogIfNeeded(ERROR_LOG_FILE);
  appendToLog(`[ERROR] ${errorMessage}`, true);
  
  if (err && err.stack) {
    appendToLog(`[ERROR] ${err.stack}`, true);
  }
}

/**
 * Get recent log entries
 */
function getRecentLogs(count = 10, includeErrors = false) {
  const logs = [];
  
  try {
    // Read main log file
    if (fs.existsSync(LOG_FILE)) {
      const mainLogs = fs.readFileSync(LOG_FILE, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-count);
      logs.push(...mainLogs.map(line => ({ type: 'info', message: line })));
    }
    
    // Read error log file if requested
    if (includeErrors && fs.existsSync(ERROR_LOG_FILE)) {
      const errorLogs = fs.readFileSync(ERROR_LOG_FILE, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-count);
      logs.push(...errorLogs.map(line => ({ type: 'error', message: line })));
    }
    
    // Sort by timestamp and return latest entries
    return logs
      .sort((a, b) => {
        const timeA = a.message.match(/\[(.*?)\]/)?.[1] || '';
        const timeB = b.message.match(/\[(.*?)\]/)?.[1] || '';
        return timeA.localeCompare(timeB);
      })
      .slice(-count);
  } catch (error) {
    console.error(`Failed to read log files: ${error.message}`);
    return [];
  }
}

/**
 * Clear log files
 */
function clearLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
    if (fs.existsSync(ERROR_LOG_FILE)) {
      fs.unlinkSync(ERROR_LOG_FILE);
    }
    return true;
  } catch (error) {
    console.error(`Failed to clear logs: ${error.message}`);
    return false;
  }
}

/**
 * Get log file stats
 */
function getLogStats() {
  const stats = {
    outputLog: { exists: false, size: 0, path: LOG_FILE },
    errorLog: { exists: false, size: 0, path: ERROR_LOG_FILE }
  };
  
  try {
    if (fs.existsSync(LOG_FILE)) {
      const outputStats = fs.statSync(LOG_FILE);
      stats.outputLog.exists = true;
      stats.outputLog.size = outputStats.size;
    }
    
    if (fs.existsSync(ERROR_LOG_FILE)) {
      const errorStats = fs.statSync(ERROR_LOG_FILE);
      stats.errorLog.exists = true;
      stats.errorLog.size = errorStats.size;
    }
  } catch (error) {
    console.error(`Failed to get log stats: ${error.message}`);
  }
  
  return stats;
}

module.exports = {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  getRecentLogs,
  clearLogs,
  getLogStats,
  LOG_FILE,
  ERROR_LOG_FILE
};