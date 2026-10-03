const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Sends an official announcement message to a channel (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Target channel for announcement')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Announcement content')
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const messageText = interaction.options.getString('message');

    const embed = new EmbedBuilder()
      .setTitle('📢 Golden Glades Middle Announcement')
      .setColor(0x00a8ff)
      .setDescription(messageText)
      .setFooter({ text: `Posted by ${interaction.user.username}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `Announcement posted in ${channel}!`, ephemeral: true });
  }
};