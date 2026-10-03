const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Ban duration (e.g. 7d, Permanent)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ content: 'Unable to ban this user. Check role permissions hierarchy.', ephemeral: true });
    }

    // Direct Message Notification
    const dmEmbed = new EmbedBuilder()
      .setTitle('Notice of Ban — Golden Glades Middle')
      .setColor(0xed4245)
      .addFields(
        { name: 'Duration', value: duration, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);

    await interaction.guild.members.ban(targetUser.id, { reason: `[${duration}] ${reason}` });

    // Log to Supabase
    await supabase.from('student_suspensions').insert({
      user_id: targetUser.id,
      moderator_id: interaction.user.id,
      duration: duration,
      reason: reason
    });

    await interaction.reply({ content: `Successfully banned **${targetUser.tag}** (${duration}) for: *${reason}*` });
  }
};