const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup, getGroupRoles, setRankUser } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fire')
    .setDescription('Fires a user from staff and resets them to Guest/Lowest rank.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for termination')
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const currentRole = await getRoleInGroup(robloxId);
      const allRoles = await getGroupRoles();

      // Find lowest non-guest role (Rank 1) or Guest (Rank 0)
      const lowestRole = allRoles.find(r => r.rank === 1) || allRoles[0];

      await setRankUser(robloxId, lowestRole.id);

      await supabase.from('elevate_rank_logs').insert({
        executor_discord_id: interaction.user.id,
        target_roblox_id: robloxId,
        target_roblox_username: username,
        action: 'FIRE',
        old_rank: currentRole.name,
        new_rank: lowestRole.name,
        reason
      });

      const embed = new EmbedBuilder()
        .setTitle('Staff Member Fired')
        .setColor(0xed4245)
        .addFields(
          { name: 'Target User', value: username, inline: true },
          { name: 'Previous Rank', value: currentRole.name, inline: true },
          { name: 'New Rank', value: lowestRole.name, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Fired By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to fire \`${username}\`: ${err.message}` });
    }
  }
};