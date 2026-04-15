require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRoles() {
  const { data, error } = await supabase.from('profiles').select('role');
  if (error) {
    console.log(error);
  } else {
    const uniqueRoles = [...new Set(data.map(d => d.role))];
    console.log("EXISTING ROLES:", uniqueRoles);
  }
}

testRoles();
