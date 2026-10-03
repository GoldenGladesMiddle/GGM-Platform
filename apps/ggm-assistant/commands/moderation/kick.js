const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: 'User is not currently in the server.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: 'Unable to kick this user due to role permissions.', ephemeral: true });
    }

    await member.kick(reason);
    await interaction.reply({ content: `Successfully kicked **${targetUser.tag}** for: *${reason}*` });
  }
};