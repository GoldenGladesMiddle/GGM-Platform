// claim.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Assigns a staff member to a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const { channel, user } = interaction;
    await interaction.deferReply();

    const { data: ticket } = await supabase.from('support_tickets').select('*').eq('channel_id', channel.id).single();
    if (!ticket) return interaction.editReply({ content: 'This channel is not an active support ticket.' });

    if (ticket.claimed_by) {
      return interaction.editReply({ content: `This ticket is already claimed by <@${ticket.claimed_by}>.` });
    }

    await supabase.from('support_tickets').update({ claimed_by: user.id }).eq('channel_id', channel.id);

    const embed = new EmbedBuilder()
      .setTitle('Ticket Claimed')
      .setColor(0x57f287)
      .setDescription(`This ticket is now being handled by <@${user.id}>.`);

    await interaction.editReply({ embeds: [embed] });
  }
};