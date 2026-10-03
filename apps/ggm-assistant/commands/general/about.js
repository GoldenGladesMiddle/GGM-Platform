const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Tells you information about the GGM Assistant bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('About GGM Assistant')
      .setColor(0x2b2d31)
      .setDescription(
        '**GGM Assistant** is the core administrative and moderation bot for **Golden Glades Middle**.\n\n' +
        'It handles community moderation, student disciplinary tracking (warnings, suspensions, notes), ' +
        'and administrative announcements.'
      )
      .addFields(
        { name: 'Developer', value: 'Golden Glades Middle Tech Team', inline: true },
        { name: 'Version', value: 'v1.0.0', inline: true },
        { name: 'Environment', value: 'Node.js / Discord.js v14', inline: true }
      )
      .setFooter({ text: 'Golden Glades Middle • GGM Assistant' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};