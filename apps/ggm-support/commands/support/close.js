// close.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Closes the current ticket.')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for closing')),
  async execute(interaction) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const { channel } = interaction;

    await interaction.reply({ content: `🔒 Closing ticket in 5 seconds... Reason: **${reason}**` });

    await supabase.from('support_tickets').update({ status: 'CLOSED', reason }).eq('channel_id', channel.id);

    setTimeout(() => channel.delete().catch(() => {}), 5000);
  }
};