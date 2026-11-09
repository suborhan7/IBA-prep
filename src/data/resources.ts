export type Verification =
  | "official-unreadable" // official source, but it blocks automated reading — check it yourself
  | "notice-copy" // a copy of an official notice on a third-party site
  | "press" // newspaper / magazine article
  | "prep-provider" // coaching-centre blog; useful but commercial and unofficial
  | "reference" // well-known educational resource
  | "book"; // offline book (no URL)

export const VERIFICATION_LABEL: Record<Verification, string> = {
  "official-unreadable": "Official — verify yourself",
  "notice-copy": "Copy of official notice",
  press: "Press article (unofficial)",
  "prep-provider": "Prep provider (unofficial)",
  reference: "Established learning resource",
  book: "Book",
};

export interface Resource {
  name: string;
  subject: "General" | "English" | "Mathematics" | "Analytical" | "Exam format";
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "All levels";
  url?: string;
  type: "Official" | "Article" | "Course" | "Practice" | "Reference" | "Video" | "Book" | "Tool";
  points: string[];
  verification: Verification;
  checked: string; // date this entry was researched
}

const D = "2026-11-09";

export const RESOURCES: Resource[] = [
  // ── Exam format
  { name: "IBA, University of Dhaka — MBA admissions site", subject: "Exam format", topic: "Official circular, dates, eligibility", difficulty: "All levels", url: "https://mba.iba-du.edu/", type: "Official", points: ["The only authoritative source for the current intake's test date, structure and rules.", "This app could not read it automatically (the site blocks automated access) — open it yourself and update Settings → Exam format if anything differs."], verification: "official-unreadable", checked: D },
  { name: "MBA admission notice 2025-26 (copy)", subject: "Exam format", topic: "Test date, eligibility, fee, sectional qualifying rule", difficulty: "All levels", url: "https://tbsgraduates.net/?p=21532", type: "Article", points: ["Written test reported for Friday 5 December 2025, 10:00 am; application fee BDT 2,080.", "Candidates must reach a minimum qualifying score in each section (English, Mathematics, Analytical); the cut-off numbers are not published.", "Written test is followed by an interview for shortlisted candidates.", "Eligibility: bachelor's CGPA ≥ 2.50/4 (or 2nd class); SSC and HSC GPA ≥ 3.00/5 each; no third division."], verification: "notice-copy", checked: D },
  { name: "MBA admission notice 2023-24 (copy)", subject: "Exam format", topic: "Earlier intake for comparison", difficulty: "All levels", url: "https://tbsgraduates.net/?p=2202", type: "Article", points: ["Test on 24 November 2023; fee Tk 2,000.", "Same per-section minimum-score rule as 2025-26."], verification: "notice-copy", checked: D },
  { name: "Preparing for the DU-IBA admission test — The Daily Star", subject: "Exam format", topic: "Structure, negative marking, strategy", difficulty: "All levels", url: "https://www.thedailystar.net/campus/education/news/preparing-du-iba-admission-test-4037036", type: "Article", points: ["Student-written piece (Nov 2025): about 70 MCQ marks in 90 minutes (English, Maths, Analytical) plus a 30-mark written part in 30 minutes.", "Worked example implies 0.25 deducted per wrong answer.", "Unofficial — the author notes the split may change year to year."], verification: "press", checked: D },
  { name: "Mastering MBA admission journey — The Financial Express", subject: "Exam format", topic: "Section cut-offs, interview", difficulty: "All levels", url: "https://thefinancialexpress.com.bd/education/article/mastering-mba-admission-journey", type: "Article", points: ["Sept 2023: mentions per-section cut-off marks and that the interview tests communication.", "Quotes a student describing 0.2 negative marking — conflicts with other sources (0.25)."], verification: "press", checked: D },
  { name: "IBA admission test guide — PIE Academy", subject: "Exam format", topic: "Question counts, writing, viva", difficulty: "All levels", url: "https://blog.mypiebd.com/iba-admission-test/", type: "Article", points: ["Older pattern: 30 English, 30 Maths, 15–20 Analytical MCQs; 1 mark each, −0.25 per wrong.", "30-minute writing section; viva of 5–15 minutes.", "Coaching-centre blog (2021, updated 2023)."], verification: "prep-provider", checked: D },
  { name: "IBA MBA admission question pattern — Admission Guru", subject: "Exam format", topic: "Question types per section", difficulty: "All levels", url: "https://admission-guru.com/iba-mba-admission-question-pattern/", type: "Article", points: ["English: sentence completion, error identification, correct sentence, synonyms/antonyms, analogy, idioms, comprehension.", "Maths topics: percentages, profit/loss, ratio, averages, work, speed, geometry, probability.", "Analytical: puzzles, critical reasoning, data sufficiency (not every year).", "Says section pass marks vary between roughly 40% and 60% — unverified."], verification: "prep-provider", checked: D },
  { name: "IBA MBA English section guide — WoahCab", subject: "English", topic: "English question types and vocabulary", difficulty: "Intermediate", url: "https://www.woahcab.com/blog/iba-mba-admission-test-english-vocabulary", type: "Article", points: ["Describes eight English question types and a 30-minute writing section.", "Vendor blog promoting a course — treat claims as unverified."], verification: "prep-provider", checked: D },

  // ── English
  { name: "Purdue Online Writing Lab (OWL)", subject: "English", topic: "Grammar, punctuation, sentence clarity", difficulty: "All levels", url: "https://owl.purdue.edu/owl/general_writing/grammar/index.html", type: "Reference", points: ["Clear rules with examples for agreement, modifiers, parallelism and punctuation.", "Good for the 30-minute written part as well."], verification: "reference", checked: D },
  { name: "Cambridge Dictionary", subject: "English", topic: "Meanings, pronunciation, collocations", difficulty: "All levels", url: "https://dictionary.cambridge.org/", type: "Reference", points: ["British and American IPA with audio.", "Shows typical collocations and grammar patterns ('averse to', 'insist on')."], verification: "reference", checked: D },
  { name: "Merriam-Webster", subject: "English", topic: "Meanings and usage notes", difficulty: "All levels", url: "https://www.merriam-webster.com/", type: "Reference", points: ["Usage notes explain confusing pairs (affect/effect, imply/infer)."], verification: "reference", checked: D },
  { name: "Vocabulary.com", subject: "English", topic: "Adaptive vocabulary practice", difficulty: "Intermediate", url: "https://www.vocabulary.com/", type: "Practice", points: ["Plain-English definitions with real example sentences.", "Use alongside this app's Vocabulary Lab for extra exposure."], verification: "reference", checked: D },
  { name: "BBC Learning English", subject: "English", topic: "Grammar and listening", difficulty: "Intermediate", url: "https://www.bbc.co.uk/learningenglish", type: "Course", points: ["Short grammar lessons and news-based reading/listening.", "Helpful for the viva's spoken English."], verification: "reference", checked: D },
  { name: "Official GMAT Verbal practice (mba.com)", subject: "English", topic: "Critical reasoning and reading comprehension", difficulty: "Advanced", url: "https://www.mba.com/exams/gmat-exam/prepare-for-the-gmat-exam", type: "Practice", points: ["Free starter kit with official questions.", "GMAT-style CR/RC is harder than typical admission tests — good stretch practice."], verification: "reference", checked: D },
  { name: "High School English Grammar & Composition — Wren & Martin", subject: "English", topic: "Grammar foundations", difficulty: "Beginner", type: "Book", points: ["Classic grammar reference widely used in Bangladesh.", "Use the exercises on prepositions, narration and voice."], verification: "book", checked: D },
  { name: "Word Power Made Easy — Norman Lewis", subject: "English", topic: "Roots, prefixes and suffixes", difficulty: "Intermediate", type: "Book", points: ["Builds vocabulary through Latin/Greek roots — matches the root-word view in this app."], verification: "book", checked: D },

  // ── Mathematics
  { name: "Khan Academy — Arithmetic, Algebra, Geometry", subject: "Mathematics", topic: "Concept refreshers", difficulty: "All levels", url: "https://www.khanacademy.org/math", type: "Course", points: ["Free videos and adaptive exercises for any weak concept.", "Use it when the app flags a conceptual (not speed) weakness."], verification: "reference", checked: D },
  { name: "OpenStax — Introductory Statistics", subject: "Mathematics", topic: "Statistics and probability", difficulty: "Intermediate", url: "https://openstax.org/details/books/introductory-statistics-2e", type: "Book", points: ["Free textbook with worked examples on mean, median, probability."], verification: "reference", checked: D },
  { name: "Official GRE Quantitative practice (ETS)", subject: "Mathematics", topic: "Problem solving, data interpretation", difficulty: "Advanced", url: "https://www.ets.org/gre/test-takers/general-test/prepare.html", type: "Practice", points: ["Free official practice tests.", "Good for data-interpretation and quantitative-comparison style thinking."], verification: "reference", checked: D },
  { name: "IndiaBIX — Aptitude", subject: "Mathematics", topic: "Arithmetic drills (time & work, speed, percentages)", difficulty: "Intermediate", url: "https://www.indiabix.com/aptitude/questions-and-answers/", type: "Practice", points: ["Large bank of standard arithmetic questions with solutions.", "Quality varies — check answers you doubt."], verification: "prep-provider", checked: D },
  { name: "Quantitative Aptitude for Competitive Examinations — R. S. Aggarwal", subject: "Mathematics", topic: "Arithmetic drills", difficulty: "Intermediate", type: "Book", points: ["Exhaustive drill book commonly used for bank and admission tests."], verification: "book", checked: D },

  // ── Analytical
  { name: "IndiaBIX — Logical Reasoning", subject: "Analytical", topic: "Series, coding, blood relations, syllogisms", difficulty: "Intermediate", url: "https://www.indiabix.com/logical-reasoning/questions-and-answers/", type: "Practice", points: ["Categorised logical-reasoning sets with answers."], verification: "prep-provider", checked: D },
  { name: "GMAT Club — Critical Reasoning forum", subject: "Analytical", topic: "Critical reasoning discussion", difficulty: "Advanced", url: "https://gmatclub.com/forum/critical-reasoning-cr-139/", type: "Practice", points: ["Thousands of CR questions with community explanations.", "Filter by difficulty tags."], verification: "prep-provider", checked: D },
  { name: "Stanford Encyclopedia of Philosophy — Informal fallacies", subject: "Analytical", topic: "Logical fallacies", difficulty: "Advanced", url: "https://plato.stanford.edu/entries/fallacies/", type: "Reference", points: ["Authoritative explanation of ad hominem, false cause, equivocation and more."], verification: "reference", checked: D },
];
