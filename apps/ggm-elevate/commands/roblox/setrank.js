const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup, getGroupRoles, setRankUser } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setrank')
    .setDescription('Sets a Roblox user to a specific rank by name or rank number.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rank')
        .setDescription('Target Role Name or Rank Number')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for rank change')
        .setRequired(false)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const rankQuery = interaction.options.getString('rank').trim();
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const currentRole = await getRoleInGroup(robloxId);
      const allRoles = await getGroupRoles();

      // Find matching role by Rank Number or Role Name (case-insensitive)
      const targetRole = allRoles.find(r => 
        String(r.rank) === rankQuery || r.name.toLowerCase() === rankQuery.toLowerCase()
      );

      if (!targetRole) {
        return interaction.editReply({ 
          content: `Could not find a group role matching \`${rankQuery}\`. Please enter a valid Role Name or Rank Number.` 
        });
      }

      await setRankUser(robloxId, targetRole.id);

      await supabase.from('elevate_rank_logs').insert({
        executor_discord_id: interaction.user.id,
        target_roblox_id: robloxId,
        target_roblox_username: username,
        action: 'SETRANK',
        old_rank: currentRole.name,
        new_rank: targetRole.name,
        reason
      });

      const embed = new EmbedBuilder()
        .setTitle('Rank Updated')
        .setColor(0x3498db)
        .addFields(
          { name: 'Target User', value: username, inline: true },
          { name: 'Old Rank', value: currentRole.name, inline: true },
          { name: 'New Rank', value: `${targetRole.name} (Rank ${targetRole.rank})`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Updated By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to set rank for \`${username}\`: ${err.message}` });
    }
  }
};