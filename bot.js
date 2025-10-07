require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { loadData, saveData, checkEligibility, memberData } = require('./utils/dataManager');
const { registerCommands } = require('./utils/commandRegistration');
const { handleMemberJoin } = require('./events/memberJoin');
const { handleInteraction } = require('./events/interactionHandler');
const { startFounderRgbAnimation } = require('./utils/founderRgbAnimation');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  loadData();
  await registerCommands(client);
  startFounderRgbAnimation(client);
});

client.on('guildMemberAdd', (member) => handleMemberJoin(member, client));
client.on('interactionCreate', (interaction) => handleInteraction(interaction, client));

client.login(process.env.DISCORD_BOT_TOKEN);