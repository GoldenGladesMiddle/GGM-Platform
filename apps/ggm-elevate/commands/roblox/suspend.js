const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suspend')
    .setDescription('Places a staff member on official suspension.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Suspension duration in days')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for suspension')
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    const days = interaction.options.getInteger('days');
    const reason = interaction.options.getString('reason');

    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const currentRole = await getRoleInGroup(robloxId);

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + days);

      const { data, error } = await supabase
        .from('elevate_suspensions')
        .insert({
          roblox_id: robloxId,
          roblox_username: username,
          executor_discord_id: interaction.user.id,
          reason,
          duration: `${days} Days`,
          ends_at: endsAt.toISOString(),
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (error) throw error;

      const embed = new EmbedBuilder()
        .setTitle('Staff Member Suspended')
        .setColor(0xe67e22)
        .addFields(
          { name: 'Target User', value: username, inline: true },
          { name: 'Current Rank', value: currentRole.name, inline: true },
          { name: 'Duration', value: `${days} Day(s)`, inline: true },
          { name: 'Ends On', value: `<t:${Math.floor(endsAt.getTime() / 1000)}:F>` },
          { name: 'Reason', value: reason },
          { name: 'Suspended By', value: `<@${interaction.user.id}>` }
        )
        .setFooter({ text: `Suspension Case ID: #${data.id}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to suspend \`${username}\`: ${err.message}` });
    }
  }
};