const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user from the server (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(opt => opt.setName('user').setDescription('User Discord ID').setRequired(true)),

  async execute(interaction) {
    const userId = interaction.options.getString('user');

    try {
      await interaction.guild.members.unban(userId);
      await interaction.reply({ content: `Successfully unbanned user ID: **${userId}**.` });
    } catch (err) {
      await interaction.reply({ content: `Failed to unban user. Make sure ID is valid and currently banned.`, ephemeral: true });
    }
  }
};