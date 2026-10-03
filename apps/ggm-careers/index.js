const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Client, Collection, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const supabase = require('./utils/supabase');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]
});

client.commands = new Collection();
const commandsArray = [];

// Command Loader
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath);
  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const cmd = require(path.join(folderPath, file));
        if ('data' in cmd && 'execute' in cmd) {
          client.commands.set(cmd.data.name, cmd);
          commandsArray.push(cmd.data.toJSON());
        }
      }
    }
  }
}

// Interaction Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (command) await command.execute(interaction);
});

// Bot Ready & Realtime Subscriptions
client.once('ready', async () => {
  console.log(`💼 GGM Careers Bot logged in as ${client.user.tag}`);

  // Register Slash Commands
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandsArray });
    console.log('Registered GGM Careers slash commands successfully!');
  } catch (err) {
    console.error(err);
  }

  // Realtime Listeners for Website Events
  supabase
    .channel('careers_realtime')
    // Listener 1: New Job Posted -> Alert #career-opportunities
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'careers_jobs' }, async (payload) => {
      const newJob = payload.new;
      const channelId = process.env.CAREER_OPPORTUNITIES_CHANNEL_ID;
      if (!channelId) return;

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle(`🚨 New Opening: ${newJob.title}`)
          .setColor(0x2ecc71)
          .setDescription(`${newJob.description}\n\n**Department:** ${newJob.department}\n\n[Apply Now on Careers Portal](https://careers.goldengladesms.org/jobs/${newJob.id})`)
          .setFooter({ text: 'Golden Glades Middle Careers' })
          .setTimestamp();

        await channel.send({ content: '📢 **New Career Opportunity Available!**', embeds: [embed] });
      }
    })
    // Listener 2: Application Status Updated -> Send Direct Message to Candidate
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'careers_applications' }, async (payload) => {
      const updatedApp = payload.new;
      const oldApp = payload.old;

      if (updatedApp.status !== oldApp.status && updatedApp.discord_id) {
        const user = await client.users.fetch(updatedApp.discord_id).catch(() => null);
        if (user) {
          const statusEmbed = new EmbedBuilder()
            .setTitle('Application Status Update')
            .setColor(updatedApp.status === 'ACCEPTED' ? 0x2ecc71 : updatedApp.status === 'REJECTED' ? 0xed4245 : 0x3498db)
            .setDescription(`Your application status for ID \`${updatedApp.id}\` has been updated to **${updatedApp.status}**.`)
            .setFooter({ text: 'Golden Glades Middle Human Resources' })
            .setTimestamp();

          await user.send({ embeds: [statusEmbed] }).catch(() => null);
        }
      }
    })
    .subscribe();
});

client.login(process.env.DISCORD_TOKEN);