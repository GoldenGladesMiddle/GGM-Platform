const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Returns the current status of a specific application')
    .addStringOption(opt =>
      opt.setName('application_id')
        .setDescription('Your Application ID')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const appId = interaction.options.getString('application_id');

    const { data: app, error } = await supabase
      .from('careers_applications')
      .select('*, careers_jobs(title, department)')
      .eq('id', appId)
      .single();

    if (error || !app) {
      return interaction.editReply({ content: `No application found with ID \`${appId}\`.` });
    }

    if (app.discord_id !== interaction.user.id) {
      return interaction.editReply({ content: '⛔ You can only check the status of your own applications.' });
    }

    const statusColors = {
      PENDING: 0xf1c40f,
      INTERVIEWING: 0x3498db,
      ACCEPTED: 0x2ecc71,
      REJECTED: 0xed4245
    };

    const embed = new EmbedBuilder()
      .setTitle(`Application Status — ${app.careers_jobs?.title || 'Position'}`)
      .setColor(statusColors[app.status] || 0x2b2d31)
      .addFields(
        { name: 'Application ID', value: `\`${app.id}\``, inline: true },
        { name: 'Current Status', value: `**${app.status}**`, inline: true },
        { name: 'Submitted On', value: new Date(app.created_at).toLocaleDateString('en-US'), inline: true }
      )
      .setFooter({ text: 'Golden Glades Middle Careers' });

    await interaction.editReply({ embeds: [embed] });
  }
};