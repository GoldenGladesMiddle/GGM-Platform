const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GROUP_ID = process.env.ROBLOX_GROUP_ID || '8284465';
const API_KEY = process.env.ROBLOX_CLOUD_KEY;
const BLOXLINK_KEY = process.env.BLOXLINK_API_KEY;

/**
 * Resolve a Roblox Username to a User ID
 */
async function getIdFromUsername(username) {
  const response = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
  });
  const data = await response.json();
  return data.data && data.data[0] ? data.data[0].id : null;
}

/**
 * Fetch all roles in the Roblox group sorted by rank ascending (0 to 255)
 */
async function getGroupRoles() {
  const response = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}/roles`);
  const data = await response.json();
  if (!data.roles) return [];
  return data.roles.sort((a, b) => a.rank - b.rank);
}

/**
 * Get a user's current role inside the Roblox group
 */
async function getRoleInGroup(robloxId) {
  const response = await fetch(`https://groups.roblox.com/v1/users/${robloxId}/groups/roles`);
  const data = await response.json();
  if (!data.data) return { rank: 0, name: 'Guest', id: 0 };
  const group = data.data.find(g => g.group.id === parseInt(GROUP_ID));
  return group ? { rank: group.role.rank, name: group.role.name, id: group.role.id } : { rank: 0, name: 'Guest', id: 0 };
}

/**
 * Set a user's rank using Roblox Open Cloud API v2
 */
async function setRankUser(robloxId, roleId) {
  if (!API_KEY) throw new Error('ROBLOX_CLOUD_KEY is missing in .env');

  const response = await fetch(
    `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/memberships/${robloxId}`,
    {
      method: 'PATCH',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: `groups/${GROUP_ID}/roles/${roleId}`
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Roblox API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Bloxlink v4: Trigger user sync/update in server
 * POST https://api.blox.link/v4/public/guilds/:serverID/update-user/:userID
 */
async function updateBloxlinkUser(guildId, discordId) {
  try {
    const response = await fetch(
      `https://api.blox.link/v4/public/guilds/${guildId}/update-user/${discordId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': BLOXLINK_KEY || ''
        }
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('Bloxlink v4 Update Error:', err);
    return null;
  }
}

/**
 * Bloxlink v4: Fetch linked Roblox ID from Discord ID
 * GET https://api.blox.link/v4/public/users/:userID
 */
async function getRobloxIdFromDiscord(discordId) {
  try {
    const response = await fetch(`https://api.blox.link/v4/public/users/${discordId}`, {
      headers: {
        'Authorization': BLOXLINK_KEY || ''
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.robloxID || null;
  } catch (err) {
    console.error('Bloxlink User Lookup Error:', err);
    return null;
  }
}

module.exports = {
  getIdFromUsername,
  getGroupRoles,
  getRoleInGroup,
  setRankUser,
  updateBloxlinkUser,
  getRobloxIdFromDiscord
};