const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Tells you information about the bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('About GGM Support')
      .setColor(0x3498db)
      .setDescription(
        '**GGM Support** is the official ticketing and assistance system for **Golden Glades Middle**.\n\n' +
        'It handles player reports, ban appeals, general inquiries, and real-time staff response routing.'
      )
      .addFields(
        { name: 'Developer', value: 'Golden Glades Middle Tech Team', inline: true },
        { name: 'System Version', value: 'v1.0.0', inline: true },
        { name: 'Framework', value: 'Discord.js v14', inline: true }
      )
      .setFooter({ text: 'Powered by goldengladesms.org' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};