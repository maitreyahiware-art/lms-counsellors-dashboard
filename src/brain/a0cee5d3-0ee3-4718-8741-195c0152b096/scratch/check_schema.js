
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase.from('simulation_logs').select('*').limit(1);
    if (error) {
        console.error("Schema check error:", error.message);
    } else {
        console.log("COLUMNS:", Object.keys(data[0] || {}).join(', '));
    }
}

checkSchema();
