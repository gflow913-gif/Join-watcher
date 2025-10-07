require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { loadData, saveData, checkEligibility, memberData } = require('./utils/dataManager');
const { registerCommands } = require('./utils/commandRegistration');
const { handleMemberJoin } = require('./events/memberJoin');
const { handleMemberLeave } = require('./events/memberLeave');
const { handleInteraction } = require('./events/interactionHandler');
const { startFounderRgbAnimation } = require('./utils/founderRgbAnimation');
const { updateInviteCache } = require('./utils/inviteTracker');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

client.once('ready', async () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  loadData();
  
  for (const guild of client.guilds.cache.values()) {
    await updateInviteCache(guild);
  }
  console.log('✅ Invite cache initialized');
  
  await registerCommands(client);
  console.log('⚠️ RGB animation disabled to prevent rate limits');
  console.log('💡 Use /startrgb command to enable RGB animation when needed');
});

client.on('guildMemberAdd', (member) => handleMemberJoin(member, client));
client.on('guildMemberRemove', (member) => handleMemberLeave(member, client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));

client.login(process.env.DISCORD_BOT_TOKEN);