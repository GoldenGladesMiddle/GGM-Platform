const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suspensions')
    .setDescription('View your active and past suspensions'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data: suspensions, error } = await supabase
      .from('student_suspensions')
      .select('*')
      .eq('user_id', interaction.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return interaction.editReply({ content: 'Failed to retrieve suspensions record from database.' });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Suspension Record — ${interaction.user.username}`)
      .setColor(suspensions && suspensions.length > 0 ? 0xed4245 : 0x2ecc71)
      .setTimestamp();

    if (!suspensions || suspensions.length === 0) {
      embed.setDescription('✅ You have no recorded suspensions.');
    } else {
      embed.setDescription(`You currently have **${suspensions.length}** suspension entry/entries on file:`);
      suspensions.forEach((susp, idx) => {
        const date = new Date(susp.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        embed.addFields({
          name: `#${idx + 1} — ${date} (${susp.duration || 'N/A'})`,
          value: `**Reason:** ${susp.reason}\n**Issued By:** <@${susp.moderator_id}>`
        });
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};