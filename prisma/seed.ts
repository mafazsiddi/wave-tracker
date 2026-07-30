import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_ENTRIES = [
  // Germany Email Performance
  {
    quarter: "JAS26",
    channel: "email",
    kind: "performance",
    group: "live",
    country: "Germany",
    date: "2026-01-07",
    title: "Germany_Munchen_female_RT Batch2",
    subjectLine: "Der Wandel nach der E-Rechnung — München, 10. Juli",
    emailsSent: 206.0,
    emailsOpened: 47.0,
    emailsUnopened: 153.0,
    bounced: 6.0,
    softBounce: 0.0,
    hardBounce: 6.0,
    totalDelivered: 200,
    deliverabilityRate: 97.09,
    uniqueClicks: 10.0,
    openRate: 22.82,
    deliveryRate: 97.09,
    htmlOpenRate: 23.5,
    ctor: 21.28,
    optOuts: 2.0,
    attachedLink: "https://resources.cleartaxksa.com/l/1063922/2026-06-30/f55hgs",
    emailLink: "https://cleartax.lightning.force.com/lightning/page/pardot/report",
    notes: "Munich regional rollout",
    status: "Done"
  },
  {
    quarter: "JAS26",
    channel: "email",
    kind: "performance",
    group: "live",
    country: "Germany",
    date: "2026-01-07",
    title: "Germany_Munchen_male_RT Batch2",
    subjectLine: "Der Wandel nach der E-Rechnung — München, 10. Juli",
    emailsSent: 817.0,
    emailsOpened: 161.0,
    emailsUnopened: 642.0,
    bounced: 14.0,
    softBounce: 2.0,
    hardBounce: 12.0,
    totalDelivered: 803,
    deliverabilityRate: 98.29,
    uniqueClicks: 43.0,
    openRate: 19.71,
    deliveryRate: 98.29,
    htmlOpenRate: 20.05,
    ctor: 28.57,
    optOuts: 5.0,
    attachedLink: "https://resources.cleartaxksa.com/l/1063922/2026-06-30/f55hgs",
    emailLink: "https://cleartax.lightning.force.com/lightning/page/pardot/report",
    notes: "Munich executive sequence",
    status: "Done"
  },
  // France Email Performance
  {
    quarter: "JAS26",
    channel: "email",
    kind: "performance",
    group: "live",
    country: "France",
    date: "2026-01-07",
    title: "29th April webinar_ France_TP-1",
    subjectLine: "Depuis avril, les mesures sanitaires en France sont devenues plus strictes.",
    emailsSent: 49.0,
    emailsOpened: 8.0,
    emailsUnopened: 37.0,
    bounced: 4.0,
    softBounce: 0.0,
    hardBounce: 4.0,
    totalDelivered: 45,
    deliverabilityRate: 91.84,
    uniqueClicks: 1.0,
    openRate: 16.33,
    deliveryRate: 91.84,
    htmlOpenRate: 17.78,
    ctor: 12.5,
    optOuts: 1.0,
    attachedLink: "https://resource.cleartax.in/l/1058423/2026-07-01/y6l9n1",
    emailLink: "https://cleartax.lightning.force.com/lightning/page/pardot/report",
    notes: "France e-reporting update",
    status: "Done"
  },
  // UAE Social Performance
  {
    quarter: "JAS26",
    channel: "social",
    kind: "performance",
    group: "live",
    country: "UAE",
    date: "2026-07-03",
    status: "Done",
    day: "Friday",
    slot: 3.0,
    bucket: "Social Proof",
    contentType: "Post",
    title: "The FTA e-invoicing mandate isn't waiting. Neither should you.",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7478712117936713728",
    impressions: 429.0,
    views: 0.0,
    clicks: 244.0,
    ctr: 56.87,
    likes: 7.0,
    commentsCount: 0.0,
    reposts: 1.0,
    engagementRate: 58.74,
    cta: "Let's talk; the runway is shorter than it looks.",
    notes: "High engagement post"
  },
  // KSA Social Performance
  {
    quarter: "JAS26",
    channel: "social",
    kind: "performance",
    group: "postwave",
    country: "KSA",
    date: "2026-07-02",
    status: "Done",
    day: "Thursday",
    slot: 1.0,
    bucket: "Hygiene",
    contentType: "Post",
    title: "ZATCA's Fines Cancellation Initiative is now extended to 2026.",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7478432458900705280",
    impressions: 987.0,
    views: 0.0,
    clicks: 22.0,
    ctr: 2.22,
    likes: 30.0,
    commentsCount: 0.0,
    reposts: 3.0,
    engagementRate: 5.57,
    cta: "Download Checklist",
    notes: "ZATCA initiative announcement"
  },
  // India Email Performance
  {
    quarter: "JAS26",
    channel: "email",
    kind: "performance",
    group: "postwave",
    country: "India",
    date: "2026-06-07",
    title: "E-Way_Bill_Customers Infinitely infinite",
    subjectLine: "Important Update: API Documentation for Mandatory GSTN Changes",
    emailsSent: 22467.0,
    emailsOpened: 2959.0,
    emailsUnopened: 19379.0,
    bounced: 129.0,
    softBounce: 44.0,
    hardBounce: 85.0,
    totalDelivered: 22338,
    deliverabilityRate: 99.43,
    uniqueClicks: 81.0,
    openRate: 13.17,
    deliveryRate: 99.43,
    htmlOpenRate: 13.25,
    ctor: 6.18,
    optOuts: 9.0,
    attachedLink: "https://www.gst.gov.in/newsandupdates/read/661",
    emailLink: "https://cleartax.lightning.force.com/lightning/page/pardot/report",
    notes: "GSTN API docs update",
    status: "Done"
  },
  // India Email Calendar
  {
    quarter: "JAS26",
    channel: "email",
    kind: "calendar",
    group: "postwave",
    country: "India",
    drip: "Hunting — IDT NAL",
    target: "Generate MQL, increase consumption of our content | Targeting IDT NAL",
    emailNum: "Email 1",
    purpose: "Hook — the problem, why act now (pain-led, no product pitch)",
    topic: "Data lake story",
    status: "Active",
    accounts: "1200",
    contacts: "4500",
    notes: "CCC IDT - Decision maker deck",
    deploymentDate: "2026-08-10"
  },
  {
    quarter: "JAS26",
    channel: "email",
    kind: "calendar",
    group: "postwave",
    country: "India",
    drip: "Hunting — IDT NAL",
    target: "Generate MQL, increase consumption of our content | Targeting IDT NAL",
    emailNum: "Email 2",
    purpose: "Flagship asset — guide / report / whitepaper download",
    topic: "Asset - on PADS",
    status: "Active",
    accounts: "1200",
    contacts: "4500",
    notes: "India CFO Survey Report",
    deploymentDate: "2026-08-17"
  },
  // UAE Copies
  {
    quarter: "JAS26",
    channel: "email",
    kind: "copies",
    group: "live",
    country: "UAE",
    name: "UAE_Webinar Invite - 21st July",
    copyText: "Subject line: 60.5% of UAE ERPs can't generate a compliant e-invoice. Is yours one?\nHi [First Name],\nThe UAE's e-invoicing mandate goes live on January 1, 2027. Join our live CFO Benchmarking Workshop on 21 July 2026 to evaluate your ERP readiness.",
    bannerLink: "https://resources.cleartaxksa.com/l/1063922/2026-07-14/f56ymd/UAE_Webinar_ad.jpg",
    version: "v1.2",
    notes: "Webinar invitation copy for UAE executive list"
  },
  // Oman Social Performance
  {
    quarter: "JAS26",
    channel: "social",
    kind: "performance",
    group: "attack",
    country: "Oman",
    date: "2026-07-09",
    status: "Done",
    day: "Thursday",
    slot: 1.0,
    bucket: "Social Proof",
    contentType: "Post",
    title: "ClearTax is now an OTA-accredited E-Invoicing Service Provider in Oman!",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7480967265526640641",
    impressions: 2228.0,
    views: 0.0,
    clicks: 72.0,
    ctr: 3.23,
    likes: 100.0,
    commentsCount: 0.0,
    reposts: 10.0,
    engagementRate: 8.16,
    cta: "Learn More",
    notes: "OTA Accreditation announcement post"
  },

  // Additional Data for OND26 Quarter
  {
    quarter: "OND26",
    channel: "email",
    kind: "performance",
    group: "live",
    country: "Germany",
    date: "2026-10-12",
    title: "Germany_Q4_E-Invoicing_Prep_Batch1",
    subjectLine: "Nur noch 3 Monate bis zur E-Rechnung 2027 – Sind Sie bereit?",
    emailsSent: 1450.0,
    emailsOpened: 412.0,
    emailsUnopened: 1038.0,
    bounced: 18.0,
    softBounce: 4.0,
    hardBounce: 14.0,
    totalDelivered: 1432,
    deliverabilityRate: 98.75,
    uniqueClicks: 89.0,
    openRate: 28.41,
    deliveryRate: 98.75,
    htmlOpenRate: 28.77,
    ctor: 21.60,
    optOuts: 4.0,
    attachedLink: "https://www.cleartax.com/de/q4-checklist",
    emailLink: "https://cleartax.lightning.force.com/lightning/page/pardot/report",
    notes: "Q4 Germany countdown push",
    status: "Done"
  },
  {
    quarter: "OND26",
    channel: "social",
    kind: "performance",
    group: "live",
    country: "UAE",
    date: "2026-11-05",
    status: "Done",
    day: "Thursday",
    slot: 2.0,
    bucket: "Thought Leadership",
    contentType: "Carousel",
    title: "5 Days left to appoint your ASP in UAE – Cabinet Decision No. 106 Breakdown",
    link: "https://www.linkedin.com/feed/update/urn:li:activity:7490000000000000000",
    impressions: 3410.0,
    views: 1200.0,
    clicks: 410.0,
    ctr: 12.02,
    likes: 180.0,
    commentsCount: 14.0,
    reposts: 22.0,
    engagementRate: 18.35,
    cta: "Appoint ASP Now",
    notes: "Top performing carousel post for UAE Q4"
  }
];

async function main() {
  console.log('Seeding Wave Tracker database...');

  // Create default WaveMeta
  await prisma.waveMeta.upsert({
    where: { id: 'default' },
    update: {
      // Active quarters confirmed by marketing (Shweta): start with JAS26, add quarter-wise later
      quarters: ['JAS26'],
      // Country & stage mappings confirmed by marketing (Shweta) — 30 Jul 2026
      stageGroups: {
        postwave: ['KSA', 'Malaysia', 'India', 'Poland', 'Belgium'],
        live: ['UAE', 'France', 'Germany'],
        attack: ['Philippines', 'Oman', 'UK', 'Qatar', 'Spain'],
        activate: ['Netherlands', 'Ireland'],
        watch: ['Singapore', 'US'],
        webinar: ['Global (All Countries)'],
        lifecycle: ['Worldwide']
      },
      passcode: 'wave2026'
    },
    create: {
      id: 'default',
      quarters: ['JAS26'],
      stageGroups: {
        postwave: ['KSA', 'Malaysia', 'India', 'Poland', 'Belgium'],
        live: ['UAE', 'France', 'Germany'],
        attack: ['Philippines', 'Oman', 'UK', 'Qatar', 'Spain'],
        activate: ['Netherlands', 'Ireland'],
        watch: ['Singapore', 'US'],
        webinar: ['Global (All Countries)'],
        lifecycle: ['Worldwide']
      },
      passcode: 'wave2026'
    }
  });

  // Insert seed entries
  for (const entry of SEED_ENTRIES) {
    await prisma.waveEntry.create({
      data: entry as any
    });
  }

  console.log(`Successfully seeded ${SEED_ENTRIES.length} Wave Tracker entries!`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
