const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Displays information about GGM Elevate.'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('GGM Elevate System')
      .setDescription('GGM Elevate is the official management and moderation automation bot for Golden Glades Middle.')
      .setColor(0x5865f2)
      .addFields(
        { name: 'Developer', value: 'GGM Platform Engineering', inline: true },
        { name: 'Version', value: 'v1.0.0', inline: true },
        { name: 'Database', value: 'Supabase PostgreSQL', inline: true },
        { name: 'Roblox Integration', value: 'Open Cloud API v2', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};