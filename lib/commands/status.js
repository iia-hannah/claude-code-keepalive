const chalk = require('chalk');
const { getPid, isRunning } = require('../services/process-manager');
const { getConfig } = require('../utils/config-manager');

module.exports = function() {
  const pid = getPid();
  const isProcessRunning = pid && isRunning(pid);
  const config = getConfig();
  
  if (isProcessRunning) {
    console.log(chalk.green(`✅ claude-code-keepalive is running (PID: ${pid})`));
    
    // Show next scheduled ping (approximate)
    const nextPingTime = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000);
    console.log(chalk.blue(`📅 Next ping estimated: ${nextPingTime.toLocaleString()}`));
  } else {
    console.log(chalk.red('❌ claude-code-keepalive is not running'));
    if (pid) {
      console.log(chalk.yellow(`⚠️ Stale PID file found: ${pid}`));
    }
  }
  
  // Show configuration summary
  console.log(chalk.gray('\nConfiguration:'));
  console.log(chalk.gray(`  Interval: ${config.intervalHours} hours`));
  console.log(chalk.gray(`  Burst count: ${config.burstCount}`));
  console.log(chalk.gray(`  Burst interval: ${config.burstInterval} minutes`));
  console.log(chalk.gray(`  Question: "${config.question}"`));
};