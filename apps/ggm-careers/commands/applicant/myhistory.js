const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('myhistory')
    .setDescription('Displays your application history, past roles applied for, dates, and final outcomes'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data: apps, error } = await supabase
      .from('careers_applications')
      .select('*, careers_jobs(title)')
      .eq('discord_id', interaction.user.id)
      .order('created_at', { ascending: false });

    if (error || !apps || apps.length === 0) {
      return interaction.editReply({ content: 'You have no recorded application history.' });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Application History - ${interaction.user.username}`)
      .setColor(0x00a8ff)
      .setFooter({ text: 'Golden Glades Middle Careers' })
      .setTimestamp();

    apps.forEach((app, idx) => {
      const date = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const jobTitle = app.careers_jobs?.title || 'Unknown Role';
      
      embed.addFields({
        name: `#${idx + 1} - ${jobTitle} (${app.status})`,
        value: `**Applied:** ${date} | **ID:** \`${app.id}\``
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
};