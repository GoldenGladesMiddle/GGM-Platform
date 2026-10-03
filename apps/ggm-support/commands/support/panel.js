const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Creates a ticket panel to allow users to open a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Open a Ticket!')
      .setColor(0x0000FF)
      .setDescription(
        '📚 **Welcome to Golden Glades Middle Support!**\n\n' +
        'Need help? Use the buttons below to select the type of support you need. 🛠️'
      )
      .setFooter({ text: 'Powered by GGM Assistant' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_general')
        .setLabel('General Questions')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId('ticket_appeal')
        .setLabel('Appeal Ban')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('ticket_report')
        .setLabel('Player Report')
        .setEmoji('🚨')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Support ticket panel deployed!', ephemeral: true });
  }
};