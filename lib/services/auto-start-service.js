const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const MACOS_PLIST_PATH = path.join(os.homedir(), 'Library/LaunchAgents/com.claude-code-keepalive.plist');
const LINUX_SERVICE_PATH = path.join(os.homedir(), '.config/systemd/user/claude-code-keepalive.service');

/**
 * Check if auto-start service is already registered
 */
async function checkAutoStartService() {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') { // macOS
      return fs.existsSync(MACOS_PLIST_PATH);
    } else if (platform === 'linux') { // Linux
      return fs.existsSync(LINUX_SERVICE_PATH);
    } else if (platform === 'win32') { // Windows
      try {
        const { stdout } = await execAsync('schtasks /query /tn "ClaudeCodeKeepalive" /fo list 2>nul || echo "NotFound"');
        return !stdout.includes('NotFound') && stdout.includes('TaskName:');
      } catch (error) {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
  
  return false;
}

/**
 * Setup auto-start service for the current platform
 */
async function setupAutoStart() {
  const platform = process.platform;
  const execPath = process.execPath; // Node.js executable
  const scriptPath = path.resolve(path.join(__dirname, '../../bin/claude-code-keepalive.js'));
  
  try {
    if (platform === 'darwin') { // macOS
      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude-code-keepalive</string>
    <key>ProgramArguments</key>
    <array>
        <string>${execPath}</string>
        <string>${scriptPath}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${path.join(os.homedir(), '.claude-code-keepalive/output.log')}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(os.homedir(), '.claude-code-keepalive/error.log')}</string>
</dict>
</plist>`;
      
      fs.ensureDirSync(path.dirname(MACOS_PLIST_PATH));
      fs.writeFileSync(MACOS_PLIST_PATH, plistContent);
      await execAsync(`launchctl load -w "${MACOS_PLIST_PATH}"`);
      
    } else if (platform === 'linux') { // Linux
      const serviceContent = `[Unit]
Description=Claude Code Keepalive Service

[Service]
ExecStart=${execPath} ${scriptPath} start
Restart=on-failure
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin:${process.env.PATH}

[Install]
WantedBy=default.target`;
      
      fs.ensureDirSync(path.dirname(LINUX_SERVICE_PATH));
      fs.writeFileSync(LINUX_SERVICE_PATH, serviceContent);
      await execAsync('systemctl --user daemon-reload');
      await execAsync('systemctl --user enable claude-code-keepalive.service');
      
    } else if (platform === 'win32') { // Windows
      const command = `schtasks /create /tn "ClaudeCodeKeepalive" /sc onlogon /tr "\\"${execPath}\\" \\"${scriptPath}\\" start" /ru "${os.userInfo().username}" /f`;
      await execAsync(command);
    }
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to setup auto-start:`, error.message);
    return false;
  }
}

/**
 * Remove auto-start service
 */
async function removeAutoStart() {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') { // macOS
      if (fs.existsSync(MACOS_PLIST_PATH)) {
        try {
          await execAsync(`launchctl unload -w "${MACOS_PLIST_PATH}"`);
        } catch (error) {
          // Ignore unload errors as the service might not be loaded
        }
        fs.unlinkSync(MACOS_PLIST_PATH);
      }
    } else if (platform === 'linux') { // Linux
      if (fs.existsSync(LINUX_SERVICE_PATH)) {
        try {
          await execAsync('systemctl --user disable claude-code-keepalive.service');
        } catch (error) {
          // Ignore disable errors
        }
        fs.unlinkSync(LINUX_SERVICE_PATH);
        await execAsync('systemctl --user daemon-reload');
      }
    } else if (platform === 'win32') { // Windows
      try {
        await execAsync('schtasks /delete /tn "ClaudeCodeKeepalive" /f');
      } catch (error) {
        // Ignore delete errors if task doesn't exist
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to remove auto-start:`, error.message);
    return false;
  }
}

/**
 * Get platform-specific auto-start status info
 */
async function getAutoStartInfo() {
  const platform = process.platform;
  const isSetup = await checkAutoStartService();
  
  let info = {
    platform: platform,
    isSetup: isSetup,
    serviceName: '',
    location: ''
  };
  
  if (platform === 'darwin') {
    info.serviceName = 'macOS LaunchAgent';
    info.location = MACOS_PLIST_PATH;
  } else if (platform === 'linux') {
    info.serviceName = 'systemd user service';
    info.location = LINUX_SERVICE_PATH;
  } else if (platform === 'win32') {
    info.serviceName = 'Windows Task Scheduler';
    info.location = 'Task: ClaudeCodeKeepalive';
  } else {
    info.serviceName = 'Unsupported platform';
    info.location = 'N/A';
  }
  
  return info;
}

module.exports = {
  checkAutoStartService,
  setupAutoStart,
  removeAutoStart,
  getAutoStartInfo
};