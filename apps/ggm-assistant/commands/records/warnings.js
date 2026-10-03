const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View your active and past warnings'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data: warnings, error } = await supabase
      .from('student_warnings')
      .select('*')
      .eq('user_id', interaction.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return interaction.editReply({ content: 'Failed to retrieve warnings record from database.' });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Warnings Record — ${interaction.user.username}`)
      .setColor(warnings && warnings.length > 0 ? 0xe67e22 : 0x2ecc71)
      .setTimestamp();

    if (!warnings || warnings.length === 0) {
      embed.setDescription('✅ You have no recorded warnings.');
    } else {
      embed.setDescription(`You currently have **${warnings.length}** warning(s) on file:`);
      warnings.forEach((warn, idx) => {
        const date = new Date(warn.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        embed.addFields({
          name: `#${idx + 1} — ${date}`,
          value: `**Reason:** ${warn.reason}\n**Issued By:** <@${warn.moderator_id}>`
        });
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};