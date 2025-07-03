const chalk = require('chalk');
const { getRecentLogs, getLogStats } = require('../utils/logger');

module.exports = function(options) {
  console.log(chalk.blue('📄 Recent logs:\n'));
  
  try {
    const stats = getLogStats();
    
    // Show log file information
    console.log(chalk.gray('Log files:'));
    console.log(chalk.gray(`  Output: ${stats.outputLog.path} (${stats.outputLog.exists ? formatBytes(stats.outputLog.size) : 'not found'})`));
    console.log(chalk.gray(`  Errors: ${stats.errorLog.path} (${stats.errorLog.exists ? formatBytes(stats.errorLog.size) : 'not found'})\n`));
    
    // Get recent log entries
    const logs = getRecentLogs(20, true);
    
    if (logs.length === 0) {
      console.log(chalk.yellow('No log entries found.'));
      return;
    }
    
    // Display log entries
    logs.forEach(log => {
      if (log.type === 'error') {
        console.log(chalk.red(log.message));
      } else {
        console.log(log.message);
      }
    });
    
    console.log(chalk.gray(`\nShowing ${logs.length} most recent entries.`));
    console.log(chalk.gray('Use "tail -f ~/.claude-code-keepalive/output.log" for real-time monitoring.'));
  } catch (error) {
    console.error(chalk.red(`❌ Error reading logs: ${error.message}`));
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}