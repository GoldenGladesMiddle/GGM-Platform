const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('View official administrative notes on your profile'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const { data: notes, error } = await supabase
      .from('student_notes')
      .select('*')
      .eq('user_id', interaction.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return interaction.editReply({ content: 'Failed to retrieve notes record from database.' });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Administrative Notes — ${interaction.user.username}`)
      .setColor(0x3498db)
      .setTimestamp();

    if (!notes || notes.length === 0) {
      embed.setDescription('📋 No administrative notes found on your account.');
    } else {
      embed.setDescription(`Found **${notes.length}** note(s):`);
      notes.forEach((note, idx) => {
        const date = new Date(note.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        embed.addFields({
          name: `#${idx + 1} — ${date}`,
          value: `${note.note_text}`
        });
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};