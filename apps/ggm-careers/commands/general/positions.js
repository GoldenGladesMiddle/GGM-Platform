const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('positions')
    .setDescription('Fetches a list of currently open positions from the website job board'),

  async execute(interaction) {
    await interaction.deferReply();

    const { data: jobs, error } = await supabase
      .from('careers_jobs')
      .select('*')
      .eq('is_open', true)
      .order('created_at', { ascending: false });

    if (error || !jobs || jobs.length === 0) {
      return interaction.editReply({ content: 'There are currently no open positions on the job board.' });
    }

    const embed = new EmbedBuilder()
      .setTitle('💼 Golden Glades Middle — Open Positions')
      .setColor(0x2ecc71)
      .setDescription('Explore current employment opportunities at GGM. Apply directly at [careers.goldengladesms.org](https://careers.goldengladesms.org).\n')
      .setFooter({ text: 'Golden Glades Middle Human Resources' })
      .setTimestamp();

    jobs.forEach(job => {
      embed.addFields({
        name: `• ${job.title} (${job.department})`,
        value: `${job.description.substring(0, 120)}...\n[View Job Details & Apply](https://careers.goldengladesms.org/jobs/${job.id})`
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
};