// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDummyData() {
    console.log('🚀 Starting Dummy Data Injection...');

    // 1. Create Dummy Counsellors in Profiles
    // Note: We can't easily create Auth users via script without auth admin, 
    // but we can create profiles and the admin dashboard reads from profiles.
    const dummyCounsellors = [
        { id: 'dummy-1', email: 'priya.sharma@balancenutrition.in', full_name: 'Priya Sharma', role: 'counsellor', training_buddy: 'BN Admin' },
        { id: 'dummy-2', email: 'rahul.verma@balancenutrition.in', full_name: 'Rahul Verma', role: 'counsellor', training_buddy: 'BN Admin' },
        { id: 'dummy-3', email: 'anita.desai@balancenutrition.in', full_name: 'Anita Desai', role: 'counsellor', training_buddy: 'BN Admin' },
        { id: 'dummy-4', email: 'vikram.singh@balancenutrition.in', full_name: 'Vikram Singh', role: 'counsellor', training_buddy: 'BN Admin' },
        { id: 'dummy-5', email: 'sanya.malhotra@balancenutrition.in', full_name: 'Sanya Malhotra', role: 'counsellor', training_buddy: 'BN Admin' },
    ];

    console.log('👥 Seeding Profiles...');
    for (const counsellor of dummyCounsellors) {
        const { error } = await supabase.from('profiles').upsert(counsellor);
        if (error) console.error(`Error seeding profile ${counsellor.full_name}:`, error);
    }

    // 2. Seed Activity Logs
    console.log('📝 Seeding Activity Logs...');
    const activities = [
        { user_id: 'dummy-1', activity_type: 'video_watch', content_title: 'PCOS Introduction', module_id: 'Module 1' },
        { user_id: 'dummy-1', activity_type: 'quiz_complete', content_title: 'PCOS Basics Quiz', module_id: 'Module 1' },
        { user_id: 'dummy-2', activity_type: 'video_watch', content_title: 'Diabetes Management', module_id: 'Module 2' },
        { user_id: 'dummy-3', activity_type: 'summary_submit', content_title: 'Module 1 Synthesis', module_id: 'Module 1' },
        { user_id: 'dummy-4', activity_type: 'login', content_title: 'Platform Login', module_id: 'System' },
        { user_id: 'dummy-5', activity_type: 'video_watch', content_title: 'Intro to Balance Nutrition', module_id: 'Module 1' },
    ];

    for (const act of activities) {
        await supabase.from('mentor_activity_logs').insert(act);
    }

    // 3. Seed Assessment Logs (Quizzes)
    console.log('📊 Seeding Assessments...');
    const assessments = [
        {
            user_id: 'dummy-1',
            topic_code: 'M1-PCOS',
            score: 4,
            total_questions: 5,
            raw_data: {
                questions: [
                    { question: 'What is PCOS?', correctAnswer: 'Polycystic Ovary Syndrome' },
                    { question: 'Common symptom?', correctAnswer: 'Irregular periods' }
                ],
                answers: ['Polycystic Ovary Syndrome', 'Irregular periods']
            }
        },
        {
            user_id: 'dummy-2',
            topic_code: 'M2-DIAB',
            score: 3,
            total_questions: 5,
            raw_data: {
                questions: [
                    { question: 'What is Type 2 Diabetes?', correctAnswer: 'Insulin resistance' }
                ],
                answers: ['Insulin resistance']
            }
        },
        {
            user_id: 'dummy-3',
            topic_code: 'M1-INTRO',
            score: 5,
            total_questions: 5,
            raw_data: { questions: [], answers: [] }
        },
    ];

    for (const ass of assessments) {
        await supabase.from('assessment_logs').insert(ass);
    }

    // 4. Seed Summary Audits (Peer Reviews)
    console.log('⚖️ Seeding Peer Audits...');
    const audits = [
        {
            user_id: 'dummy-1',
            topic_code: 'M1-SUMMARY',
            score: 85,
            feedback: 'Excellent grasp of the core concepts. The counselor demonstrated advanced empathy in their response strategy.'
        },
        {
            user_id: 'dummy-2',
            topic_code: 'M2-SUMMARY',
            score: 72,
            feedback: 'Good clinical knowledge, but needs to work on simplifying terminology for clients.'
        },
    ];

    for (const audit of audits) {
        await supabase.from('summary_audits').insert(audit);
    }

    console.log('✅ Dummy Data Injection Complete!');
}

seedDummyData().catch(console.error);
