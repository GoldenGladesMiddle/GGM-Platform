const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suspension-lookup')
    .setDescription('Look up active or past suspensions for a staff member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox Username')
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    await interaction.deferReply();

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const { data: suspensions, error } = await supabase
        .from('elevate_suspensions')
        .select('*')
        .eq('roblox_id', robloxId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!suspensions || suspensions.length === 0) {
        return interaction.editReply({ content: `No suspension records found for \`${username}\`.` });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Suspension History for ${username}`)
        .setColor(0x3498db)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`);

      suspensions.forEach((s, index) => {
        if (index < 5) {
          const statusBadge = s.status === 'ACTIVE' ? '🔴 ACTIVE' : '🟢 EXPIRED/INACTIVE';
          embed.addFields({
            name: `Case #${s.id} [${statusBadge}]`,
            value: `**Reason:** ${s.reason}\n**Duration:** ${s.duration}\n**Ends:** <t:${Math.floor(new Date(s.ends_at).getTime() / 1000)}:R>\n**Issued By:** <@${s.executor_discord_id}>`
          });
        }
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to lookup suspensions: ${err.message}` });
    }
  }
};