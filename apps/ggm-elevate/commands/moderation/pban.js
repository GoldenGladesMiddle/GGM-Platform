const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pban')
    .setDescription('Permanently bans a user across Discord and Roblox games.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for permanent ban')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('discord_user')
        .setDescription('Optional associated Discord account')
        .setRequired(false)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const reason = interaction.options.getString('reason');
    const discordUser = interaction.options.getUser('discord_user');

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      await supabase.from('elevate_pbans').upsert({
        roblox_id: robloxId,
        roblox_username: username,
        discord_id: discordUser ? discordUser.id : null,
        executor_discord_id: interaction.user.id,
        reason
      });

      if (discordUser) {
        try {
          await interaction.guild.members.ban(discordUser.id, { reason: `Elevate PBan: ${reason}` });
        } catch (e) {
          console.warn(`Could not ban Discord member ${discordUser.id}:`, e.message);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle('Permanent Ban Issued')
        .setColor(0xed4245)
        .addFields(
          { name: 'Target User', value: `${username} (\`${robloxId}\`)`, inline: true },
          { name: 'Discord User', value: discordUser ? `<@${discordUser.id}>` : 'None linked', inline: true },
          { name: 'Reason', value: reason },
          { name: 'Banned By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to issue permanent ban.' });
    }
  }
};