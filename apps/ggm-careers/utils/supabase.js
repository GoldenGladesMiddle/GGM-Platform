const { createClient } = require('@supabase/supabase-js');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;