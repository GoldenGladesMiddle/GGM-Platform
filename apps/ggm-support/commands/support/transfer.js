// transfer.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer a claimed ticket to another user.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('New owner').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    await supabase.from('support_tickets').update({ claimed_by: target.id }).eq('channel_id', interaction.channel.id);
    await interaction.reply({ content: `Transferred claim on this ticket to <@${target.id}>.` });
  }
};