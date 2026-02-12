import { createClient } from '@sanity/client';

const client = createClient({
    projectId: 'ow03d9eg',
    dataset: 'production',
    apiVersion: '2026-02-11',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
});

async function seed() {
    console.log('🌱 Seeding Sanity with test content...\n');

    // 1. Open Enrollment Settings
    console.log('📅 Creating Open Enrollment Settings...');
    await client.createOrReplace({
        _id: 'openEnrollment-singleton',
        _type: 'openEnrollment',
        title: 'Welcome to Open Enrollment',
        description: 'Review and update your benefits selections for the upcoming plan year.',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-31T23:59:59Z',
    });

    // 2. Benefits Page
    console.log('📋 Creating Benefits Page...');
    await client.createOrReplace({
        _id: 'benefitsPage-singleton',
        _type: 'benefitsPage',
        title: 'Your Benefits at a Glance',
        description: 'Explore the complete range of benefits available to RS&H employees. From health coverage to retirement planning, we have you covered.',
    });

    // 3. Benefit Chapters
    console.log('📚 Creating Benefit Chapters...');
    const chapters = [
        {
            _id: 'chapter-document-hub',
            title: 'Document Hub',
            slug: 'document-hub',
            description: 'Access all your important benefits documents in one place.',
            icon: 'file-text',
            order: 1,
        },
        {
            _id: 'chapter-2026-annual-notice',
            title: '2026 Annual Notice',
            slug: '2026-annual-notice',
            description: 'Important annual benefits notice for 2026.',
            icon: 'bell',
            order: 2,
        },
        {
            _id: 'chapter-overview-plans',
            title: 'Overview of Available Plans',
            slug: 'overview-of-available-plans',
            description: 'Learn about all the benefit plans available to you.',
            icon: 'list',
            order: 3,
        },
        {
            _id: 'chapter-eligibility',
            title: 'Eligibility & Qualifying Life Events',
            slug: 'eligibility-qualifying-life-events',
            description: 'Understand your eligibility and what life events allow changes.',
            icon: 'check-circle',
            order: 4,
        },
        {
            _id: 'chapter-medical-ppo',
            title: 'Medical Plan - BCBS PPO',
            slug: 'medical-plan-bcbs-ppo',
            description: 'Flexible preferred provider organization medical coverage.',
            icon: 'heart',
            order: 5,
        },
        {
            _id: 'chapter-medical-hdhp',
            title: 'Medical Plan - BCBS Prime HDHP',
            slug: 'medical-plan-bcbs-prime-hdhp',
            description: 'High deductible health plan with HSA opportunity.',
            icon: 'shield',
            order: 6,
        },
        {
            _id: 'chapter-medical-alt-hdhp',
            title: 'Medical Plan - BCBS Alternative HDHP',
            slug: 'medical-plan-bcbs-alternative-hdhp',
            description: 'Alternative high deductible health plan option.',
            icon: 'shield',
            order: 7,
        },
        {
            _id: 'chapter-dental',
            title: 'Dental Benefits',
            slug: 'dental-benefits',
            description: 'Comprehensive dental coverage for you and your family.',
            icon: 'smile',
            order: 8,
        },
        {
            _id: 'chapter-vision',
            title: 'Vision Benefits',
            slug: 'vision-benefits',
            description: 'Eye care coverage including exams and glasses.',
            icon: 'eye',
            order: 9,
        },
        {
            _id: 'chapter-eap',
            title: 'Employee Assistance Program',
            slug: 'employee-assistance-program',
            description: 'Confidential support for work and life challenges.',
            icon: 'users',
            order: 10,
        },
        {
            _id: 'chapter-fsa-hsa',
            title: 'FSA and HSA',
            slug: 'fsa-and-hsa',
            description: 'Tax-advantaged accounts for healthcare expenses.',
            icon: 'dollar-sign',
            order: 11,
        },
        {
            _id: 'chapter-survivor',
            title: 'Survivor Benefits',
            slug: 'survivor-benefits',
            description: 'Life insurance and survivor protection.',
            icon: 'umbrella',
            order: 12,
        },
        {
            _id: 'chapter-supplemental',
            title: 'Supplemental Health',
            slug: 'supplemental-health',
            description: 'Additional voluntary health coverage options.',
            icon: 'plus-circle',
            order: 13,
        },
        {
            _id: 'chapter-income-protection',
            title: 'Income Protection',
            slug: 'income-protection',
            description: 'Disability and income replacement benefits.',
            icon: 'briefcase',
            order: 14,
        },
        {
            _id: 'chapter-financial',
            title: 'Financial Wellbeing',
            slug: 'financial-wellbeing',
            description: 'Financial planning and wellness resources.',
            icon: 'trending-up',
            order: 15,
        },
        {
            _id: 'chapter-pto',
            title: 'Paid Time Off & Other Benefits',
            slug: 'paid-time-off-and-other-benefits',
            description: 'Time off policies and additional benefits.',
            icon: 'calendar',
            order: 16,
        },
        {
            _id: 'chapter-voluntary',
            title: 'Additional Voluntary Benefits',
            slug: 'additional-voluntary-benefits',
            description: 'Optional benefits you can choose to add.',
            icon: 'gift',
            order: 17,
        },
    ];

    for (const ch of chapters) {
        await client.createOrReplace({
            _type: 'benefitChapter',
            _id: ch._id,
            title: ch.title,
            slug: { _type: 'slug', current: ch.slug },
            description: ch.description,
            icon: ch.icon,
            order: ch.order,
            content: [
                {
                    _type: 'block',
                    _key: `block-${ch._id}-1`,
                    style: 'normal',
                    children: [
                        {
                            _type: 'span',
                            _key: `span-${ch._id}-1`,
                            text: ch.description + ' This benefits chapter provides important information about your coverage options and how to make the most of your benefits.',
                        },
                    ],
                    markDefs: [],
                },
                {
                    _type: 'block',
                    _key: `block-${ch._id}-2`,
                    style: 'normal',
                    children: [
                        {
                            _type: 'span',
                            _key: `span-${ch._id}-2`,
                            text: 'For more detailed information or to enroll, please visit your benefits portal or contact the HR team. Our representatives are available Monday through Friday, 8 AM to 6 PM EST.',
                        },
                    ],
                    markDefs: [],
                },
            ],
        });
    }

    // 4. Benefit Changes Page
    console.log('🔄 Creating Benefit Changes Page...');
    await client.createOrReplace({
        _id: 'benefitChangesPage-singleton',
        _type: 'benefitChangesPage',
        title: "What's New for 2026",
        description: 'Review the latest changes and improvements to your benefits package for the upcoming year.',
        alertMessage: 'Open enrollment runs January 1–31, 2026. Make sure to review all changes before making your elections.',
        changes: [
            {
                _key: 'change-1',
                type: 'new',
                title: 'Enhanced Mental Health Coverage',
                description: 'New expanded mental health benefits including virtual therapy sessions and wellness app subscriptions at no additional cost.',
            },
            {
                _key: 'change-2',
                type: 'new',
                title: 'Pet Insurance Program',
                description: 'A new voluntary pet insurance benefit is now available through our partnership with a leading pet insurance provider.',
            },
            {
                _key: 'change-3',
                type: 'new',
                title: 'Student Loan Repayment Assistance',
                description: 'New employer contribution program to help eligible employees pay down student loan debt faster.',
            },
            {
                _key: 'change-4',
                type: 'update',
                title: 'Increased HSA Contribution Limits',
                description: 'Annual HSA contribution limits have been raised to $4,300 for individual and $8,550 for family coverage.',
            },
            {
                _key: 'change-5',
                type: 'update',
                title: 'Lower Dental Premiums',
                description: 'Dental plan premiums have been reduced by 8% across all tiers while maintaining the same coverage levels.',
            },
            {
                _key: 'change-6',
                type: 'update',
                title: 'Expanded Provider Network',
                description: 'The BCBS PPO network has been expanded to include over 200 additional providers in the southeast region.',
            },
        ],
        ctaTitle: 'Ready to Review Your Benefits?',
        ctaDescription: 'Take time to review all the changes and consider how they might impact your benefits selections. Our HR team is available to answer any questions.',
    });

    // 5. Documents (Document Hub)
    console.log('📄 Creating Document Hub entries...');
    const docs = [
        { _id: 'doc-1', title: '2026 Benefits Summary' },
        { _id: 'doc-2', title: 'Medical Plan Details' },
        { _id: 'doc-3', title: 'Dental Plan Guide' },
        { _id: 'doc-4', title: 'Vision Plan Summary' },
        { _id: 'doc-5', title: 'FSA/HSA Guide' },
    ];
    for (const doc of docs) {
        await client.createOrReplace({
            _type: 'documentHub',
            _id: doc._id,
            title: doc.title,
        });
    }

    // 6. Enrollment Checklist
    console.log('✅ Creating Enrollment Checklist...');
    await client.createOrReplace({
        _id: 'enrollmentChecklist-singleton',
        _type: 'enrollmentChecklist',
        title: 'Enrollment Checklist',
        description: 'Use this step-by-step checklist to prepare for open enrollment and make informed decisions about your benefits.',
        items: [
            { _key: 'step-1', step: 1, title: 'Review Your Current Coverage', description: 'Compare your existing benefits with available plans to understand what has changed.' },
            { _key: 'step-2', step: 2, title: 'Assess Your Healthcare Needs', description: 'Consider your medical, dental, and vision needs for the upcoming year.' },
            { _key: 'step-3', step: 3, title: 'Evaluate Plan Options', description: 'Review medical, dental, vision, and wellness plan options that best fit your needs.' },
            { _key: 'step-4', step: 4, title: 'Compare Costs', description: 'Look at premiums, deductibles, copays, and out-of-pocket maximums for each plan.' },
            { _key: 'step-5', step: 5, title: 'Review Network Providers', description: 'Ensure your preferred doctors and providers are in-network for any plan you choose.' },
            { _key: 'step-6', step: 6, title: 'Consider Life Events', description: 'Account for any qualifying life events that may affect your coverage needs.' },
            { _key: 'step-7', step: 7, title: 'Explore FSA/HSA Options', description: 'Determine if you should contribute to Flexible Spending or Health Savings Accounts.' },
            { _key: 'step-8', step: 8, title: 'Review Supplemental Benefits', description: 'Consider optional supplemental insurance like accident, critical illness, or life insurance.' },
            { _key: 'step-9', step: 9, title: 'Confirm Beneficiaries', description: 'Update beneficiaries on life insurance and retirement plan accounts as needed.' },
            { _key: 'step-10', step: 10, title: 'Submit Your Elections', description: 'Complete your enrollment through the benefits portal before the deadline.' },
        ],
        ctaTitle: 'Ready to Enroll?',
        ctaDescription: "Once you've completed this checklist, you're ready to make your benefit elections during open enrollment.",
    });

    // 7. Retirement Planning
    console.log('🏖️  Creating Retirement Planning Page...');
    await client.createOrReplace({
        _id: 'retirementPlanning-singleton',
        _type: 'retirementPlanning',
        heroTitle: 'Retirement Planning',
        heroDescription: 'Plan your future with confidence. RS&H offers comprehensive retirement benefits and planning resources to help you achieve your long-term financial goals.',
        featuresTitle: 'Retirement Benefits',
        features: [
            { _key: 'feat-1', iconName: 'trending-up', title: '401(k) Plan', description: 'Save for retirement with employer matching contributions and investment options.' },
            { _key: 'feat-2', iconName: 'dollar-sign', title: 'Pension Plan', description: 'Defined benefit pension plan for eligible employees with competitive retirement benefits.' },
            { _key: 'feat-3', iconName: 'target', title: 'Financial Planning', description: 'Access free financial planning tools and resources to plan your retirement strategy.' },
            { _key: 'feat-4', iconName: 'bar-chart-3', title: 'Retirement Counseling', description: 'Work with professional advisors to develop a personalized retirement plan.' },
        ],
        planningTitle: 'Planning Your Retirement',
        sections: [
            { _key: 'sec-1', title: 'Start Early, Save Often', content: "The earlier you start saving for retirement, the more time your investments have to grow. RS&H's retirement plans offer multiple investment options to suit your risk tolerance and timeline." },
            { _key: 'sec-2', title: 'Maximize Employer Matching', content: "Take full advantage of RS&H's 401(k) matching program. This is free money for your retirement that helps you build a stronger financial foundation." },
            { _key: 'sec-3', title: 'Understand Your Options', content: 'Review all available investment options and select a diversified portfolio that aligns with your retirement goals and risk tolerance.' },
            { _key: 'sec-4', title: 'Use Planning Tools', content: "Our online retirement calculators can help you estimate your retirement needs and determine whether you're on track to meet your goals." },
        ],
        ctaButtonText: 'Schedule a Consultation',
    });

    console.log('\n✅ All test content has been seeded successfully!');
    console.log('🔗 Visit http://localhost:3000 to see the data live.');
}

seed().catch((err) => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
});
