const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup, getGroupRoles, setRankUser } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Demotes a user in the Roblox group.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for demotion')
        .setRequired(false)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const currentRole = await getRoleInGroup(robloxId);
      const allRoles = await getGroupRoles();

      // Filter all roles lower than the user's current rank (excluding Guest / Rank 0)
      const lowerRoles = allRoles.filter(r => r.rank < currentRole.rank && r.rank > 0);
      const previousRole = lowerRoles[lowerRoles.length - 1];

      if (!previousRole) {
        return interaction.editReply({ content: `\`${username}\` is already at the lowest group rank or cannot be demoted further.` });
      }

      // Update rank via Roblox Open Cloud API
      await setRankUser(robloxId, previousRole.id);

      // Record to Supabase
      await supabase.from('elevate_rank_logs').insert({
        executor_discord_id: interaction.user.id,
        target_roblox_id: robloxId,
        target_roblox_username: username,
        action: 'DEMOTE',
        old_rank: currentRole.name,
        new_rank: previousRole.name,
        reason
      });

      const embed = new EmbedBuilder()
        .setTitle('User Demoted')
        .setColor(0xed4245)
        .addFields(
          { name: 'Target User', value: username, inline: true },
          { name: 'Old Rank', value: currentRole.name, inline: true },
          { name: 'New Rank', value: previousRole.name, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Demoted By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to demote \`${username}\`: ${err.message}` });
    }
  }
};