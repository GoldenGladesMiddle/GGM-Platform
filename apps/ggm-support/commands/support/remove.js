const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Removes a user or role from a ticket (Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addMentionableOption(opt => 
      opt.setName('target')
        .setDescription('The user or role to remove from this ticket')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getMentionable('target');

    await interaction.channel.permissionOverwrites.delete(target.id);
    await interaction.reply({ content: `Removed ${target} from this ticket.` });
  }
};