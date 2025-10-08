
require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { loadData } = require('./utils/dataManager');
const { loadConfig } = require('./utils/config');
const { loadCasinoData, loadCasinoConfig } = require('./utils/casinoManager');
const { loadLotteryData } = require('./utils/lotteryManager');
const { loadDepositData } = require('./utils/depositManager');
const { registerCommands } = require('./utils/commandRegistration');
const { handleMemberJoin } = require('./events/memberJoin');
const { handleMemberLeave } = require('./events/memberLeave');
const { handleInteraction } = require('./events/interactionHandler');
const { updateInviteCache } = require('./utils/inviteTracker');

// Express server for uptime (keeps bot alive on Render.com)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, '0.0.0.0', () => console.log(`Express server running on port ${PORT}`));

// Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Load all data from Replit Database
  await loadData();
  await loadConfig();
  await loadCasinoData();
  await loadCasinoConfig();
  await loadLotteryData();
  await loadDepositData();
  
  for (const guild of client.guilds.cache.values()) {
    await updateInviteCache(guild);
  }
  console.log('✅ Invite cache initialized');
  
  await registerCommands(client);
  console.log('✅ Commands registered');
});

client.on('guildMemberAdd', (member) => handleMemberJoin(member, client));
client.on('guildMemberRemove', (member) => handleMemberLeave(member, client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));

client.login(process.env.DISCORD_BOT_TOKEN);
