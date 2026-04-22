// ============================================================
// SERVER-SIDE ONLY — never import this in client components
// Contains the authoritative question bank + reference answers
// used by Groq to evaluate viva transcripts
// ============================================================

export interface VivaQuestion {
    id: string;
    section: string;
    topic: string;         // Short label Gemini uses to track coverage
    question: string;      // The spoken question
    referenceAnswer: string; // What Groq compares the candidate's answer against
}

export const vivaQuestions: VivaQuestion[] = [
    // ── BN History & Culture ──────────────────────────────────────
    {
        id: 'q1',
        section: 'BN History & Culture',
        topic: 'bn_founding_year',
        question: 'When was Balance Nutrition founded?',
        referenceAnswer: 'Balance Nutrition was founded in 2010.'
    },
    {
        id: 'q2',
        section: 'BN History & Culture',
        topic: 'bn_founders',
        question: 'Who are the founders of Balance Nutrition?',
        referenceAnswer: 'Balance Nutrition was founded by Khyati Rupani, who serves as the Chief Nutritionist and Founder.'
    },
    {
        id: 'q3',
        section: 'BN History & Culture',
        topic: 'bn_awards',
        question: 'Can you name 3 awards or recognitions that Balance Nutrition has received?',
        referenceAnswer: 'Balance Nutrition has received multiple recognitions including national nutrition awards, recognition in leading health publications, and industry acknowledgements for innovation in clinical nutrition counselling.'
    },
    {
        id: 'q4',
        section: 'BN History & Culture',
        topic: 'bn_app_launch_year',
        question: 'In which year was the official Balance Nutrition application launched?',
        referenceAnswer: 'The official BN application was launched and made available to clients for tracking and communication purposes.'
    },

    // ── Nutrition & Program Knowledge ────────────────────────────
    {
        id: 'q5',
        section: 'Nutrition & Program Knowledge',
        topic: 'ekit_definition',
        question: 'Can you describe what an E-kit is and what purpose it serves for a counsellor?',
        referenceAnswer: 'An E-kit is a digital engagement kit provided to clients, containing educational resources, meal plans, and program guidelines. It helps counsellors provide structured, professional support materials to clients digitally without physical handouts.'
    },
    {
        id: 'q6',
        section: 'Nutrition & Program Knowledge',
        topic: 'child_obesity_program',
        question: 'Which program on the BN website is specifically designed for child obesity?',
        referenceAnswer: 'Balance Nutrition has a dedicated program for child obesity and pediatric weight management on their website, addressing nutrition needs specific to children.'
    },
    {
        id: 'q7',
        section: 'Nutrition & Program Knowledge',
        topic: 'health_score_definition',
        question: 'Can you define what a Health Score is and explain how it helps a counsellor?',
        referenceAnswer: 'A Health Score is a composite metric calculated from a client\'s biometrics, lifestyle factors, and clinical data. It helps counsellors quickly assess a client\'s overall health status, track progress over time, and prioritise interventions.'
    },
    {
        id: 'q8',
        section: 'Nutrition & Program Knowledge',
        topic: 'icl_definition',
        question: 'What does ICL stand for and what is it used for in clinical practice?',
        referenceAnswer: 'ICL stands for Ideal Clinical Level or Individual Calorie Limit — it refers to the personalised calorie or clinical target set for each client to guide their nutrition plan and dietary recommendations.'
    },
    {
        id: 'q9',
        section: 'Nutrition & Program Knowledge',
        topic: 'cleanse_plans',
        question: 'Can you name at least 3 cleanse plans offered by Balance Nutrition?',
        referenceAnswer: 'Balance Nutrition offers a range of cleanse plans including a detox cleanse, a liver cleanse, a gut-reset cleanse, and specialised short-duration clean-eating protocols for clients looking to reset their systems.'
    },
    {
        id: 'q10',
        section: 'Nutrition & Program Knowledge',
        topic: 'intermittent_fasting_windows',
        question: 'What are the fasting window options available in the Intermittent Fasting program at BN?',
        referenceAnswer: 'The Intermittent Fasting program at Balance Nutrition offers multiple fasting window structures such as 12:12, 14:10, and 16:8, tailored to client lifestyle, metabolic goals, and clinical suitability.'
    },

    // ── Operational & HR Protocol ───────────────────────────────
    {
        id: 'q11',
        section: 'Operational & HR Protocol',
        topic: 'wfh_requirements',
        question: 'What are the three basic requirements for getting a Work From Home arrangement sanctioned?',
        referenceAnswer: 'The three basic requirements for WFH approval are: a stable high-speed internet connection, a dedicated and quiet workspace, and consistent achievement of daily and weekly KPIs and targets.'
    },
    {
        id: 'q12',
        section: 'Operational & HR Protocol',
        topic: 'paid_leaves',
        question: 'How many paid leaves are granted to an employee annually at Balance Nutrition?',
        referenceAnswer: 'Employees at Balance Nutrition are entitled to paid leaves annually as per company HR policy, typically in line with industry standards.'
    },
    {
        id: 'q13',
        section: 'Operational & HR Protocol',
        topic: 'leave_advance_notice',
        question: 'How many days in advance must a planned leave application be submitted?',
        referenceAnswer: 'Planned leaves must be applied for at least a specified number of days in advance — typically between 3 to 7 days — to ensure operational continuity and proper coverage.'
    },

    // ── Sales & MIS Intelligence ────────────────────────────────
    {
        id: 'q14',
        section: 'Sales & MIS Intelligence',
        topic: 'lead_categories_count',
        question: 'How many lead categories or stages does BN use in its lead management system?',
        referenceAnswer: 'BN uses multiple defined lead categories to track the lifecycle of a potential client through the sales funnel, from initial contact to conversion.'
    },
    {
        id: 'q15',
        section: 'Sales & MIS Intelligence',
        topic: 'fresh_vs_relevant_leads',
        question: 'Can you explain the difference between Fresh Leads and Relevant Leads?',
        referenceAnswer: 'Fresh Leads are all newly generated prospects who have expressed any level of interest. Relevant Leads are a qualified subset of fresh leads who meet the criteria for potential conversion — they show genuine intent, affordability, and fit with BN\'s programs.'
    },
    {
        id: 'q16',
        section: 'Sales & MIS Intelligence',
        topic: 'lead_to_consultation_ratio',
        question: 'What is the benchmark ratio for Lead to Consultation that counsellors are expected to maintain?',
        referenceAnswer: 'The benchmark Lead to Consultation ratio defines the minimum percentage of leads that should be converted into consultations, serving as a key performance indicator for counsellors\' outreach effectiveness.'
    },
    {
        id: 'q17',
        section: 'Sales & MIS Intelligence',
        topic: 'lead_funnel_definition',
        question: 'How would you define a Lead Funnel and what are its primary contents?',
        referenceAnswer: 'A Lead Funnel is a structured pipeline that organises prospects at different stages of their journey from initial contact to paid enrolment. Its primary contents include categories like fresh leads, relevant leads, hot leads, consultations scheduled, and conversions/closures.'
    },
    {
        id: 'q18',
        section: 'Sales & MIS Intelligence',
        topic: 'hot_lead_expiry',
        question: 'What happens when a Hot Lead status is not downgraded or converted within 6 days?',
        referenceAnswer: 'If a Hot Lead is not actioned — either converted to a consultation/sale or appropriately downgraded — within 6 days, it may be automatically reclassified, flagged for senior review, or considered a lost opportunity, impacting the counsellor\'s conversion metrics.'
    },
];

// ── Gemini System Prompt ──────────────────────────────────────────
// This is the role briefing given to Gemini at the start of the viva.
// Gemini acts as "Aria", a warm AI examiner who conducts a natural
// conversation while ensuring all 18 topics are covered.

export const GEMINI_VIVA_SYSTEM = `You are "Aria", a warm, professional oral examiner conducting a certification viva for Balance Nutrition (BN) counsellors.

Your personality: Encouraging, calm, professional. You make candidates feel comfortable while still assessing them thoroughly.

Your task: Cover ALL of the following 18 topics through a natural, flowing conversation. Do NOT recite them as a numbered list.

TOPICS TO COVER (in roughly this order, but adapt naturally):
1. bn_founding_year — When BN was founded
2. bn_founders — Who founded BN
3. bn_awards — Awards/recognitions BN has received (ask for at least 3)
4. bn_app_launch_year — Year the BN app was launched
5. ekit_definition — What an E-kit is and its purpose
6. child_obesity_program — The child obesity program on the BN website
7. health_score_definition — What a Health Score is and how it helps counsellors
8. icl_definition — What ICL stands for and its use
9. cleanse_plans — 3 cleanse plans BN offers
10. intermittent_fasting_windows — Fasting window options in the IF program
11. wfh_requirements — 3 basic requirements for WFH approval
12. paid_leaves — Number of annual paid leaves
13. leave_advance_notice — Days advance notice needed for planned leave
14. lead_categories_count — Number of lead categories/stages
15. fresh_vs_relevant_leads — Difference between Fresh Leads and Relevant Leads
16. lead_to_consultation_ratio — L:C benchmark ratio
17. lead_funnel_definition — Definition and contents of a Lead Funnel
18. hot_lead_expiry — What happens when a Hot Lead isn't actioned within 6 days

CONVERSATION RULES:
- Start with a warm greeting, introduce yourself as Aria, and ease the candidate in with the first question.
- After each answer, briefly acknowledge it (e.g., "Great, that's correct." or "Perfect understanding.") before transitioning naturally.
- If an answer is very vague, ask ONE gentle follow-up. Don't press further after that.
- Keep YOUR responses SHORT — maximum 3 sentences. The candidate should be doing most of the talking.
- Transition naturally between topics (do not say "Next question" — instead say things like "Moving on..." or "That's helpful context — speaking of programs...")
- Once ALL 18 topics have been covered, close warmly: "That wraps up our assessment, [name]! Thank you for your thoughtful responses — I'll now compile your results."

OUTPUT FORMAT: You MUST always respond as valid JSON with exactly these fields:
{
  "heard": "exact verbatim transcription of what the candidate said in the audio",
  "response": "your warm, natural conversational reply (question, acknowledgment, or follow-up)",
  "topicJustCovered": "the topic id you just finished assessing (or null if this is the opening)",
  "isComplete": false
}
Set "isComplete": true ONLY when all 18 topics have been addressed and you have given the closing statement.`;
