const chalk = require('chalk');
const { getPid, isRunning } = require('../services/process-manager');
const { getConfig } = require('../utils/config-manager');
const { getRecentLogs, getLogStats } = require('../utils/logger');
const { getAutoStartInfo } = require('../services/auto-start-service');

module.exports = async function() {
  const pid = getPid();
  const isProcessRunning = pid && isRunning(pid);
  const config = getConfig();
  
  // Service status
  console.log(chalk.blue('📊 Service Status:\n'));
  
  if (isProcessRunning) {
    console.log(chalk.green(`✅ claude-code-keepalive is running (PID: ${pid})`));
    
    // Show next scheduled ping (approximate)
    const nextPingTime = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000);
    console.log(chalk.blue(`📅 Next ping estimated: ${nextPingTime.toLocaleString()}`));
    
    // Show recent activity
    try {
      const recentLogs = getRecentLogs(5);
      if (recentLogs.length > 0) {
        console.log(chalk.gray('\nRecent activity:'));
        recentLogs.forEach(log => {
          console.log(chalk.gray(`  ${log.message}`));
        });
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not read recent logs'));
    }
  } else {
    console.log(chalk.red('❌ claude-code-keepalive is not running'));
    if (pid) {
      console.log(chalk.yellow(`⚠️ Stale PID file found: ${pid}`));
    }
  }
  
  // Auto-start status
  try {
    const autoStartInfo = await getAutoStartInfo();
    console.log(chalk.gray(`\nAuto-start: ${autoStartInfo.isSetup ? '✅ Enabled' : '❌ Disabled'} (${autoStartInfo.serviceName})`));
  } catch (error) {
    console.log(chalk.gray('\nAuto-start: ❓ Unknown'));
  }
  
  // Configuration summary
  console.log(chalk.gray('\nConfiguration:'));
  console.log(chalk.gray(`  Interval: ${config.intervalHours} hours`));
  console.log(chalk.gray(`  Burst count: ${config.burstCount}`));
  console.log(chalk.gray(`  Burst interval: ${config.burstInterval} minutes`));
  console.log(chalk.gray(`  Question: "${config.question}"`));
  console.log(chalk.gray(`  Timeout: ${config.timeout}ms`));
  
  // Log file status
  const logStats = getLogStats();
  console.log(chalk.gray('\nLog files:'));
  console.log(chalk.gray(`  Output: ${logStats.outputLog.exists ? formatBytes(logStats.outputLog.size) : 'Not found'}`));
  console.log(chalk.gray(`  Errors: ${logStats.errorLog.exists ? formatBytes(logStats.errorLog.size) : 'Not found'}`));
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}