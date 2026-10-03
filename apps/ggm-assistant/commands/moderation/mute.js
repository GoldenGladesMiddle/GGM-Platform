const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function parseDuration(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const mults = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * mults[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute (timeout) a member so they cannot type (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Timeout duration (e.g. 10m, 2h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs > 28 * 86400000) {
      return interaction.reply({ content: 'Invalid duration format. Use e.g. `10m`, `2h`, `1d` (Max 28 days).', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'User is not in the server.', ephemeral: true });
    }

    await member.timeout(durationMs, reason);
    await interaction.reply({ content: `Muted **${targetUser.tag}** for **${durationStr}**. Reason: *${reason}*` });
  }
};