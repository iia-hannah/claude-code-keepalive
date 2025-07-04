const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.claude-code-keepalive');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  intervalHours: 5,
  timeout: 30000,
  burstCount: 3,
  burstInterval: 2,
  question: 'What time is it now?',
  logLevel: 'info',
  autoRestart: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  from: '07:00',
  count: 3
};

function ensureConfigExists() {
  fs.ensureDirSync(CONFIG_DIR);
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeJsonSync(CONFIG_FILE, DEFAULT_CONFIG, { spaces: 2 });
  }
}

function getConfig() {
  ensureConfigExists();
  const config = fs.readJsonSync(CONFIG_FILE);
  return { ...DEFAULT_CONFIG, ...config };
}

function updateConfig(updates) {
  const config = getConfig();
  const newConfig = { ...config, ...updates };
  fs.writeJsonSync(CONFIG_FILE, newConfig, { spaces: 2 });
  return newConfig;
}

function validateConfig(config) {
  const errors = [];

  if (config.intervalHours < 1 || config.intervalHours > 24) {
    errors.push('intervalHours must be between 1 and 24');
  }

  if (config.burstCount < 1 || config.burstCount > 10) {
    errors.push('burstCount must be between 1 and 10');
  }

  if (config.burstInterval < 1 || config.burstInterval > 60) {
    errors.push('burstInterval must be between 1 and 60 minutes');
  }

  if (config.timeout < 5000 || config.timeout > 120000) {
    errors.push('timeout must be between 5000 and 120000 milliseconds');
  }

  if (config.count < 1 || config.count > 10) {
    errors.push('count must be between 1 and 10');
  }

  // Validate time format (HH:MM)
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.from)) {
    errors.push('from time must be in HH:MM format');
  }

  return errors;
}

module.exports = {
  CONFIG_DIR,
  CONFIG_FILE,
  DEFAULT_CONFIG,
  getConfig,
  updateConfig,
  ensureConfigExists,
  validateConfig
};