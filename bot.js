const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'member_data.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

let memberData = {
  members: {},
  totalEligibleJoins: 0,
  totalPaymentDue: 0,
  ticketConfig: {
    channelId: null,
    namePrefix: 'ticket',
    ticketCounter: 0,
    categoryId: null
  },
  activeTickets: {}
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      memberData = JSON.parse(data);
      console.log('Data loaded successfully');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memberData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

function checkEligibility(userId, isNewMember) {
  if (!memberData.members[userId]) {
    memberData.members[userId] = {
      userId: userId,
      firstJoin: new Date().toISOString(),
      joins: [],
      eligibleJoins: 0,
      totalOwed: 0
    };
  }

  const member = memberData.members[userId];
  const now = new Date().toISOString();
  
  member.joins.push({
    timestamp: now,
    isNewMember: isNewMember,
    claimed: false
  });

  if (isNewMember) {
    member.eligibleJoins++;
    member.totalOwed += 2;
    memberData.totalEligibleJoins++;
    memberData.totalPaymentDue += 2;
    saveData();
    return { eligible: true, reason: 'New member join', owed: 2 };
  } else {
    saveData();
    return { eligible: false, reason: 'Rejoined (already counted)', owed: 0 };
  }
}

client.once('ready', async () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`);
  loadData();

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
      .setDescription('Set up ticket system in a channel')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('The channel to send the ticket panel')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('nameprefix')
          .setDescription('Ticket name prefix (e.g., "join_claim" for join_claim-1)')
          .setRequired(true)
      )
      .addChannelOption(option =>
        option.setName('category')
          .setDescription('Category to create tickets in (optional)')
          .setRequired(false)
      )
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
});

client.on('guildMemberAdd', async (member) => {
  console.log(`New member joined: ${member.user.tag} (${member.user.id})`);

  const isNewMember = !memberData.members[member.user.id] || memberData.members[member.user.id].joins.length === 0;
  
  const result = checkEligibility(member.user.id, isNewMember);

  console.log(`Eligibility check for ${member.user.tag}:`);
  console.log(`- Eligible: ${result.eligible}`);
  console.log(`- Reason: ${result.reason}`);
  console.log(`- Payment owed: ${result.owed}sx`);

  try {
    const logChannel = member.guild.channels.cache.find(
      ch => ch.name === 'join-logs' || ch.name === 'logs' || ch.type === 0
    );

    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({
        content: `**Member Join Detected**\n` +
          `User: ${member.user.tag} (<@${member.user.id}>)\n` +
          `Status: ${result.eligible ? '✅ Eligible (NEW)' : '❌ Not Eligible (REJOIN)'}\n` +
          `Payment: ${result.owed}sx\n` +
          `Total Eligible Joins: ${memberData.totalEligibleJoins}\n` +
          `Total Payment Due: ${memberData.totalPaymentDue}sx`
      });
    }
  } catch (error) {
    console.error('Error sending log message:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'checkuser') {
    const user = interaction.options.getUser('user');
    const userData = memberData.members[user.id];

    if (!userData) {
      await interaction.reply({
        content: `No data found for ${user.tag}. They haven't joined the server yet or weren't tracked.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: `**User Information: ${user.tag}**\n` +
        `First Join: ${new Date(userData.firstJoin).toLocaleString()}\n` +
        `Total Joins: ${userData.joins.length}\n` +
        `Eligible Joins: ${userData.eligibleJoins}\n` +
        `Total Owed: ${userData.totalOwed}sx\n\n` +
        `**Join History:**\n` +
        userData.joins.map((join, i) => 
          `${i + 1}. ${new Date(join.timestamp).toLocaleString()} - ${join.isNewMember ? 'NEW ✅' : 'REJOIN ❌'}`
        ).join('\n'),
      ephemeral: true
    });
  }

  if (interaction.commandName === 'stats') {
    const totalMembers = Object.keys(memberData.members).length;
    
    await interaction.reply({
      content: `**Server Statistics**\n` +
        `Total Tracked Members: ${totalMembers}\n` +
        `Total Eligible Joins: ${memberData.totalEligibleJoins}\n` +
        `Total Payment Due: ${memberData.totalPaymentDue}sx\n` +
        `Rate: 2sx per eligible join`,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'scanexisting') {
    if (!interaction.member.permissions.has('Administrator')) {
      await interaction.reply({
        content: 'You need Administrator permission to use this command.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const members = await interaction.guild.members.fetch();
      let newlyTracked = 0;
      let alreadyTracked = 0;

      members.forEach(member => {
        if (member.user.bot) return;

        if (!memberData.members[member.user.id]) {
          memberData.members[member.user.id] = {
            userId: member.user.id,
            firstJoin: member.joinedAt?.toISOString() || new Date().toISOString(),
            joins: [{
              timestamp: member.joinedAt?.toISOString() || new Date().toISOString(),
              isNewMember: false,
              claimed: true,
              note: 'Pre-existing member (scanned, not eligible for payment)'
            }],
            eligibleJoins: 0,
            totalOwed: 0,
            isScanned: true
          };
          newlyTracked++;
        } else {
          alreadyTracked++;
        }
      });

      saveData();

      await interaction.editReply({
        content: `**Scan Complete**\n` +
          `Total members scanned: ${members.size}\n` +
          `Newly tracked: ${newlyTracked}\n` +
          `Already tracked: ${alreadyTracked}\n` +
          `Total eligible joins: ${memberData.totalEligibleJoins}\n` +
          `Total payment due: ${memberData.totalPaymentDue}sx`
      });
    } catch (error) {
      console.error('Error scanning members:', error);
      await interaction.editReply({
        content: `Error scanning members: ${error.message}`
      });
    }
  }

  if (interaction.commandName === 'unclaimed') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    const unclaimedJoins = [];
    
    for (const [userId, userData] of Object.entries(memberData.members)) {
      userData.joins.forEach((join, index) => {
        if (join.isNewMember && !join.claimed) {
          unclaimedJoins.push({
            userId: userId,
            timestamp: join.timestamp,
            joinIndex: index
          });
        }
      });
    }

    if (unclaimedJoins.length === 0) {
      await interaction.reply({
        content: '**No Unclaimed Joins**\nAll eligible joins have been claimed!',
        ephemeral: true
      });
      return;
    }

    const totalUnclaimed = unclaimedJoins.length;
    const totalUnclaimedPayment = totalUnclaimed * 2;

    let message = `**Unclaimed Eligible Joins**\n`;
    message += `Total Unclaimed: ${totalUnclaimed}\n`;
    message += `Total Payment Due: ${totalUnclaimedPayment}sx\n\n`;

    const displayLimit = 20;
    const displayJoins = unclaimedJoins.slice(0, displayLimit);

    for (const join of displayJoins) {
      const user = await client.users.fetch(join.userId).catch(() => null);
      const userName = user ? user.tag : `User ID: ${join.userId}`;
      message += `• ${userName} - ${new Date(join.timestamp).toLocaleString()} - 2sx\n`;
    }

    if (unclaimedJoins.length > displayLimit) {
      message += `\n...and ${unclaimedJoins.length - displayLimit} more`;
    }

    await interaction.reply({
      content: message,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'claim') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    let claimedCount = 0;
    let claimedAmount = 0;

    for (const [userId, userData] of Object.entries(memberData.members)) {
      userData.joins.forEach((join) => {
        if (join.isNewMember && !join.claimed) {
          join.claimed = true;
          claimedCount++;
          claimedAmount += 2;
        }
      });
    }

    if (claimedCount === 0) {
      await interaction.reply({
        content: '**No Unclaimed Joins**\nThere are no eligible joins to claim.',
        ephemeral: true
      });
      return;
    }

    saveData();

    await interaction.reply({
      content: `**Joins Claimed Successfully!**\n` +
        `Claimed Joins: ${claimedCount}\n` +
        `Total Amount Claimed: ${claimedAmount}sx\n\n` +
        `All eligible joins have been marked as claimed.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'setupticket') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    const channel = interaction.options.getChannel('channel');
    const namePrefix = interaction.options.getString('nameprefix');
    const category = interaction.options.getChannel('category');

    if (!memberData.ticketConfig) {
      memberData.ticketConfig = {
        channelId: null,
        namePrefix: 'ticket',
        ticketCounter: 0,
        categoryId: null
      };
    }

    memberData.ticketConfig.channelId = channel.id;
    memberData.ticketConfig.namePrefix = namePrefix;
    memberData.ticketConfig.categoryId = category?.id || null;

    saveData();

    const embed = new EmbedBuilder()
      .setTitle('Claim Panel')
      .setDescription('To create a ticket use the **Create Ticket** button below.')
      .setColor(0x5865F2);

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('📧 Create Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(button);

    try {
      await channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: `✅ Ticket system set up successfully!\n` +
          `Channel: <#${channel.id}>\n` +
          `Ticket Name: ${namePrefix}-1, ${namePrefix}-2, etc.\n` +
          `Category: ${category ? `<#${category.id}>` : 'None (tickets in server root)'}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error setting up ticket system:', error);
      await interaction.reply({
        content: `Error setting up ticket system: ${error.message}`,
        ephemeral: true
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
    if (!memberData.ticketConfig) {
      memberData.ticketConfig = {
        channelId: null,
        namePrefix: 'ticket',
        ticketCounter: 0,
        categoryId: null
      };
    }

    const ticketConfig = memberData.ticketConfig;

    if (!ticketConfig.channelId) {
      await interaction.reply({
        content: 'Ticket system is not set up yet.',
        ephemeral: true
      });
      return;
    }

    if (memberData.activeTickets[interaction.user.id]) {
      await interaction.reply({
        content: `❌ You already have an active ticket: <#${memberData.activeTickets[interaction.user.id]}>`,
        ephemeral: true
      });
      return;
    }

    ticketConfig.ticketCounter++;
    const ticketName = `${ticketConfig.namePrefix}-${ticketConfig.ticketCounter}`;

    saveData();

    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: ticketConfig.categoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: '1309720025912971355',
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      });

      memberData.activeTickets[interaction.user.id] = ticketChannel.id;
      saveData();

      await interaction.reply({
        content: `✅ Ticket created: <#${ticketChannel.id}>`,
        ephemeral: true
      });

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger);

      const closeRow = new ActionRowBuilder()
        .addComponents(closeButton);

      await ticketChannel.send({
        content: `Welcome <@${interaction.user.id}>! This is your private ticket channel.\n\nIt may take up to 24 hours for a payout manager to respond. So please have some patience.`,
        components: [closeRow]
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: `Error creating ticket: ${error.message}`,
        ephemeral: true
      });
    }
  }

    if (interaction.customId === 'close_ticket') {
    if (!memberData.activeTickets) {
      memberData.activeTickets = {};
    }

    const userId = Object.keys(memberData.activeTickets).find(
      key => memberData.activeTickets[key] === interaction.channel.id
    );

    if (!userId) {
      await interaction.reply({
        content: 'This ticket is not tracked.',
        ephemeral: true
      });
      return;
    }

    if (interaction.user.id !== userId && interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'Only the ticket creator or the owner can close this ticket.',
        ephemeral: true
      });
      return;
    }

    delete memberData.activeTickets[userId];
    saveData();

    await interaction.reply({
      content: '🔒 Ticket is being closed...'
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 3000);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
