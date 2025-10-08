
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

let config = {
  paymentPerJoin: 2,
  paymentPerInvite: 0
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      Object.assign(config, JSON.parse(data));
      console.log('✅ Config loaded successfully');
    } else {
      saveConfig();
      console.log('✅ Default config created');
    }
  } catch (error) {
    console.error('❌ Error loading config:', error);
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('❌ Error saving config:', error);
  }
}

function updatePaymentPerJoin(amount) {
  config.paymentPerJoin = amount;
  saveConfig();
}

function updatePaymentPerInvite(amount) {
  config.paymentPerInvite = amount;
  saveConfig();
}

module.exports = { 
  loadConfig, 
  saveConfig, 
  updatePaymentPerJoin, 
  updatePaymentPerInvite, 
  config 
};
