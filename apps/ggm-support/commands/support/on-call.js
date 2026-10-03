// on-call.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('on-call')
    .setDescription('Labels you as on call, to be added and pinged in all new tickets.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const { user, guildId } = interaction;
    await interaction.deferReply({ ephemeral: true });

    const { data: existing } = await supabase.from('support_on_call').select('*').eq('user_id', user.id).single();

    if (existing) {
      await supabase.from('support_on_call').delete().eq('user_id', user.id);
      return interaction.editReply({ content: '🔴 You are no longer **On-Call**.' });
    } else {
      await supabase.from('support_on_call').insert({ user_id: user.id, guild_id: guildId });
      return interaction.editReply({ content: '🟢 You are now **On-Call**! You will be added to all new tickets.' });
    }
  }
};