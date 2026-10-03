const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Displays application history table for a specific candidate (Recruiter)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('member').setDescription('Discord member').setRequired(false))
    .addStringOption(opt => opt.setName('roblox_username').setDescription('Roblox username').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('member');
    const robloxUsername = interaction.options.getString('roblox_username');

    if (!targetUser && !robloxUsername) {
      return interaction.editReply({ content: 'Provide either a Discord member or Roblox username.' });
    }

    let query = supabase.from('careers_applications').select('*, careers_jobs(title)');
    if (targetUser) query = query.eq('discord_id', targetUser.id);
    else if (robloxUsername) query = query.ilike('roblox_username', robloxUsername);

    const { data: apps, error } = await query.order('created_at', { ascending: false });

    if (error || !apps || apps.length === 0) {
      return interaction.editReply({ content: 'No application history found for this candidate.' });
    }

    const targetName = targetUser ? targetUser.username : robloxUsername;

    const embed = new EmbedBuilder()
      .setTitle(`Candidate History - ${targetName}`)
      .setColor(0x3498db)
      .setTimestamp();

    apps.forEach((app, idx) => {
      const date = new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const jobTitle = app.careers_jobs?.title || 'Unknown Position';

      embed.addFields({
        name: `#${idx + 1} - ${jobTitle} [${app.status}]`,
        value: `**Date:** ${date} | **ID:** \`${app.id}\``
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
};