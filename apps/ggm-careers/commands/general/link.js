const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('node:crypto');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Generates a unique, one-time token to link your Discord account to the website'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const { error } = await supabase.from('careers_link_tokens').insert({
      token,
      discord_id: interaction.user.id,
      expires_at: expiresAt
    });

    if (error) {
      console.error(error);
      return interaction.editReply({ content: 'Failed to generate linking token. Please try again.' });
    }

    const linkUrl = `https://careers.goldengladesms.org/link?token=${token}`;

    const embed = new EmbedBuilder()
      .setTitle('🔗 Link Discord Account')
      .setColor(0x00a8ff)
      .setDescription(
        `Click the button below or follow this link to finalize your account setup on the GGM Careers portal:\n\n` +
        `[**Connect to Careers Portal**](${linkUrl})\n\n` +
        `*This link expires in 15 minutes and can only be used once.*`
      )
      .setFooter({ text: 'Golden Glades Middle Careers' });

    await interaction.editReply({ embeds: [embed] });
  }
};