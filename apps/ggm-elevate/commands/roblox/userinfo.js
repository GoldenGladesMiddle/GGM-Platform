const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getIdFromUsername, getRoleInGroup } = require('../../utils/roblox');
const supabase = require('../../utils/supabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Fetches detailed Discord & Roblox information about a user.')
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
      // 1. Fetch Roblox Basic Profile
      const robloxId = await getIdFromUsername(username);
      if (!robloxId) return interaction.editReply({ content: `Could not find Roblox user \`${username}\`.` });

      const role = await getRoleInGroup(robloxId);

      // Fetch Roblox Account Details (Created Date)
      const userRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
      const userData = await userRes.json();
      const accountCreated = userData.created ? `<t:${Math.floor(new Date(userData.created).getTime() / 1000)}:D>` : 'Unknown';

      // Fetch Past Usernames
      const historyRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}/username-history?pageSize=10`);
      const historyData = await historyRes.json();
      const pastUsernames = historyData.data && historyData.data.length > 0 
        ? historyData.data.map(u => u.name).join(', ') 
        : 'None';

      // Fetch Roblox Group Join Date
      const groupRes = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
      const groupData = await groupRes.json();
      const groupId = process.env.ROBLOX_GROUP_ID || '8284465';
      const userGroupInfo = groupData.data ? groupData.data.find(g => g.group.id === parseInt(groupId)) : null;
      const groupJoined = userGroupInfo && userGroupInfo.created 
        ? `<t:${Math.floor(new Date(userGroupInfo.created).getTime() / 1000)}:D>` 
        : 'Not in Group';

      // 2. Fetch Supabase Linked Discord Info
      const { data: linkData } = await supabase
        .from('elevate_linked_accounts')
        .select('discord_id')
        .eq('roblox_id', robloxId)
        .single();

      let discordTag = 'Not Linked';
      let discordIdStr = 'N/A';
      let serverJoined = 'N/A';
      let discordRoles = 'N/A';

      if (linkData && linkData.discord_id) {
        discordIdStr = linkData.discord_id;
        try {
          const member = await interaction.guild.members.fetch(linkData.discord_id);
          if (member) {
            discordTag = `@${member.user.username}`;
            serverJoined = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>` : 'Unknown';
            discordRoles = member.roles.cache
              .filter(r => r.name !== '@everyone')
              .map(r => `<@&${r.id}>`)
              .join(', ') || 'No custom roles';
          }
        } catch {
          discordTag = `<@${linkData.discord_id}> (Not in server)`;
        }
      }

      // Check Ban Status
      const { data: banData } = await supabase
        .from('elevate_pbans')
        .select('*')
        .eq('roblox_id', robloxId)
        .single();

      const embed = new EmbedBuilder()
        .setTitle(`User Lookup: ${userData.name || username}`)
        .setURL(`https://www.roblox.com/users/${robloxId}/profile`)
        .setColor(banData ? 0xed4245 : 0x5865f2)
        .setThumbnail(`https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`)
        .addFields(
          { name: '👤 Discord Account', value: `**Tag:** ${discordTag}\n**ID:** \`${discordIdStr}\`\n**Joined Server:** ${serverJoined}`, inline: false },
          { name: '🛡️ Discord Roles', value: discordRoles, inline: false },
          { name: '🟥 Roblox Info', value: `**Username:** ${userData.name || username}\n**User ID:** \`${robloxId}\`\n**Account Created:** ${accountCreated}\n**Past Usernames:** ${pastUsernames}`, inline: false },
          { name: '🏫 Group Details', value: `**Group Role:** [Rank ${role.rank}] ${role.name}\n**Joined Group:** ${groupJoined}\n**Ban Status:** ${banData ? '⛔ Permanently Banned' : '✅ Clear'}`, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `Failed to fetch profile info: ${err.message}` });
    }
  }
};