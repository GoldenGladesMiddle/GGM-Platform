const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Gives a snapshot of the recruitment pipeline (Recruiter)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data: apps, error } = await supabase.from('careers_applications').select('status');

    if (error || !apps) {
      return interaction.editReply({ content: 'Failed to retrieve recruitment pipeline stats.' });
    }

    const total = apps.length;
    const pending = apps.filter(a => a.status === 'PENDING').length;
    const interviewing = apps.filter(a => a.status === 'INTERVIEWING').length;
    const accepted = apps.filter(a => a.status === 'ACCEPTED').length;
    const rejected = apps.filter(a => a.status === 'REJECTED').length;

    const embed = new EmbedBuilder()
      .setTitle('📊 Recruitment Pipeline Snapshot')
      .setColor(0x9b59b6)
      .addFields(
        { name: 'Total Applications', value: `${total}`, inline: false },
        { name: '⏳ Pending Review', value: `${pending}`, inline: true },
        { name: '🗣️ Interviewing', value: `${interviewing}`, inline: true },
        { name: '✅ Accepted', value: `${accepted}`, inline: true },
        { name: '❌ Rejected', value: `${rejected}`, inline: true }
      )
      .setFooter({ text: 'Golden Glades Middle Human Resources' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};