const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Tells you information about the GGM Careers bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('About GGM Careers')
      .setColor(0x00a8ff)
      .setDescription(
        '**GGM Careers** connects Discord to the official [Golden Glades Middle Careers Portal](https://careers.goldengladesms.org).\n\n' +
        'It notifies members of new job openings, tracks candidate pipelines, manages applicant linking, and delivers direct status updates when applications are reviewed.'
      )
      .addFields(
        { name: 'Portal', value: 'https://careers.goldengladesms.org', inline: true },
        { name: 'Version', value: 'v2.0.0', inline: true }
      )
      .setFooter({ text: 'Golden Glades Middle Human Resources' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};