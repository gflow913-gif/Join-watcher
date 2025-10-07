// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// --------------------
// Discord Bot Setup
// --------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const token = process.env.DISCORD_BOT_TOKEN;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.channel.send('Pong! 🏓');
  }
});

client.login(token);

// --------------------
// Tiny Web Server
// --------------------
const app = express();
const PORT = process.env.PORT || 3000;

// This route is pinged by UptimeRobot to keep Replit awake
app.get('/', (req, res) => {
  res.send('Bot is alive and running 24/7!');
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});