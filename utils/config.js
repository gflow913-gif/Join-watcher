
const Database = require('@replit/database');
const db = new Database();

let config = {
  paymentPerJoin: 2,
  paymentPerInvite: 0
};

async function loadConfig() {
  try {
    const data = await db.get('config');
    if (data) {
      Object.assign(config, data);
      console.log('✅ Config loaded successfully from Replit DB');
    } else {
      await saveConfig();
      console.log('✅ Default config created in Replit DB');
    }
  } catch (error) {
    console.error('❌ Error loading config:', error);
  }
}

async function saveConfig() {
  try {
    await db.set('config', config);
  } catch (error) {
    console.error('❌ Error saving config:', error);
  }
}

async function updatePaymentPerJoin(amount) {
  config.paymentPerJoin = amount;
  await saveConfig();
}

async function updatePaymentPerInvite(amount) {
  config.paymentPerInvite = amount;
  await saveConfig();
}

module.exports = { 
  loadConfig, 
  saveConfig, 
  updatePaymentPerJoin, 
  updatePaymentPerInvite, 
  config
};
