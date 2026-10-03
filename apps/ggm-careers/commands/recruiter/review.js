const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('review')
    .setDescription('Fetches a brief summary and direct hyperlink to applicant profile in dashboard (Recruiter)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(opt => opt.setName('application_id').setDescription('Application ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const appId = interaction.options.getString('application_id');

    const { data: app, error } = await supabase
      .from('careers_applications')
      .select('*, careers_jobs(title, department)')
      .eq('id', appId)
      .single();

    if (error || !app) {
      return interaction.editReply({ content: `No application found for ID \`${appId}\`.` });
    }

    const dashboardUrl = `https://careers.goldengladesms.org/admin/applications/${app.id}`;

    const embed = new EmbedBuilder()
      .setTitle(`Application Review — ${app.applicant_name}`)
      .setColor(0xf1c40f)
      .addFields(
        { name: 'Position', value: app.careers_jobs?.title || 'N/A', inline: true },
        { name: 'Roblox Username', value: app.roblox_username, inline: true },
        { name: 'Discord', value: `<@${app.discord_id}>`, inline: true },
        { name: 'Status', value: `**${app.status}**`, inline: true },
        { name: 'Full Profile Link', value: `[Open in Recruiter Dashboard](${dashboardUrl})` }
      )
      .setFooter({ text: `Application ID: ${app.id}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};