const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getIdFromUsername } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Links your Discord account to your Roblox account.')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Roblox Username')
        .setRequired(true)
    ),
  async execute(interaction) {
    const username = interaction.options.getString('username');
    await interaction.deferReply({ ephemeral: true });

    try {
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) {
        return interaction.editReply({ content: `Could not find a Roblox account named \`${username}\`.` });
      }

      const { data, error } = await supabase
        .from('elevate_linked_accounts')
        .upsert({
          discord_id: interaction.user.id,
          roblox_id: robloxId,
          roblox_username: username
        })
        .select()
        .single();

      if (error) throw error;

      const embed = new EmbedBuilder()
        .setTitle('Account Linked Successfully')
        .setColor(0x57f287)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`)
        .addFields(
          { name: 'Discord User', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Roblox Username', value: username, inline: true },
          { name: 'Roblox ID', value: String(robloxId), inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to link account to database.' });
    }
  }
};