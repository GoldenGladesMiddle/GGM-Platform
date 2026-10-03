const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Prevents a user from applying to Golden Glades (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for blacklist').setRequired(true))
    .addUserOption(opt => opt.setName('member').setDescription('Discord member').setRequired(false))
    .addStringOption(opt => opt.setName('roblox_username').setDescription('Roblox Username').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const reason = interaction.options.getString('reason');
    const targetUser = interaction.options.getUser('member');
    const robloxUsername = interaction.options.getString('roblox_username');

    if (!targetUser && !robloxUsername) {
      return interaction.editReply({ content: 'Please provide either a Discord member or a Roblox username.' });
    }

    const { error } = await supabase.from('careers_blacklists').insert({
      discord_id: targetUser ? targetUser.id : null,
      roblox_username: robloxUsername || null,
      reason: reason,
      blacklisted_by: interaction.user.id
    });

    if (error) {
      console.error(error);
      return interaction.editReply({ content: 'Failed to blacklist user in database.' });
    }

    const embed = new EmbedBuilder()
      .setTitle('⛔ Candidate Blacklisted')
      .setColor(0xed4245)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Discord User', value: targetUser ? `<@${targetUser.id}>` : 'N/A', inline: true },
        { name: 'Roblox Username', value: robloxUsername || 'N/A', inline: true }
      )
      .setFooter({ text: `Action taken by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};