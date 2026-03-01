import { createClient } from '@sanity/client';
import fs from 'fs';

// Load .env.local if it exists
if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ow03d9eg',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-02-11',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
});

// ── Helper: Convert plain text paragraphs into Sanity Portable Text blocks ──
function textToBlocks(paragraphs) {
    return paragraphs.map((text, i) => ({
        _type: 'block',
        _key: `block-${i}`,
        style: 'normal',
        children: [{ _type: 'span', _key: `span-${i}`, text, marks: [] }],
        markDefs: [],
    }));
}

// ── Constants ──
const CLIENT_ID = 'client-premier-america';
const CLIENT_REF = { _type: 'reference', _ref: CLIENT_ID };
const prefix = 'pa'; // Document ID prefix for Premier America

async function seedPremierAmerica() {
    console.log('🌱 Seeding Full Site for Client: Premier America Credit Union...\n');

    try {
        // ═══════════════════════════════════════════════════════════════════
        // 1. CLIENT DOCUMENT
        // ═══════════════════════════════════════════════════════════════════
        console.log('🏢 Creating Client Document...');
        await client.createOrReplace({
            _id: CLIENT_ID,
            _type: 'client',
            name: 'Premier America Credit Union',
            slug: { _type: 'slug', current: 'premier-america' },
            themeColor: '#D31145',
        });

        // ═══════════════════════════════════════════════════════════════════
        // 2. SITE SETTINGS
        // ═══════════════════════════════════════════════════════════════════
        console.log('⚙️  Creating Site Settings...');
        await client.createOrReplace({
            _id: `siteSettings-${prefix}`,
            _type: 'siteSettings',
            client: CLIENT_REF,
            clientName: 'Premier America Credit Union',
            shortName: 'Premier America Credit Union',
            logoText: 'Premier America Benefits',
            footerAbout: 'Comprehensive benefits administration and support for the valued employees of Premier America Credit Union.',
            quickAccess: [
                {
                    _key: 'qa-ukg',
                    title: 'UKG',
                    description: 'Access the UKG time and attendance system for payroll and scheduling.',
                    href: 'https://premieramerica.ultipro.com',
                    iconName: 'building'
                },
                {
                    _key: 'qa-support',
                    title: 'Important Contact Information',
                    description: 'Reach out to our benefits support team for any plan-related questions.',
                    href: 'mailto:benefits@premieramerica.com',
                    iconName: 'message-square'
                },
                {
                    _key: 'qa-docs',
                    title: 'Contact Us',
                    description: 'General HR inquiries and employment verification.',
                    href: 'mailto:hrd@premieramerica.com',
                    iconName: 'mail'
                }
            ],
            contactInfo: [
                { _key: 'c-hr', label: 'HR Department', value: '818-772-4000 | hrd@premieramerica.com', href: 'mailto:hrd@premieramerica.com' },
            ],
            quickLinks: [
                { _key: 'ql-1', label: 'Home', href: '/premier-america' },
                { _key: 'ql-2', label: 'Chapters', href: '/premier-america/benefits' },
                { _key: 'ql-3', label: 'Document Hub', href: '/premier-america/document-hub' },
            ],
            footerContactTitle: 'Contact',
            footerContactDescription: 'Have questions? Reach out to our support team.',
            copyrightText: `© ${new Date().getFullYear()} Premier America Credit Union. All rights reserved.`,
        });

        // ═══════════════════════════════════════════════════════════════════
        // 3. BENEFITS OVERVIEW PAGE
        // ═══════════════════════════════════════════════════════════════════
        console.log('📋 Creating Benefits Overview Page...');
        await client.createOrReplace({
            _id: `benefitsPage-${prefix}`,
            _type: 'benefitsPage',
            client: CLIENT_REF,
            title: 'Your Benefits at a Glance',
            description: 'Explore the complete range of benefits available to Premier America Credit Union employees. From health coverage to financial wellness, we have you covered.',
        });

        // ═══════════════════════════════════════════════════════════════════
        // 4. OPEN ENROLLMENT SETTINGS
        // ═══════════════════════════════════════════════════════════════════
        console.log('📅 Creating Open Enrollment Settings...');
        await client.createOrReplace({
            _id: `openEnrollment-${prefix}`,
            _type: 'openEnrollment',
            client: CLIENT_REF,
            title: 'Welcome to Open Enrollment',
            description: 'Review and update your benefits selections for the upcoming plan year. Take time to explore your options and make informed decisions about your coverage.',
            daysLeftLabel: 'Days Left',
            periodLabel: 'Open Enrollment Period',
            statusTitle: 'Action Needed',
            statusDescription: 'Review and update your selections now',
            checklistLabel: 'Review Enrollment Checklist',
            checklistSubtext: 'Prepare for open enrollment',
            changesLabel: 'Discover Benefit Changes',
            changesSubtext: 'What\'s new for 2026',
            enrollLabel: 'Enroll Now',
            enrollSubtext: 'Complete your enrollment',
        });

        // ═══════════════════════════════════════════════════════════════════
        // 5. BENEFIT CHAPTERS (10 Chapters) — Using unified `tables` format
        // ═══════════════════════════════════════════════════════════════════
        console.log('📚 Creating Benefit Chapters...\n');

        const chapters = [
            // ── Chapter 1: Eligibility & Qualifying Life Events ──
            {
                _id: `${prefix}-ch-eligibility`,
                title: 'Eligibility & Qualifying Life Events',
                slug: 'eligibility-qualifying-life-events',
                icon: 'check-circle',
                order: 1,
                description: 'Understand your eligibility and what life events allow you to make changes to your benefits.',
                content: textToBlocks([
                    "If you're a full-time employee, who is regularly scheduled to work a minimum of 30 hours per week, both you and your legal spouse/domestic partner are eligible for benefits.",
                    "Your children can be covered up to age 26, whether they are biological, stepchildren, adopted, foster, or legally dependent. If your child is medically certified as disabled, they can remain on your plan beyond the age of 26.",
                    "Keep in mind, you can only make changes to your benefits if you experience a qualifying life event.",
                    "A qualifying life event is a significant change in your life that impacts your benefits eligibility and allows you to adjust your coverage.",
                    "This includes getting married, divorced, having a baby, or if your spouse loses their job and healthcare coverage. It also includes adopting a child, a child no longer being eligible as a dependent, or a change in your employment status, such as moving from full-time to part-time.",
                    "If you experience a qualifying life event and need to make changes, simply contact us. We'll be here to support you when the time comes!",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Eligibility Summary',
                        columns: [{ _key: 'col-0', key: 'value', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Eligible Employees', cells: ['Full-time, 30+ hrs/week'] },
                            { _key: 'row-1', label: 'Spouse/Domestic Partner', cells: ['Eligible'] },
                            { _key: 'row-2', label: 'Dependent Children', cells: ['Up to Age 26'] },
                            { _key: 'row-3', label: 'Disabled Dependents', cells: ['Beyond Age 26 (if certified)'] },
                            { _key: 'row-4', label: 'Mid-Year Changes', cells: ['Qualifying Life Event Only'] },
                        ],
                    },
                ],
            },

            // ── Chapter 2: Medical Plan Overview ──
            {
                _id: `${prefix}-ch-medical-overview`,
                title: 'Medical Plan Overview',
                slug: 'medical-plan-overview',
                icon: 'heart',
                order: 2,
                description: 'An overview of the three medical plan options available, administered by Anthem Blue Cross.',
                content: textToBlocks([
                    "For medical coverage, you have the following options: the HDHP (High Deductible Health Plan) plan, and two additional medical plan options. Medical coverage is administered by Anthem Blue Cross.",
                    "The HDHP (High Deductible Health Plan) plan starts at a Bi-weekly contribution of $91.19 for individual coverage. This plan offers flexibility, letting you see both in-network and out-of-network providers.",
                    "The second plan starts at a Bi-weekly contribution of $0 for individual coverage. This plan is great if you don't mind sticking with in-network doctors and facilities. Keep in mind, because this is an HMO plan, you must designate a Primary Care Physician.",
                    "The third plan starts at Bi-weekly contribution of $0 for individual coverage. This is a great option if you want lower premiums and the ability to save for future healthcare costs. This plan allows you to pair your coverage with a Health Savings Account, where you can set aside pre-tax dollars to use for medical expenses.",
                    "Take a moment to consider your needs and the needs of your family. If a specific plan stands out to you, you can skip ahead to its chapter for more details!",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Medical Premiums',
                        templateId: 'overview-medical',
                        tableDescription: 'Premium contributions for medical are deducted from your paycheck on a pre-tax basis. Your level of coverage determines your bi-weekly contributions.',
                        columns: [{ _key: 'col-0', key: 'hdhp', label: 'HDHP' }],
                        rows: [
                            { _key: 'row-0', label: 'Team Member Only', cells: ['$91.19'] },
                            { _key: 'row-1', label: 'Team Member + Spouse/DP', cells: ['$295.66'] },
                            { _key: 'row-2', label: 'Team Member + Child(ren)', cells: ['$241.90'] },
                            { _key: 'row-3', label: 'Team Member + Family', cells: ['$416.61'] },
                        ],
                    },
                    {
                        _key: 'tbl-1',
                        tableTitle: 'Dental Premiums',
                        templateId: 'overview-dental',
                        tableDescription: 'This chart summarizes the dental coverage provided by Anthem Blue Cross for 2025.',
                        columns: [{ _key: 'col-0', key: 'anthem-ppo', label: 'ANTHEM BLUE CROSS - PPO' }],
                        rows: [
                            { _key: 'row-0', label: 'Team Member Only', cells: ['$19.37'] },
                            { _key: 'row-1', label: 'Team Member + 1 Dependent', cells: ['$42.57'] },
                            { _key: 'row-2', label: 'Team Member + Family', cells: ['$64.43'] },
                        ],
                    },
                    {
                        _key: 'tbl-2',
                        tableTitle: 'Vision Premiums',
                        templateId: 'overview-vision',
                        tableDescription: 'Vision premium contributions are deducted from your paycheck on a pre-tax basis. Your tier of coverage determines your bi-weekly premium. This chart summarizes the vision coverage provided by EyeMed for 2025.',
                        columns: [{ _key: 'col-0', key: 'insight-ppo', label: 'INSIGHT - PPO' }],
                        rows: [
                            { _key: 'row-0', label: 'Team Member Only', cells: ['$3.36'] },
                            { _key: 'row-1', label: 'Team Member + 1 Dependent', cells: ['$6.40'] },
                            { _key: 'row-2', label: 'Team Member + Family', cells: ['$9.39'] },
                        ],
                    },
                ],
            },

            // ── Chapter 3: HDHP (High Deductible Health Plan) ──
            {
                _id: `${prefix}-ch-hdhp`,
                title: 'HDHP - High Deductible Health Plan',
                slug: 'hdhp-high-deductible-health-plan',
                icon: 'shield',
                order: 3,
                description: 'Comprehensive coverage with a higher deductible, paired with HSA eligibility. Administered by Anthem Blue Cross.',
                content: textToBlocks([
                    "Let's explore the High-Deductible Health Plan, or HDHP, and see if it's the right fit for you and your family.",
                    "This plan offers comprehensive coverage for a range of services, including routine check-ups, specialty care, and emergencies. Unlike traditional plans with set copays, the HDHP plan works a bit differently.",
                    "One key difference with the HDHP plan is that you'll need to meet your deductible before the plan begins covering most of your services.",
                    "However, preventive care services are fully covered by the plan without needing to meet your deductible first. This includes wellness visits, physicals, screenings for conditions like cancer or diabetes, and standard immunizations.",
                    "This plan's deductible is $1,650 for individual coverage and $4,100 ($3,300/Family Member) for family coverage when you visit in-network providers.",
                    "Once your deductible is met, the plan will pay for covered services according to the coinsurance rate. The plan will cover 80% for in-network services like primary care visits, specialist office visits, inpatient care, and urgent care visits, while you remain responsible for the remainder.",
                    "The HDHP plan also has an out-of-pocket maximum, which is the most you'll pay in a year for covered services. This plan's in-network out-of-pocket maximum is $4,250 for individual coverage, and $8,500 for family coverage.",
                    "Your prescription costs are determined by the tier assigned to each specific prescription drug.",
                    "This plan also makes it easy to access quality healthcare from anywhere with virtual visits through LiveHealth Online. With LiveHealth Online, you and your dependents can consult a doctor at any time for common health issues like allergies, sore throats, sinus problems, and more.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Plan Benefits Summary',
                        templateId: 'medical-benefits',
                        tableDescription: 'Comprehensive coverage details for HDHP plan',
                        columns: [
                            { _key: 'col-0', key: 'in-network', label: 'In-Network' },
                            { _key: 'col-1', key: 'out-of-network', label: 'Out-of-Network' },
                        ],
                        rows: [
                            { _key: 'row-0', label: 'Calendar Year Deductible', cells: [], isSection: true },
                            { _key: 'row-1', label: 'Individual', cells: ['$1,650', '$4,950'] },
                            { _key: 'row-2', label: 'Family', cells: ['$4,100 ($3,300/Family Member)', '$9,900 ($4,950/Family Member)'] },
                            { _key: 'row-3', label: 'Coinsurance (You Pay)', cells: ['20%*', '40%*'] },
                            { _key: 'row-4', label: 'Calendar Year Out-of-Pocket Maximum', cells: [], isSection: true },
                            { _key: 'row-5', label: 'Individual', cells: ['$4,250', '$12,750'] },
                            { _key: 'row-6', label: 'Family', cells: ['$8,500 ($4,250/Family Member)', '$25,500 ($12,750/Family Member)'] },
                            { _key: 'row-7', label: 'Copays/Coinsurance', cells: [], isSection: true },
                            { _key: 'row-8', label: 'Preventive Care', cells: ['No charge', 'Deductible, then 40%'] },
                            { _key: 'row-9', label: 'Primary Care', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-10', label: 'Specialist Services', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-11', label: 'Diagnostic Care', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-12', label: 'Inpatient Care', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-13', label: 'Outpatient Care', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-14', label: 'Urgent Care', cells: ['Deductible, then 20%', 'Deductible, then 40%'] },
                            { _key: 'row-15', label: 'Emergency Room', cells: ['Deductible, then 20%', 'Deductible, then 20%'] },
                        ],
                    },
                ],
            },

            // ── Chapter 4: Dental Plan ──
            {
                _id: `${prefix}-ch-dental`,
                title: 'Dental Benefits',
                slug: 'dental-benefits',
                icon: 'smile',
                order: 4,
                description: 'Affordable dental coverage through Anthem Blue Cross for all eligible employees and their dependents.',
                content: textToBlocks([
                    "Dental coverage is provided by Anthem Blue Cross. This PPO plan offers comprehensive preventive, basic, major, and orthodontic services for eligible employees and their dependents.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Dental Plan Summary',
                        templateId: 'dental-benefits',
                        tableDescription: 'Coverage details for Anthem Blue Cross dental plan',
                        columns: [
                            { _key: 'col-0', key: 'in-network', label: 'In-Network' },
                            { _key: 'col-1', key: 'out-of-network', label: 'Out-of-Network' },
                        ],
                        rows: [
                            { _key: 'row-0', label: 'Calendar Year Deductible', cells: [], isSection: true },
                            { _key: 'row-1', label: 'Individual', cells: ['$50', '$50'] },
                            { _key: 'row-2', label: 'Family', cells: ['$150', '$150'] },
                            { _key: 'row-3', label: 'Calendar Year Maximum', cells: [], isSection: true },
                            { _key: 'row-4', label: 'Per Person', cells: ['$1,500/Individual', '$1,500/Individual'] },
                            { _key: 'row-5', label: 'Covered Services', cells: [], isSection: true },
                            { _key: 'row-6', label: 'Preventive Services', cells: ['No charge', 'No charge'] },
                            { _key: 'row-7', label: 'Basic Services', cells: ['20%*', '20%*'] },
                            { _key: 'row-8', label: 'Major Services', cells: ['50%*', '50%*'] },
                            { _key: 'row-9', label: 'Orthodontics', cells: ['50%*', '50%*'] },
                            { _key: 'row-10', label: 'Orthodontic Lifetime Maximum', cells: ['$1,500', '$1,500'] },
                        ],
                    },
                ],
            },

            // ── Chapter 5: Vision Plan ──
            {
                _id: `${prefix}-ch-vision`,
                title: 'Vision Benefits',
                slug: 'vision-benefits',
                icon: 'eye',
                order: 5,
                description: 'Quality vision care through EyeMed, with premiums starting at just $3.36 bi-weekly.',
                content: textToBlocks([
                    "We provide quality vision care for you and your family through EyeMed.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Vision Plan Summary',
                        templateId: 'vision-benefits',
                        tableDescription: 'Coverage details for EyeMed vision plan',
                        columns: [
                            { _key: 'col-0', key: 'in-network', label: 'In-Network' },
                            { _key: 'col-1', key: 'out-of-network', label: 'Out-of-Network' },
                        ],
                        rows: [
                            { _key: 'row-0', label: 'Exams', cells: [], isSection: true },
                            { _key: 'row-1', label: 'Copay', cells: ['$20', 'Up to $40 reimbursement'] },
                            { _key: 'row-2', label: 'Lenses', cells: [], isSection: true },
                            { _key: 'row-3', label: 'Single Vision', cells: ['No charge', 'Up to $30 reimbursement'] },
                            { _key: 'row-4', label: 'Bifocal', cells: ['No charge', 'Up to $50 reimbursement'] },
                            { _key: 'row-5', label: 'Trifocal', cells: ['No charge', 'Up to $70 reimbursement'] },
                            { _key: 'row-6', label: 'Contacts (In Lieu of Lenses and Frames)', cells: [], isSection: true },
                            { _key: 'row-7', label: 'Elective', cells: ['$130 allowance', 'Up to $130 reimbursement'] },
                            { _key: 'row-8', label: 'Medically Necessary', cells: ['No charge', 'Up to $210 reimbursement'] },
                            { _key: 'row-9', label: 'Frames', cells: [], isSection: true },
                            { _key: 'row-10', label: 'Allowance', cells: ['$130 allowance, then 20% off remaining balance', 'Up to $91 reimbursement'] },
                            { _key: 'row-11', label: 'Other Services', cells: [], isSection: true },
                            { _key: 'row-12', label: 'Eyeglass Lens Upgrades', cells: ['Continued Eyewear Savings', 'LASIK and PRK Benefit'] },
                        ],
                    },
                ],
            },

            // ── Chapter 6: FSA & HSA ──
            {
                _id: `${prefix}-ch-fsa-hsa`,
                title: 'FSA & HSA',
                slug: 'fsa-and-hsa',
                icon: 'dollar-sign',
                order: 6,
                description: 'Flexible Spending Accounts and Health Savings Account options to save on out-of-pocket costs.',
                content: textToBlocks([
                    "Let's talk about the Flexible Spending Accounts and Health Savings Account options available to you. These accounts allow you to set aside pre-tax dollars to cover eligible expenses, helping you save on out-of-pocket costs.",
                    "With the Healthcare FSA, you can contribute up to $3,300 annually to cover eligible medical expenses, such as copays, deductibles, over-the-counter medications, and more. It's important to know that the Healthcare FSA follows the \"use it or lose it\" rule, so any unused funds by the end of the plan year will be forfeited.",
                    "The Dependent Care FSA lets you set aside up to $5,000 pre-tax for childcare or elder care expenses. This covers things like daycare, in-home babysitting services, before and after school programs, and day camps for eligible dependents. Eligible dependents include children under 13, or dependents who are physically or mentally incapable of self-care and live with you for the majority of the year.",
                    "For employees enrolled in our High-Deductible Health Plan, you have the option to contribute to a Health Savings Account. The HSA allows you to save for current and future medical expenses. Unlike the FSA, HSA funds roll over from year to year and can be invested to grow your savings.",
                    "You can set aside up to $4,300 for individual coverage or $8,550 for family coverage. If you're 55 or older, you can also make an additional \"catch-up\" contribution of $1,000.",
                    "Plus, Premier America contributes $1,100 for individual coverage or $2,100 for family coverage each year.",
                    "One of the major advantages of an HSA is that there is no \"use it or lose it\" rule, so you can continue to save and use these funds as needed.",
                    "Employees with an HSA can also contribute to a Limited Use Flexible Spending Account (LUFSA) for dental and vision expenses, keeping your HSA intact for medical costs. The contribution limit for the LUFSA is $3,300.",
                    "Key differences between an HSA and an FSA: Eligibility — You must be enrolled in the HDHP plan to contribute to an HSA, while an FSA is available regardless of your health plan. Rollover — HSA funds roll over from year to year, while FSA funds must be used within the plan year. Flexibility — HSAs allow you to save for long-term healthcare expenses, including retirement, while FSAs are designed to cover more immediate medical costs.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'FSA Contribution Limits',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Healthcare FSA Limit', cells: ['$3,300/year'] },
                            { _key: 'row-1', label: 'Healthcare FSA Rollover', cells: ['Use It or Lose It'] },
                            { _key: 'row-2', label: 'Dependent Care FSA Limit', cells: ['$5,000/year'] },
                            { _key: 'row-3', label: 'LUFSA Limit', cells: ['$3,300/year'] },
                        ],
                    },
                    {
                        _key: 'tbl-1',
                        tableTitle: 'HSA Contribution Limits',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'HSA Limit (Individual)', cells: ['$4,300/year'] },
                            { _key: 'row-1', label: 'HSA Limit (Family)', cells: ['$8,550/year'] },
                            { _key: 'row-2', label: 'HSA Catch-Up (55+)', cells: ['+$1,000'] },
                            { _key: 'row-3', label: 'Employer HSA Contribution (Individual)', cells: ['$1,100/year'] },
                            { _key: 'row-4', label: 'Employer HSA Contribution (Family)', cells: ['$2,100/year'] },
                            { _key: 'row-5', label: 'HSA Rollover', cells: ['Yes — Funds Roll Over'] },
                        ],
                    },
                ],
            },

            // ── Chapter 7: Employee Assistance Program (EAP) ──
            {
                _id: `${prefix}-ch-eap`,
                title: 'Employee Assistance Program',
                slug: 'employee-assistance-program',
                icon: 'users',
                order: 7,
                description: 'Confidential support for mental, emotional, and physical health at no cost to you.',
                content: textToBlocks([
                    "The Employee Assistance Program offers confidential support to help you and your family manage your mental, emotional, and physical health. This program is available at no cost to you, whether or not you're enrolled in a company-sponsored medical plan.",
                    "With the EAP, you can access mental health support, as well as legal and financial assistance from professionals. You'll also have 24/7 access to resources via phone and a set number of face-to-face visits with licensed professionals. All services are confidential.",
                    "Whether you're facing personal challenges, work stress, or just need help balancing life's demands, the EAP is here to support you.",
                    "To access these services, you will need to enter company Web ID: www.mutualofomaha.com/eap when visiting the website.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'EAP Program Summary',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Cost to Employee', cells: ['No Cost'] },
                            { _key: 'row-1', label: 'Eligibility', cells: ['All Employees (regardless of medical enrollment)'] },
                            { _key: 'row-2', label: 'Mental Health Support', cells: ['Included'] },
                            { _key: 'row-3', label: 'Legal Assistance', cells: ['Included'] },
                            { _key: 'row-4', label: 'Financial Assistance', cells: ['Included'] },
                            { _key: 'row-5', label: 'Phone Access', cells: ['24/7'] },
                            { _key: 'row-6', label: 'Face-to-Face Visits', cells: ['Licensed Professionals'] },
                            { _key: 'row-7', label: 'Confidentiality', cells: ['All Services Confidential'] },
                            { _key: 'row-8', label: 'Web ID', cells: ['www.mutualofomaha.com/eap'] },
                            { _key: 'row-9', label: 'Administered By', cells: ['Mutual of Omaha'] },
                        ],
                    },
                ],
            },

            // ── Chapter 8: Supplemental Health Benefits ──
            {
                _id: `${prefix}-ch-supplemental`,
                title: 'Supplemental Health Benefits',
                slug: 'supplemental-health-benefits',
                icon: 'plus-circle',
                order: 8,
                description: 'Critical Illness, Hospital Indemnity, and Accident Coverage for added peace of mind.',
                content: textToBlocks([
                    "At Premier America Credit Union, we're committed to offering benefits that help you stay protected in unexpected situations. That's why we offer Supplemental Health Benefits to give you added peace of mind.",
                    "We offer three types of supplemental coverage: Critical Illness Coverage, Hospital Indemnity Coverage, and Accident Coverage.",
                    "With Critical Illness Coverage, you'll receive a lump-sum benefit if diagnosed with a covered disease or condition. You can use this money however you like — whether for medical expenses not covered by your plan, lost wages, childcare, travel, or household expenses.",
                    "Hospital Indemnity Coverage pays cash benefits directly to you if you have a covered stay in a hospital or Intensive Care Unit. You can use this to pay for medical expenses such as deductibles, copays, travel costs, food and lodging, or other everyday expenses. Benefits are payable for pregnancy on the first day you have the policy.",
                    "Accident Coverage offers extra protection for you and your dependents if you're injured in a non-work-related accident, helping with costs like deductibles, copays, and everyday expenses.",
                    "These Supplemental Health benefits are designed to give you flexibility and help cover the gaps in your traditional health insurance.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Supplemental Coverage Summary',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Critical Illness Coverage', cells: ['Lump-Sum Benefit'] },
                            { _key: 'row-1', label: 'Critical Illness - Use of Funds', cells: ['Unrestricted (medical, wages, travel, etc.)'] },
                            { _key: 'row-2', label: 'Hospital Indemnity Coverage', cells: ['Cash Benefits for Hospital/ICU Stay'] },
                            { _key: 'row-3', label: 'Hospital Indemnity - Pregnancy', cells: ['Day 1 Coverage'] },
                            { _key: 'row-4', label: 'Hospital Indemnity - Use of Funds', cells: ['Deductibles, copays, travel, food, everyday expenses'] },
                            { _key: 'row-5', label: 'Accident Coverage', cells: ['Non-Work-Related Accidents'] },
                            { _key: 'row-6', label: 'Accident - Use of Funds', cells: ['Deductibles, copays, everyday expenses'] },
                            { _key: 'row-7', label: 'Administered By', cells: ['Allstate'] },
                        ],
                    },
                ],
            },

            // ── Chapter 9: Disability Insurance ──
            {
                _id: `${prefix}-ch-disability`,
                title: 'Disability Insurance',
                slug: 'disability-insurance',
                icon: 'briefcase',
                order: 9,
                description: 'Short-Term and Long-Term Disability Insurance to replace your income if you are unable to work.',
                content: textToBlocks([
                    "We understand how important it is to have financial security if you're unable to work.",
                    "That's why we offer Short-Term Disability Insurance at no cost to you and the opportunity to purchase Long-Term Disability Insurance. This helps replace your income if you're unable to work due to an injury or illness.",
                    "With Short-Term Disability Insurance, you receive 55% of your income, up to $1,075 per week. Benefits begin after a Day 1 for Accident/Injury and Day 8 for Illness elimination period and can continue for up to 90 days.",
                    "For extended periods of disability, our Long-Term Disability Insurance provides 50% of your income, up to a maximum of $6,000 per month. Benefits begin after a 90-day elimination period and can continue until you recover or meet the Social Security normal retirement age, whichever happens first.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Short-Term Disability Insurance',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Benefit', cells: ['55% of income'] },
                            { _key: 'row-1', label: 'Weekly Maximum', cells: ['$1,075/week'] },
                            { _key: 'row-2', label: 'Elimination Period', cells: ['Day 1 Accident / Day 8 Illness'] },
                            { _key: 'row-3', label: 'Benefit Duration', cells: ['Up to 90 Days'] },
                            { _key: 'row-4', label: 'Cost to Employee', cells: ['No Cost'] },
                        ],
                    },
                    {
                        _key: 'tbl-1',
                        tableTitle: 'Long-Term Disability Insurance',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Benefit', cells: ['50% of income'] },
                            { _key: 'row-1', label: 'Monthly Maximum', cells: ['$6,000/month'] },
                            { _key: 'row-2', label: 'Elimination Period', cells: ['90 Days'] },
                            { _key: 'row-3', label: 'Benefit Duration', cells: ['To SS Retirement Age'] },
                        ],
                    },
                ],
            },

            // ── Chapter 10: Life Insurance & AD&D ──
            {
                _id: `${prefix}-ch-life-insurance`,
                title: 'Life Insurance & AD&D',
                slug: 'life-insurance-and-add',
                icon: 'umbrella',
                order: 10,
                description: 'Life and Accidental Death & Dismemberment Insurance for financial protection for your loved ones.',
                content: textToBlocks([
                    "We're committed to providing financial security for your loved ones in case the unexpected happens.",
                    "That's why we offer Life and Accidental Death & Dismemberment Insurance, to provide financial protection for your loved ones.",
                    "If you are a full-time employee, you automatically receive Life and AD&D insurance even if you elect to waive other coverage.",
                    "As a full-time employee, you automatically receive basic life insurance, up to $50,000. This ensures that your designated beneficiaries will receive a benefit in the event of your death or accidental injury.",
                    "You also have the option to purchase additional Voluntary Life and AD&D insurance for yourself, your spouse, or your dependents, providing financial flexibility that suits your family's needs.",
                    "Remember, it's essential to name a primary and contingent beneficiary to ensure your benefits are distributed according to your wishes. This is the person you designate to receive your Life insurance benefits in the event of your death.",
                ]),
                tables: [
                    {
                        _key: 'tbl-0',
                        tableTitle: 'Life Insurance & AD&D Summary',
                        columns: [{ _key: 'col-0', key: 'details', label: 'Details' }],
                        rows: [
                            { _key: 'row-0', label: 'Basic Life Insurance', cells: ['Up to $50,000'] },
                            { _key: 'row-1', label: 'Basic AD&D', cells: ['Included'] },
                            { _key: 'row-2', label: 'Cost to Employee', cells: ['No Cost (Employer-Paid)'] },
                            { _key: 'row-3', label: 'Voluntary Life & AD&D', cells: ['Available for Purchase'] },
                            { _key: 'row-4', label: 'Spouse/Dependent Coverage', cells: ['Available for Purchase'] },
                        ],
                    },
                ],
            },
        ];

        for (const ch of chapters) {
            console.log(`  📖 Creating Chapter: ${ch.title}...`);
            const doc = {
                _id: ch._id,
                _type: 'benefitChapter',
                client: CLIENT_REF,
                title: ch.title,
                slug: { _type: 'slug', current: ch.slug },
                description: ch.description,
                icon: ch.icon,
                order: ch.order,
                content: ch.content,
            };
            if (ch.tables) {
                doc.tables = ch.tables;
            }
            await client.createOrReplace(doc);
        }

        // ═══════════════════════════════════════════════════════════════════
        // 6. ENROLLMENT CHECKLIST
        // ═══════════════════════════════════════════════════════════════════
        console.log('\n✅ Creating Enrollment Checklist...');
        await client.createOrReplace({
            _id: `enrollmentChecklist-${prefix}`,
            _type: 'enrollmentChecklist',
            client: CLIENT_REF,
            title: 'Enrollment Checklist',
            description: 'Use this step-by-step checklist to prepare for open enrollment and make informed decisions about your benefits.',
            items: [
                { _key: 'step-1', step: 1, title: 'Review Your Current Coverage', description: 'Compare your existing benefits with available plans to understand what has changed.' },
                { _key: 'step-2', step: 2, title: 'Assess Your Healthcare Needs', description: 'Consider your medical, dental, and vision needs for the upcoming year.' },
                { _key: 'step-3', step: 3, title: 'Evaluate Plan Options', description: 'Review the HDHP, HMO, and other medical plan options to find the best fit.' },
                { _key: 'step-4', step: 4, title: 'Compare Costs', description: 'Look at bi-weekly premiums, deductibles, copays, and out-of-pocket maximums for each plan.' },
                { _key: 'step-5', step: 5, title: 'Review FSA & HSA Options', description: 'Determine if you should contribute to Flexible Spending or Health Savings Accounts.' },
                { _key: 'step-6', step: 6, title: 'Review Supplemental Benefits', description: 'Consider optional supplemental insurance like Critical Illness, Hospital Indemnity, or Accident Coverage.' },
                { _key: 'step-7', step: 7, title: 'Confirm Beneficiaries', description: 'Update beneficiaries on life insurance and ensure your benefits are distributed according to your wishes.' },
                { _key: 'step-8', step: 8, title: 'Submit Your Elections', description: 'Complete your enrollment through the benefits portal before the deadline.' },
            ],
            ctaTitle: 'Ready to Enroll?',
            ctaDescription: "Once you've completed this checklist, you're ready to make your benefit elections during open enrollment.",
        });

        // ═══════════════════════════════════════════════════════════════════
        // 7. BENEFIT CHANGES PAGE
        // ═══════════════════════════════════════════════════════════════════
        console.log('🔄 Creating Benefit Changes Page...');
        await client.createOrReplace({
            _id: `benefitChangesPage-${prefix}`,
            _type: 'benefitChangesPage',
            client: CLIENT_REF,
            title: "What's New This Year",
            description: 'Review the latest changes and improvements to your benefits package.',
            alertMessage: 'Make sure to review all changes before making your elections during open enrollment.',
            changes: [
                { _key: 'change-1', type: 'new', title: 'HSA Employer Contributions', description: 'Premier America contributes $1,100 for individual coverage or $2,100 for family coverage to your HSA each year.' },
                { _key: 'change-2', type: 'new', title: 'LiveHealth Online Virtual Visits', description: 'Access quality healthcare from anywhere with virtual visits through LiveHealth Online for common health issues.' },
                { _key: 'change-3', type: 'update', title: 'Updated FSA Contribution Limits', description: 'Healthcare FSA contribution limit is now $3,300 annually. Dependent Care FSA allows up to $5,000 pre-tax.' },
                { _key: 'change-4', type: 'update', title: 'HSA Contribution Limits', description: 'HSA limits updated to $4,300 for individual and $8,550 for family coverage, with $1,000 catch-up for 55+.' },
            ],
            ctaTitle: 'Ready to Review Your Benefits?',
            ctaDescription: 'Take time to review all the changes and consider how they might impact your benefits selections. Contact hrd@premieramerica.com for any questions.',
        });

        console.log('\n✅ Full site for Premier America Credit Union seeded successfully!');
        console.log('🔗 Visit http://localhost:3000/premier-america to see the data live.');

    } catch (error) {
        console.error('❌ Error seeding Premier America data:', error.message);
    }
}

seedPremierAmerica();
