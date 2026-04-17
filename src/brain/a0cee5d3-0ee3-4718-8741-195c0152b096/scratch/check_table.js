
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTable() {
    const { data, error } = await supabase.from('simulation_logs').select('id').limit(1);
    if (error) {
        console.error("Table check error:", error.message);
        if (error.message.includes('relation "simulation_logs" does not exist')) {
            console.log("TABLE_MISSING");
        }
    } else {
        console.log("TABLE_EXISTS");
    }
}

checkTable();
