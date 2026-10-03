const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup, getGroupRoles, setRankUser } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Promotes a user in the Roblox group.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for promotion')
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

      // Find the next role in the list with a higher rank number
      const nextRole = allRoles.find(r => r.rank > currentRole.rank);

      if (!nextRole) {
        return interaction.editReply({ content: `\`${username}\` is already at the highest rank or cannot be promoted further.` });
      }

      // Pass the unique Open Cloud Role ID (not the rank number)
      await setRankUser(robloxId, nextRole.id);

      await supabase.from('elevate_rank_logs').insert({
        executor_discord_id: interaction.user.id,
        target_roblox_id: robloxId,
        target_roblox_username: username,
        action: 'PROMOTE',
        old_rank: currentRole.name,
        new_rank: nextRole.name,
        reason
      });

      const embed = new EmbedBuilder()
        .setTitle('User Promoted')
        .setColor(0x57f287)
        .addFields(
          { name: 'Target User', value: username, inline: true },
          { name: 'Old Rank', value: currentRole.name, inline: true },
          { name: 'New Rank', value: nextRole.name, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Promoted By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to promote \`${username}\`: ${err.message}` });
    }
  }
};