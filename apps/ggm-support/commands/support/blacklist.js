// blacklist.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Toggles whether a user is allowed to interact with the bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.deferReply();

    const { data: existing } = await supabase.from('support_blacklists').select('*').eq('user_id', target.id).single();

    if (existing) {
      await supabase.from('support_blacklists').delete().eq('user_id', target.id);
      return interaction.editReply({ content: `✅ Removed <@${target.id}> from the support blacklist.` });
    } else {
      await supabase.from('support_blacklists').insert({ user_id: target.id, executor_id: interaction.user.id, reason });
      return interaction.editReply({ content: `⛔ Blacklisted <@${target.id}> from opening tickets.` });
    }
  }
};