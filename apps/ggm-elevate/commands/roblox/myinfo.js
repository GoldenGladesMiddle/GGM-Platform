const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRoleInGroup } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('myinfo')
    .setDescription('Displays your linked Discord & Roblox profile info.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Fetch Linked Account
      const { data: linkData } = await supabase
        .from('elevate_linked_accounts')
        .select('*')
        .eq('discord_id', interaction.user.id)
        .single();

      if (!linkData) {
        return interaction.editReply({ 
          content: 'You do not have a linked Roblox account. Use `/link <username>` to connect your account.' 
        });
      }

      const robloxId = linkData.roblox_id;

      // 2. Fetch Roblox Details
      const role = await getRoleInGroup(robloxId);

      const userRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
      const userData = await userRes.json();
      const accountCreated = userData.created ? `<t:${Math.floor(new Date(userData.created).getTime() / 1000)}:D>` : 'Unknown';

      const historyRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}/username-history?pageSize=10`);
      const historyData = await historyRes.json();
      const pastUsernames = historyData.data && historyData.data.length > 0 
        ? historyData.data.map(u => u.name).join(', ') 
        : 'None';

      const groupRes = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
      const groupData = await groupRes.json();
      const groupId = process.env.ROBLOX_GROUP_ID || '8284465';
      const userGroupInfo = groupData.data ? groupData.data.find(g => g.group.id === parseInt(groupId)) : null;
      const groupJoined = userGroupInfo && userGroupInfo.created 
        ? `<t:${Math.floor(new Date(userGroupInfo.created).getTime() / 1000)}:D>` 
        : 'Not in Group';

      // 3. Discord Member Details
      const member = interaction.member;
      const discordTag = `@${interaction.user.username}`;
      const discordIdStr = interaction.user.id;
      const serverJoined = member && member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>` : 'Unknown';
      const discordRoles = member && member.roles.cache
        ? member.roles.cache.filter(r => r.name !== '@everyone').map(r => `<@&${r.id}>`).join(', ') || 'No custom roles'
        : 'N/A';

      const embed = new EmbedBuilder()
        .setTitle(`Your Profile Information`)
        .setColor(0x57f287)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`)
        .addFields(
          { name: '👤 Discord Account', value: `**Tag:** ${discordTag}\n**ID:** \`${discordIdStr}\`\n**Joined Server:** ${serverJoined}`, inline: false },
          { name: '🛡️ Your Discord Roles', value: discordRoles, inline: false },
          { name: '🟥 Your Roblox Profile', value: `**Username:** ${userData.name || linkData.roblox_username}\n**User ID:** \`${robloxId}\`\n**Account Created:** ${accountCreated}\n**Past Usernames:** ${pastUsernames}`, inline: false },
          { name: '🏫 Group Details', value: `**Group Role:** [Rank ${role.rank}] ${role.name}\n**Joined Group:** ${groupJoined}`, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to retrieve your info.' });
    }
  }
};