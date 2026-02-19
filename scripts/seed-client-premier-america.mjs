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
            contactInfo: [
                { _key: 'c-hr', label: 'HR Department', value: '818-772-4000 | hrd@premieramerica.com', href: 'mailto:hrd@premieramerica.com' },
            ],
            quickLinks: [
                { _key: 'ql-1', label: 'Anthem Blue Cross (Medical/Dental)', href: 'https://www.anthem.com' },
                { _key: 'ql-2', label: 'EyeMed (Vision)', href: 'https://www.eyemed.com' },
                { _key: 'ql-3', label: 'LiveHealth Online (Telemedicine)', href: 'https://livehealthonline.com' },
                { _key: 'ql-4', label: 'HealthEquity (FSA)', href: 'https://www.healthequity.com/wageworks' },
                { _key: 'ql-5', label: 'Mutual of Omaha (Life/Disability/EAP)', href: 'https://www.mutualofomaha.com' },
                { _key: 'ql-6', label: 'Allstate (Supplemental Health)', href: 'https://www.allstatebenefits.com/mybenefits' },
                { _key: 'ql-7', label: 'Nationwide (Pet Insurance)', href: 'https://www.petinsurance.com/affiliates/premier' },
                { _key: 'ql-8', label: 'ScholarShare 529 (College Savings)', href: 'https://ScholarShare529.com' },
            ],
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
        // 5. BENEFIT CHAPTERS (10 Chapters)
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
                planDetails: [
                    { _key: 'pd-1', label: 'Eligible Employees', inNetwork: 'Full-time, 30+ hrs/week', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Spouse/Domestic Partner', inNetwork: 'Eligible', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Dependent Children', inNetwork: 'Up to Age 26', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Disabled Dependents', inNetwork: 'Beyond Age 26 (if certified)', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Mid-Year Changes', inNetwork: 'Qualifying Life Event Only', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Plan Option', inNetwork: 'HDHP', outOfNetwork: 'HMO / HSA-Eligible' },
                    { _key: 'pd-2', label: 'Administered By', inNetwork: 'Anthem Blue Cross', outOfNetwork: 'Anthem Blue Cross' },
                    { _key: 'pd-3', label: 'Bi-Weekly Premium (Employee Only)', inNetwork: '$91.19', outOfNetwork: '$0 / $0' },
                    { _key: 'pd-4', label: 'Network Type', inNetwork: 'In & Out-of-Network', outOfNetwork: 'In-Network Only / HSA Eligible' },
                    { _key: 'pd-5', label: 'PCP Required', inNetwork: 'No', outOfNetwork: 'Yes (HMO) / No' },
                    { _key: 'pd-6', label: 'HSA Compatible', inNetwork: 'No', outOfNetwork: 'No / Yes' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Bi-Weekly Premium (Employee Only)', inNetwork: '$91.19', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Annual Deductible (Individual)', inNetwork: '$1,650', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Annual Deductible (Family)', inNetwork: '$4,100 ($3,300/member)', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Out-of-Pocket Max (Individual)', inNetwork: '$4,250', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Out-of-Pocket Max (Family)', inNetwork: '$8,500', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'Coinsurance (Your Share)', inNetwork: '20%', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Preventive Care', inNetwork: '100% Covered', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Primary Physician Office Visit', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'Specialist Office Visit', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-10', label: 'Inpatient Care', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-11', label: 'Urgent Care', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-12', label: 'Emergency Room', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-13', label: 'Outpatient Surgery', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-14', label: 'Independent Labs', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-15', label: 'Outpatient X-Rays', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-16', label: 'Imaging (MRI, CT, PET, etc.)', inNetwork: '20% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-17', label: 'Virtual Visits (LiveHealth Online)', inNetwork: 'Available', outOfNetwork: '—' },
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
                    "Your dental health is a vital part of your overall well-being.",
                    "We offer affordable coverage through Anthem Blue Cross for all eligible employees and their dependents.",
                    "This plan provides coverage for a wide range of dental services, from routine cleanings to more complex procedures.",
                    "For preventive care services, like routine exams and cleanings, this plan covers 100% of the cost.",
                    "Basic services, like fillings or simple extractions, will be covered at 80% in-network after you meet your deductible, and major services, like crowns, are covered at 50% in-network after meeting your deductible.",
                    "This plan also includes orthodontic coverage. You'll pay $1,500 for orthodontic services, and there's a lifetime maximum of $1,500.",
                    "The deductible for this plan is $50 per individual and $150 per family. After you've met your deductible, your plan will help cover costs based on the type of service you receive.",
                    "We also offer a second dental plan starting at a Bi-weekly contribution of $0, and the Anthem Blue Cross PPO plan starting at a Bi-weekly contribution of $19.37 for individual coverage. Dental coverage is administered by Anthem Blue Cross and offers coverage for a wide range of services.",
                ]),
                planDetails: [
                    { _key: 'pd-1', label: 'Bi-Weekly Premium - PPO (Employee Only)', inNetwork: '$19.37', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Bi-Weekly Premium - Plan 2 (Employee Only)', inNetwork: '$0', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Annual Deductible (Individual)', inNetwork: '$50', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Annual Deductible (Family)', inNetwork: '$150', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Preventive Care (Exams & Cleanings)', inNetwork: '100% Covered', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'Basic Services (Fillings, Extractions)', inNetwork: '80% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Major Services (Crowns, Bridges)', inNetwork: '50% after deductible', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Orthodontics', inNetwork: '$1,500', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'Orthodontic Lifetime Maximum', inNetwork: '$1,500', outOfNetwork: '—' },
                    { _key: 'pd-10', label: 'Administered By', inNetwork: 'Anthem Blue Cross', outOfNetwork: '—' },
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
                    "Premier America Credit Union offers quality vision care for you and your family through EyeMed.",
                    "Getting your eyes checked regularly is important, even if you don't wear eyeglasses or contacts. Eye doctors are often the first healthcare professionals to detect chronic systemic diseases, such as high blood pressure and diabetes.",
                    "This plan covers a range of vision services.",
                    "You'll have a $20 copay for eye exams, and whether you need single vision, bifocal, trifocal, or lenticular lenses, they are covered at no charge. These services are covered once every 12 months.",
                    "If you prefer contact lenses instead of glasses, you'll receive a $130 allowance for elective contacts. Medically necessary contact lenses are covered in full.",
                    "For frames, the plan provides a $130 allowance, once every 12 months.",
                    "Premiums start at a Bi-weekly contribution of just $3.36 for individual coverage, providing excellent coverage for your eye exams, glasses, contacts, and more.",
                ]),
                planDetails: [
                    { _key: 'pd-1', label: 'Bi-Weekly Premium (Employee Only)', inNetwork: '$3.36', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Eye Exam', inNetwork: '$20 copay', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Single Vision Lenses', inNetwork: 'No Charge', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Bifocal Lenses', inNetwork: 'No Charge', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Trifocal Lenses', inNetwork: 'No Charge', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'Lenticular Lenses', inNetwork: 'No Charge', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Frames Allowance', inNetwork: '$130 allowance', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Elective Contact Lenses', inNetwork: '$130 allowance', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'Medically Necessary Contacts', inNetwork: 'Covered in Full', outOfNetwork: '—' },
                    { _key: 'pd-10', label: 'Exam Frequency', inNetwork: 'Once every 12 months', outOfNetwork: '—' },
                    { _key: 'pd-11', label: 'Lens Frequency', inNetwork: 'Once every 12 months', outOfNetwork: '—' },
                    { _key: 'pd-12', label: 'Frame Frequency', inNetwork: 'Once every 12 months', outOfNetwork: '—' },
                    { _key: 'pd-13', label: 'Administered By', inNetwork: 'EyeMed', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Healthcare FSA Limit', inNetwork: '$3,300/year', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Healthcare FSA Rollover', inNetwork: 'Use It or Lose It', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Dependent Care FSA Limit', inNetwork: '$5,000/year', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'HSA Limit (Individual)', inNetwork: '$4,300/year', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'HSA Limit (Family)', inNetwork: '$8,550/year', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'HSA Catch-Up (55+)', inNetwork: '+$1,000', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Employer HSA Contribution (Individual)', inNetwork: '$1,100/year', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Employer HSA Contribution (Family)', inNetwork: '$2,100/year', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'HSA Rollover', inNetwork: 'Yes — Funds Roll Over', outOfNetwork: '—' },
                    { _key: 'pd-10', label: 'LUFSA Limit', inNetwork: '$3,300/year', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Cost to Employee', inNetwork: 'No Cost', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Eligibility', inNetwork: 'All Employees (regardless of medical enrollment)', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Mental Health Support', inNetwork: 'Included', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Legal Assistance', inNetwork: 'Included', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Financial Assistance', inNetwork: 'Included', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'Phone Access', inNetwork: '24/7', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Face-to-Face Visits', inNetwork: 'Licensed Professionals', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Confidentiality', inNetwork: 'All Services Confidential', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'Web ID', inNetwork: 'www.mutualofomaha.com/eap', outOfNetwork: '—' },
                    { _key: 'pd-10', label: 'Administered By', inNetwork: 'Mutual of Omaha', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Critical Illness Coverage', inNetwork: 'Lump-Sum Benefit', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Critical Illness - Use of Funds', inNetwork: 'Unrestricted (medical, wages, travel, etc.)', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Hospital Indemnity Coverage', inNetwork: 'Cash Benefits for Hospital/ICU Stay', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Hospital Indemnity - Pregnancy', inNetwork: 'Day 1 Coverage', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Hospital Indemnity - Use of Funds', inNetwork: 'Deductibles, copays, travel, food, everyday expenses', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'Accident Coverage', inNetwork: 'Non-Work-Related Accidents', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'Accident - Use of Funds', inNetwork: 'Deductibles, copays, everyday expenses', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'Administered By', inNetwork: 'Allstate', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'STD Benefit', inNetwork: '55% of income', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'STD Weekly Max', inNetwork: '$1,075/week', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'STD Elimination Period', inNetwork: 'Day 1 Accident / Day 8 Illness', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'STD Benefit Duration', inNetwork: 'Up to 90 Days', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'STD Cost to Employee', inNetwork: 'No Cost', outOfNetwork: '—' },
                    { _key: 'pd-6', label: 'LTD Benefit', inNetwork: '50% of income', outOfNetwork: '—' },
                    { _key: 'pd-7', label: 'LTD Monthly Max', inNetwork: '$6,000/month', outOfNetwork: '—' },
                    { _key: 'pd-8', label: 'LTD Elimination Period', inNetwork: '90 Days', outOfNetwork: '—' },
                    { _key: 'pd-9', label: 'LTD Benefit Duration', inNetwork: 'To SS Retirement Age', outOfNetwork: '—' },
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
                planDetails: [
                    { _key: 'pd-1', label: 'Basic Life Insurance', inNetwork: 'Up to $50,000', outOfNetwork: '—' },
                    { _key: 'pd-2', label: 'Basic AD&D', inNetwork: 'Included', outOfNetwork: '—' },
                    { _key: 'pd-3', label: 'Cost to Employee', inNetwork: 'No Cost (Employer-Paid)', outOfNetwork: '—' },
                    { _key: 'pd-4', label: 'Voluntary Life & AD&D', inNetwork: 'Available for Purchase', outOfNetwork: '—' },
                    { _key: 'pd-5', label: 'Spouse/Dependent Coverage', inNetwork: 'Available for Purchase', outOfNetwork: '—' },
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
            if (ch.planDetails) {
                doc.planDetails = ch.planDetails;
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
