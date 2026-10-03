const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unclaim')
    .setDescription('Removes the claim on the current ticket (Staff)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const { channel } = interaction;
    await interaction.deferReply();

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('channel_id', channel.id)
      .single();

    if (!ticket) {
      return interaction.editReply({ content: 'This channel is not an active support ticket.' });
    }

    if (!ticket.claimed_by) {
      return interaction.editReply({ content: 'This ticket is not currently claimed.' });
    }

    await supabase
      .from('support_tickets')
      .update({ claimed_by: null })
      .eq('channel_id', channel.id);

    const embed = new EmbedBuilder()
      .setTitle('Ticket Unclaimed')
      .setColor(0xf1c40f)
      .setDescription('The claim on this ticket has been removed. Any available staff member can now claim it.');

    await interaction.editReply({ embeds: [embed] });
  }
};