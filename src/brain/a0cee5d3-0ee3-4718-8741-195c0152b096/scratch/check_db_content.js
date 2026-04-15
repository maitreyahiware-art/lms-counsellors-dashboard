
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkContent() {
    const { data, error } = await supabase.from('syllabus_content').select('*');
    if (error) {
        console.error(error);
        return;
    }
    console.log("Total entries:", data.length);
    const manuals = data.filter(d => d.title.toLowerCase().includes('manual') || d.title.toLowerCase().includes('program'));
    const engagement = data.filter(d => d.title.toLowerCase().includes('engagement') || d.title.toLowerCase().includes('ocr') || d.title.toLowerCase().includes('orc'));
    
    console.log("\n--- Potential Program Manuals ---");
    manuals.forEach(m => console.log(`[${m.topic_code}] ${m.title} - ${m.content_type}: ${m.content}`));
    
    console.log("\n--- Potential Engagement/OCR Training ---");
    engagement.forEach(e => console.log(`[${e.topic_code}] ${e.title} - ${e.content_type}: ${e.content}`));
}

checkContent();
