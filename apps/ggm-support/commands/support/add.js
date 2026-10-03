// add.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adds a user to a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('target').setDescription('User to add').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    await interaction.channel.permissionOverwrites.edit(target.id, { ViewChannel: true, SendMessages: true });
    await interaction.reply({ content: `Added <@${target.id}> to this ticket.` });
  }
};