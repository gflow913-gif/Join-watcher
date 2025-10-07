const { REST, Routes, SlashCommandBuilder } = require('discord.js');

async function registerCommands(client) {
  const commands = [
    new SlashCommandBuilder()
      .setName('checkuser')
      .setDescription('Check a user\'s eligibility and payment status')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('The user to check')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Show overall server statistics'),
    new SlashCommandBuilder()
      .setName('scanexisting')
      .setDescription('Scan existing members and mark them in the system (Admin only)'),
    new SlashCommandBuilder()
      .setName('unclaimed')
      .setDescription('Show all unclaimed eligible joins'),
    new SlashCommandBuilder()
      .setName('claim')
      .setDescription('Mark all unclaimed joins as claimed'),
    new SlashCommandBuilder()
      .setName('setupticket')
      .setDescription('Set up the ticket system')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('The channel to send the ticket panel')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('nameprefix')
          .setDescription('The prefix for ticket names (e.g., "ticket")')
          .setRequired(true))
      .addChannelOption(option =>
        option.setName('category')
          .setDescription('The category to create tickets in (optional)')
          .setRequired(false)),
    new SlashCommandBuilder()
      .setName('createroles')
      .setDescription('Create Big Funder, Middle Funder, and Small Funder roles with RGB colors')
  ];

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    console.log('Started refreshing application (/) commands.');

    const guilds = client.guilds.cache.map(guild => guild.id);

    for (const guildId of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands },
      );
    }

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

module.exports = { registerCommands };