const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unpban')
    .setDescription('Removes a permanent ban for a Roblox user.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unbanning')
        .setRequired(false)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const { data, error } = await supabase
        .from('elevate_pbans')
        .delete()
        .eq('roblox_id', robloxId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return interaction.editReply({ content: `\`${username}\` is not currently in the PBan database.` });
      }

      const embed = new EmbedBuilder()
        .setTitle('Permanent Ban Lifted')
        .setColor(0x57f287)
        .addFields(
          { name: 'User Unbanned', value: `${username} (\`${robloxId}\`)`, inline: true },
          { name: 'Reason', value: reason },
          { name: 'Unbanned By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to remove permanent ban.' });
    }
  }
};