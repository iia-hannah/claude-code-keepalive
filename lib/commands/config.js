const chalk = require('chalk');
const { getConfig, CONFIG_FILE } = require('../utils/config-manager');

module.exports = function() {
  try {
    const config = getConfig();
    
    console.log(chalk.blue(`⚙️  Configuration file: ${CONFIG_FILE}`));
    console.log(chalk.green(JSON.stringify(config, null, 2)));
    console.log(chalk.gray('\nTo modify settings, edit this file or use command options.'));
  } catch (error) {
    console.error(chalk.red(`❌ Error reading configuration: ${error.message}`));
  }
};