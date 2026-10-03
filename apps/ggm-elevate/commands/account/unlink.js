const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlinks your Discord account from your Roblox account.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { data, error } = await supabase
        .from('elevate_linked_accounts')
        .delete()
        .eq('discord_id', interaction.user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return interaction.editReply({ content: 'You do not have a linked Roblox account to unlink.' });
      }

      const embed = new EmbedBuilder()
        .setTitle('Account Unlinked')
        .setColor(0xed4245)
        .setDescription(`Successfully unlinked Roblox account \`${data[0].roblox_username}\` from your Discord account.`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to unlink account.' });
    }
  }
};