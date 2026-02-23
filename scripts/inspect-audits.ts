import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectSummaryAudits() {
    console.log('🔍 Inspecting summary_audits table schema...');
    const { data, error } = await supabase
        .from('summary_audits')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ Columns found in summary_audits:', Object.keys(data[0] || {}));
    }
}

inspectSummaryAudits().catch(console.error);
