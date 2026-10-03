// notes.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('Creates a private thread for discussion between support representatives.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const thread = await interaction.channel.threads.create({
      name: '🔒 Staff Discussion Notes',
      autoArchiveDuration: 1440,
      reason: 'Staff internal discussion'
    });

    await interaction.reply({ content: `Private staff discussion thread created: ${thread}`, ephemeral: true });
  }
};