const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
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
  totalPaymentDue: 0
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
    isNewMember: isNewMember
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
      .setDescription('Scan existing members and mark them in the system (Admin only)')
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
  if (!interaction.isChatInputCommand()) return;

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
});

client.login(process.env.DISCORD_BOT_TOKEN);
