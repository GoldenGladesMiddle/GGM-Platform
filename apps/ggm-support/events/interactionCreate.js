const { 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle 
} = require('discord.js');
const supabase = require('../utils/supabase');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // -------------------------------------------------------------
    // 1. BUTTON CLICK HANDLERS -> SHOW MODAL
    // -------------------------------------------------------------
    if (interaction.isButton()) {
      const { customId, user } = interaction;

      // Check Blacklist
      const { data: blacklisted } = await supabase
        .from('support_blacklists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (blacklisted && ['ticket_general', 'ticket_appeal', 'ticket_report'].includes(customId)) {
        return interaction.reply({ content: '⛔ You are currently blacklisted from creating support tickets.', ephemeral: true });
      }

      // Button 1: General Questions
      if (customId === 'ticket_general') {
        const modal = new ModalBuilder().setCustomId('modal_general').setTitle('General Questions');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox_username')
              .setLabel('Roblox Username')
              .setPlaceholder('Enter your username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('group_rank')
              .setLabel('Group Rank')
              .setPlaceholder('Enter your current rank')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reason')
              .setLabel('Reason')
              .setPlaceholder('Please put the reason why you are contacting support.')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

        return await interaction.showModal(modal);
      }

      // Button 2: Appeal Ban
      if (customId === 'ticket_appeal') {
        const modal = new ModalBuilder().setCustomId('modal_appeal').setTitle('Appeal Ban');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('roblox_username')
              .setLabel('Roblox Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('group_rank')
              .setLabel('Group Rank (Before Ban)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('ban_reason')
              .setLabel('Reason for Ban')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('explanation')
              .setLabel('Your Explanation')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('why_unban')
              .setLabel('Why Should We Unban You?')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

        return await interaction.showModal(modal);
      }

// Button 3: Player Report
      if (customId === 'ticket_report') {
        const modal = new ModalBuilder().setCustomId('modal_report').setTitle('Player Report');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('reported_users')
              .setLabel('Username(s)')
              .setPlaceholder('Please provide the username of the player(s) you are reporting.')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('rule_broken')
              .setLabel('What rule or behavior are you reporting?')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('evidence')
              .setLabel('Do you have evidence?')
              .setPlaceholder('Yes or No (If Yes, please insert when ticket opens.)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

        return await interaction.showModal(modal);
      }
    }

    // -------------------------------------------------------------
    // 2. MODAL SUBMISSIONS -> CREATE TICKET CHANNEL
    // -------------------------------------------------------------
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_')) {
        await interaction.deferReply({ ephemeral: true });

        const { guild, user, fields, customId } = interaction;
        let typeName = 'General';
        let embedColor = 0x3498db;
        let embedFields = [];

        if (customId === 'modal_general') {
          typeName = 'General Questions';
          embedColor = 0x3498db;
          embedFields = [
            { name: 'Roblox Username', value: fields.getTextInputValue('roblox_username'), inline: true },
            { name: 'Group Rank', value: fields.getTextInputValue('group_rank'), inline: true },
            { name: 'Reason', value: fields.getTextInputValue('reason') }
          ];
        } else if (customId === 'modal_appeal') {
          typeName = 'Ban Appeal';
          embedColor = 0xed4245;
          embedFields = [
            { name: 'Roblox Username', value: fields.getTextInputValue('roblox_username'), inline: true },
            { name: 'Previous Rank', value: fields.getTextInputValue('group_rank'), inline: true },
            { name: 'Ban Reason', value: fields.getTextInputValue('ban_reason') },
            { name: 'Explanation', value: fields.getTextInputValue('explanation') },
            { name: 'Why Unban', value: fields.getTextInputValue('why_unban') }
          ];
        } else if (customId === 'modal_report') {
          typeName = 'Player Report';
          embedColor = 0xe67e22;
          embedFields = [
            { name: 'Reported Player(s)', value: fields.getTextInputValue('reported_users'), inline: true },
            { name: 'Rule Violation', value: fields.getTextInputValue('rule_broken') },
            { name: 'Evidence', value: fields.getTextInputValue('evidence') }
          ];
        }

        const channelName = `${customId.replace('modal_', '')}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const permissionOverwrites = [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] }
        ];

        const { data: onCallStaff } = await supabase.from('support_on_call').select('user_id').eq('guild_id', guild.id);
        let pings = `<@${user.id}>`;

        if (onCallStaff && onCallStaff.length > 0) {
          onCallStaff.forEach(staff => {
            permissionOverwrites.push({
              id: staff.user_id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
            });
            pings += ` <@${staff.user_id}>`;
          });
        }

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          permissionOverwrites
        });

        await supabase.from('support_tickets').insert({
          channel_id: ticketChannel.id,
          guild_id: guild.id,
          user_id: user.id,
          ticket_type: typeName,
          status: 'OPEN'
        });

        const welcomeEmbed = new EmbedBuilder()
          .setTitle(`Ticket: ${typeName}`)
          .setColor(embedColor)
          .setDescription(`Welcome <@${user.id}>! A member of our support team will be with you shortly. Use the buttons below or commands to manage this ticket.`)
          .addFields(embedFields)
          .setFooter({ text: 'Powered by GGM Assistant' })
          .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('cmd_claim').setLabel('Claim').setEmoji('📌').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('cmd_close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ content: pings, embeds: [welcomeEmbed], components: [closeRow] });
        await interaction.editReply({ content: `Ticket created: ${ticketChannel}` });
      }
    }
  }
};