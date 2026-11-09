/**
 * Grammar lessons. Each lesson: rule in plain English → a colour-coded sentence
 * diagram → wrong/right pairs with the exact error highlighted → why the wrong
 * version sounds plausible → practice (questions tagged with the same topic id).
 */

export type Role = "subject" | "verb" | "object" | "modifier" | "connector" | "clause" | "complement" | "plain" | "error";

export interface DiagramPart {
  text: string;
  role: Role;
  note?: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  rule: string;
  diagram: DiagramPart[];
  diagramCaption: string;
  pairs: { wrong: string; right: string; error: string; fix: string; why: string }[];
  plausible: string;
  tips: string[];
}

export const ROLE_STYLE: Record<Role, { label: string; cls: string }> = {
  subject: { label: "Subject", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40" },
  verb: { label: "Verb", cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40" },
  object: { label: "Object", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40" },
  modifier: { label: "Modifier", cls: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40" },
  connector: { label: "Connector", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40" },
  clause: { label: "Clause", cls: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40" },
  complement: { label: "Complement", cls: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40" },
  plain: { label: "", cls: "border-transparent" },
  error: { label: "Error", cls: "bg-red-600/20 text-red-700 dark:text-red-300 border-red-600/60 line-through" },
};

export const LESSONS: GrammarLesson[] = [
  {
    id: "sva",
    title: "Subject–verb agreement",
    rule: "The verb agrees with the true subject, not with the noun closest to it. Strip away prepositional phrases, 'along with / as well as' phrases and relative clauses, then match singular with singular and plural with plural.",
    diagram: [
      { text: "The list", role: "subject", note: "true subject: singular" },
      { text: "of approved vendors", role: "modifier", note: "prepositional phrase — ignore" },
      { text: "is", role: "verb", note: "singular to match 'list'" },
      { text: "on the manager's desk.", role: "complement" },
    ],
    diagramCaption: "Cross out the 'of …' phrase and read 'The list is…'.",
    pairs: [
      { wrong: "The quality of the new phones are impressive.", right: "The quality of the new phones is impressive.", error: "are", fix: "is", why: "The subject is 'quality' (singular); 'phones' is inside the prepositional phrase." },
      { wrong: "The CEO, along with her advisers, are attending the summit.", right: "The CEO, along with her advisers, is attending the summit.", error: "are", fix: "is", why: "'Along with', 'as well as', 'together with' do not make a compound subject." },
      { wrong: "Neither the manager nor the employees was informed.", right: "Neither the manager nor the employees were informed.", error: "was", fix: "were", why: "With either/or and neither/nor, the verb agrees with the nearer subject ('employees')." },
      { wrong: "Each of the proposals have merit.", right: "Each of the proposals has merit.", error: "have", fix: "has", why: "'Each', 'every', 'either', 'neither', 'one' are singular." },
    ],
    plausible: "The plural noun right before the verb 'sounds' like the subject, so the ear pulls the verb toward it.",
    tips: [
      "Collective nouns (team, committee, jury) are usually singular in formal test English.",
      "'A number of' → plural; 'the number of' → singular.",
      "In 'There is/are…', the subject comes after the verb.",
      "Fractions and percentages take the number of the noun after 'of': 'Half of the cake is…', 'Half of the cakes are…'.",
    ],
  },
  {
    id: "tense",
    title: "Tenses and sequence",
    rule: "Choose the tense from the time line. Use the past perfect (had + V3) for the earlier of two past actions; use the present perfect (has/have + V3) for past actions connected to now, never with a specific finished time like 'yesterday' or 'in 2019'.",
    diagram: [
      { text: "By the time the auditors arrived,", role: "clause", note: "later past action: simple past" },
      { text: "the accountant", role: "subject" },
      { text: "had already shredded", role: "verb", note: "earlier past action: past perfect" },
      { text: "the files.", role: "object" },
    ],
    diagramCaption: "Two past events → the earlier one takes 'had'.",
    pairs: [
      { wrong: "I have visited Cox's Bazar last year.", right: "I visited Cox's Bazar last year.", error: "have visited", fix: "visited", why: "A finished time marker ('last year') needs the simple past." },
      { wrong: "She is working here since 2020.", right: "She has been working here since 2020.", error: "is working", fix: "has been working", why: "'Since' + a starting point needs a perfect tense." },
      { wrong: "When I reached the station, the train already left.", right: "When I reached the station, the train had already left.", error: "already left", fix: "had already left", why: "The train left before I reached: earlier past → past perfect." },
      { wrong: "If he will come, we will start.", right: "If he comes, we will start.", error: "will come", fix: "comes", why: "Time and condition clauses (if, when, unless, as soon as) use the present for future meaning." },
    ],
    plausible: "In everyday Bangladeshi English 'I have done it yesterday' is common, so the present perfect feels natural — but it clashes with finished-time words.",
    tips: ["Signal words: since/for → perfect; yesterday/ago/in 2019 → simple past; by the time + past → past perfect.", "Don't shift tenses inside one sentence without a time reason."],
  },
  {
    id: "articles",
    title: "Articles (a, an, the)",
    rule: "'A/an' introduces a singular countable noun the reader doesn't yet know; 'the' points to something specific or unique. Choose a/an by SOUND, not spelling.",
    diagram: [
      { text: "An", role: "modifier", note: "vowel SOUND: 'hon-'" },
      { text: "honest official", role: "subject" },
      { text: "is", role: "verb" },
      { text: "a", role: "modifier", note: "consonant SOUND: 'yoo-'" },
      { text: "useful asset.", role: "complement" },
    ],
    diagramCaption: "Silent h → 'an'; 'u' pronounced 'yoo' → 'a'.",
    pairs: [
      { wrong: "He is a MBA from IBA.", right: "He is an MBA from IBA.", error: "a MBA", fix: "an MBA", why: "'MBA' is pronounced 'em-bee-ay', starting with a vowel sound." },
      { wrong: "The honesty is the best policy.", right: "Honesty is the best policy.", error: "The honesty", fix: "Honesty", why: "Abstract nouns used in a general sense take no article." },
      { wrong: "Sun rises in the east.", right: "The sun rises in the east.", error: "Sun", fix: "The sun", why: "Unique objects take 'the'." },
      { wrong: "She plays the cricket every evening.", right: "She plays cricket every evening.", error: "the cricket", fix: "cricket", why: "No article before names of games; but 'the' before musical instruments ('plays the guitar')." },
    ],
    plausible: "Article rules in Bengali don't map one-to-one onto English, so instinct isn't reliable — apply the sound rule and the specific/general test.",
    tips: ["a European, a university, a one-day match (consonant sounds).", "an hour, an heir, an FIR (vowel sounds).", "'the' + superlative: the best, the most efficient."],
  },
  {
    id: "prepositions",
    title: "Prepositions and fixed pairings",
    rule: "Many verbs, adjectives and nouns take a fixed preposition. The test checks these 'idiomatic' pairings — they must be memorised, not reasoned out.",
    diagram: [
      { text: "The new policy", role: "subject" },
      { text: "is", role: "verb" },
      { text: "conducive", role: "complement" },
      { text: "to", role: "connector", note: "fixed: conducive TO" },
      { text: "growth.", role: "object" },
    ],
    diagramCaption: "Adjective + fixed preposition.",
    pairs: [
      { wrong: "She is good in mathematics.", right: "She is good at mathematics.", error: "in", fix: "at", why: "good at, bad at, adept at." },
      { wrong: "He insisted to pay the bill.", right: "He insisted on paying the bill.", error: "to pay", fix: "on paying", why: "insist on + -ing." },
      { wrong: "The CEO is senior than me.", right: "The CEO is senior to me.", error: "than", fix: "to", why: "senior, junior, superior, inferior, prior, prefer … take 'to', not 'than'." },
      { wrong: "We discussed about the budget.", right: "We discussed the budget.", error: "about", fix: "(nothing)", why: "'Discuss' is transitive; no preposition. Same for 'emphasise', 'enter', 'reach', 'request'." },
      { wrong: "He is accused for fraud.", right: "He is accused of fraud.", error: "for", fix: "of", why: "accused of, charged with, convicted of." },
    ],
    plausible: "Translations from Bengali ('discuss about') and analogies with other words ('better than' → 'senior than') make the wrong form feel right.",
    tips: ["comply with, abide by, adhere to, consist of, comprise (no 'of'), differ from/with, indifferent to, averse to, capable of, prohibit from, prevent from, deter from, aim at, according to."],
  },
  {
    id: "pronouns",
    title: "Pronouns: case, agreement, ambiguity",
    rule: "A pronoun must (1) clearly refer to one noun, (2) agree with it in number, and (3) be in the right case: subject (I, he, who) or object (me, him, whom).",
    diagram: [
      { text: "Between", role: "connector" },
      { text: "you and me,", role: "object", note: "objects of 'between' → object case" },
      { text: "the company", role: "subject", note: "singular" },
      { text: "has lost", role: "verb" },
      { text: "its", role: "modifier", note: "singular to match 'company'" },
      { text: "edge.", role: "object" },
    ],
    diagramCaption: "After a preposition use object pronouns; collective company → 'its'.",
    pairs: [
      { wrong: "Between you and I, the plan is flawed.", right: "Between you and me, the plan is flawed.", error: "I", fix: "me", why: "Objects of prepositions take object case." },
      { wrong: "The committee submitted their report.", right: "The committee submitted its report.", error: "their", fix: "its", why: "Treated as a single body, the committee is singular." },
      { wrong: "Rahim told Karim that he had been promoted.", right: "Rahim told Karim, \"You have been promoted.\"", error: "he", fix: "(clarify)", why: "'He' could mean either man — an ambiguous pronoun is an error on tests." },
      { wrong: "He is taller than me.", right: "He is taller than I (am).", error: "me", fix: "I", why: "Formal test English: complete the comparison mentally — 'than I am'." },
    ],
    plausible: "'You and I' sounds polite, so people over-correct and use 'I' even as an object.",
    tips: ["Drop the other person to test: 'between I'? → no → 'me'.", "who = he/she; whom = him/her: 'Whom did you meet?' → 'I met him'."],
  },
  {
    id: "modifiers",
    title: "Misplaced and dangling modifiers",
    rule: "A modifying phrase must sit right next to the thing it describes. An opening '-ing' or '-ed' phrase describes the subject that comes immediately after the comma.",
    diagram: [
      { text: "Having finished the audit,", role: "modifier", note: "who finished? → must be next" },
      { text: "the team", role: "subject", note: "✓ the team finished" },
      { text: "submitted", role: "verb" },
      { text: "the report.", role: "object" },
    ],
    diagramCaption: "Modifier → comma → the noun it modifies.",
    pairs: [
      { wrong: "Walking into the office, the computer was already on.", right: "Walking into the office, I found the computer already on.", error: "the computer", fix: "I found the computer", why: "The computer was not walking — the modifier dangles." },
      { wrong: "Unlike Dhaka, traffic in Chattogram moves faster.", right: "Unlike that in Dhaka, traffic in Chattogram moves faster.", error: "Dhaka", fix: "that in Dhaka", why: "Compare traffic with traffic, not a city with traffic." },
      { wrong: "She almost scored 90% in every test.", right: "She scored almost 90% in every test.", error: "almost scored", fix: "scored almost", why: "Limiting words (almost, only, nearly, just) go immediately before what they limit." },
    ],
    plausible: "The reader's brain fills in the logical meaning, so the sentence seems fine until you ask 'who is doing the -ing?'.",
    tips: ["Ask: WHO is doing the action in the opening phrase? That noun must follow the comma.", "'Unlike/Like X, Y' — X and Y must be the same kind of thing."],
  },
  {
    id: "parallelism",
    title: "Parallelism",
    rule: "Items joined by and/or/but, in a list, or by paired connectors (not only…but also, either…or, both…and) must share the same grammatical form.",
    diagram: [
      { text: "The job requires", role: "clause" },
      { text: "analysing data,", role: "object", note: "-ing" },
      { text: "writing reports,", role: "object", note: "-ing" },
      { text: "and", role: "connector" },
      { text: "presenting results.", role: "object", note: "-ing ✓" },
    ],
    diagramCaption: "Same form across the list.",
    pairs: [
      { wrong: "She likes reading, to swim, and cycling.", right: "She likes reading, swimming, and cycling.", error: "to swim", fix: "swimming", why: "Mixing an infinitive with gerunds breaks the pattern." },
      { wrong: "He is not only intelligent but also works hard.", right: "He is not only intelligent but also hard-working.", error: "works hard", fix: "hard-working", why: "What follows 'not only' and 'but also' must match (adjective / adjective)." },
      { wrong: "The salary in this firm is higher than other firms.", right: "The salary in this firm is higher than that in other firms.", error: "other firms", fix: "that in other firms", why: "Compare salary with salary (also a comparison error)." },
    ],
    plausible: "Each item is grammatical on its own, so the sentence only fails when you line the items up.",
    tips: ["Stack the items vertically in your head and check their first word.", "Place the paired connectors right before the matching elements: 'either by train or by bus'."],
  },
  {
    id: "conditionals",
    title: "Conditional sentences",
    rule: "Type 1 (real future): If + present, will + V1. Type 2 (unreal present): If + past (were), would + V1. Type 3 (unreal past): If + had + V3, would have + V3. Never put 'would' in the if-clause.",
    diagram: [
      { text: "If the bank had approved the loan,", role: "clause", note: "had + V3" },
      { text: "we", role: "subject" },
      { text: "would have expanded", role: "verb", note: "would have + V3" },
      { text: "last year.", role: "modifier" },
    ],
    diagramCaption: "Type 3: imagining a different past.",
    pairs: [
      { wrong: "If I would have known, I would have helped.", right: "If I had known, I would have helped.", error: "would have known", fix: "had known", why: "No 'would' in the if-clause." },
      { wrong: "If I was the CEO, I would cut costs.", right: "If I were the CEO, I would cut costs.", error: "was", fix: "were", why: "Subjunctive 'were' for unreal situations (formal test English)." },
      { wrong: "Had he studied harder, he would pass.", right: "Had he studied harder, he would have passed.", error: "would pass", fix: "would have passed", why: "Inverted 'Had he…' is Type 3 → 'would have + V3'." },
    ],
    plausible: "Speakers double the 'would' because both halves feel hypothetical.",
    tips: ["'Were I…', 'Had I…', 'Should you…' = inverted conditionals without 'if'.", "'I wish I were / had …' follows the same unreal logic."],
  },
  {
    id: "clauses",
    title: "Clauses, fragments and run-ons",
    rule: "Every sentence needs at least one independent clause (subject + finite verb). Two independent clauses need a full stop, a semicolon, or a comma + coordinating conjunction (FANBOYS). 'Which' clauses refer to the noun right before them.",
    diagram: [
      { text: "Profits rose sharply;", role: "clause", note: "independent" },
      { text: "however,", role: "connector", note: "conjunctive adverb" },
      { text: "costs also increased.", role: "clause", note: "independent" },
    ],
    diagramCaption: "Independent ; however, independent.",
    pairs: [
      { wrong: "Profits rose sharply, however costs also increased.", right: "Profits rose sharply; however, costs also increased.", error: ", however", fix: "; however,", why: "'However' cannot join two clauses with only a comma (comma splice)." },
      { wrong: "The report which was submitted late.", right: "The report, which was submitted late, was rejected.", error: "(no main verb)", fix: "add a main verb", why: "A noun + relative clause is a fragment — there is no main verb." },
      { wrong: "The price rose by 20%, which hurt sales.", right: "The 20% price rise hurt sales.", error: "which", fix: "(restructure)", why: "'Which' should refer to a noun, not to a whole idea (strict test style)." },
    ],
    plausible: "Long sentences feel complete because they carry a lot of information even when no main verb is present.",
    tips: ["FANBOYS: for, and, nor, but, or, yet, so.", "'Being' is almost always wrong in the correct answer on GMAT-style correction."],
  },
  {
    id: "gerund-inf",
    title: "Gerunds and infinitives",
    rule: "Some verbs take -ing (avoid, enjoy, consider, deny, suggest, mind, finish, look forward to), some take to + V1 (decide, plan, agree, refuse, hope, manage), and some change meaning (stop, remember, forget, try).",
    diagram: [
      { text: "We", role: "subject" },
      { text: "look forward to", role: "verb", note: "'to' is a preposition here" },
      { text: "meeting", role: "object", note: "-ing after preposition" },
      { text: "you.", role: "object" },
    ],
    diagramCaption: "Preposition 'to' + -ing.",
    pairs: [
      { wrong: "I look forward to meet you.", right: "I look forward to meeting you.", error: "meet", fix: "meeting", why: "In 'look forward to', 'object to', 'be used to', 'with a view to', 'to' is a preposition." },
      { wrong: "He avoided to answer the question.", right: "He avoided answering the question.", error: "to answer", fix: "answering", why: "'Avoid' takes a gerund." },
      { wrong: "She suggested him to apply.", right: "She suggested that he apply.", error: "him to apply", fix: "that he apply", why: "'Suggest' doesn't take object + infinitive; use a that-clause (subjunctive) or a gerund." },
    ],
    plausible: "'to' usually signals an infinitive, so 'look forward to meet' looks natural.",
    tips: ["Test 'to': if you can put a noun after it ('look forward to the meeting'), it's a preposition → -ing.", "stop to smoke (stop in order to) vs stop smoking (quit)."],
  },
  {
    id: "voice",
    title: "Active and passive voice",
    rule: "Passive = form of 'be' + V3; the object becomes the subject. Use it when the doer is unknown or unimportant. Only transitive verbs can be passive.",
    diagram: [
      { text: "The proposal", role: "subject", note: "receiver of action" },
      { text: "was approved", role: "verb", note: "be + V3" },
      { text: "by the board.", role: "modifier", note: "doer (optional)" },
    ],
    diagramCaption: "Active: The board approved the proposal.",
    pairs: [
      { wrong: "The accident was happened at night.", right: "The accident happened at night.", error: "was happened", fix: "happened", why: "'Happen' is intransitive — no passive." },
      { wrong: "The letter has written by the clerk.", right: "The letter has been written by the clerk.", error: "has written", fix: "has been written", why: "Present perfect passive = has been + V3." },
      { wrong: "Let the door be open.", right: "Let the door be opened.", error: "open", fix: "opened", why: "Passive imperative: let + object + be + V3 (when an action is meant)." },
    ],
    plausible: "Bengali often expresses events passively ('accident hoyeche'), which leads to 'was happened'.",
    tips: ["Intransitive verbs (happen, occur, arrive, die, seem) have no passive.", "Modal passive: can be done, should have been done."],
  },
  {
    id: "narration",
    title: "Direct and indirect speech",
    rule: "When the reporting verb is past, shift tenses back (is → was, will → would, has done → had done), change pronouns and time words (now → then, tomorrow → the next day), and turn questions into statements word order.",
    diagram: [
      { text: "He asked", role: "verb", note: "past reporting verb" },
      { text: "where", role: "connector" },
      { text: "I lived.", role: "clause", note: "statement order, tense back-shifted" },
    ],
    diagramCaption: "Direct: He said, \"Where do you live?\"",
    pairs: [
      { wrong: "He asked me where did I live.", right: "He asked me where I lived.", error: "did I live", fix: "I lived", why: "Reported questions use statement word order." },
      { wrong: "She said that she will come tomorrow.", right: "She said that she would come the next day.", error: "will … tomorrow", fix: "would … the next day", why: "Back-shift tense and time word after a past reporting verb." },
      { wrong: "The teacher said that the earth moved round the sun.", right: "The teacher said that the earth moves round the sun.", error: "moved", fix: "moves", why: "Universal truths keep the present tense." },
    ],
    plausible: "The question feels like a question, so writers keep the inverted order.",
    tips: ["say → tell (with object): 'He told me that…'.", "Commands: 'He told me to wait.' Requests: 'He requested me to wait.'"],
  },
  {
    id: "conjunctions",
    title: "Conjunctions and correlatives",
    rule: "Pair connectors correctly: not only…but also, either…or, neither…nor, both…and, no sooner…than, hardly/scarcely…when, though…yet (formal), whether…or. Don't double up ('although…but').",
    diagram: [
      { text: "No sooner had the market opened", role: "clause", note: "inversion after 'No sooner'" },
      { text: "than", role: "connector", note: "not 'when'" },
      { text: "prices crashed.", role: "clause" },
    ],
    diagramCaption: "No sooner … than; Hardly … when.",
    pairs: [
      { wrong: "Although he is rich, but he is unhappy.", right: "Although he is rich, he is unhappy.", error: "but", fix: "(delete)", why: "One contrast word is enough." },
      { wrong: "No sooner did he arrive when the meeting began.", right: "No sooner did he arrive than the meeting began.", error: "when", fix: "than", why: "'No sooner' pairs with 'than'." },
      { wrong: "Hardly had I sat down than the phone rang.", right: "Hardly had I sat down when the phone rang.", error: "than", fix: "when", why: "'Hardly/Scarcely' pair with 'when' (or 'before')." },
      { wrong: "Unless you do not work hard, you will fail.", right: "Unless you work hard, you will fail.", error: "do not", fix: "(delete 'not')", why: "'Unless' already means 'if not'." },
    ],
    plausible: "Bengali uses paired contrast words ('jodio … kintu'), so 'although … but' sounds balanced.",
    tips: ["'Lest' is followed by 'should' or the bare verb, never 'not': 'Work hard lest you (should) fail.'", "'Between … and', never 'between … to'."],
  },
  {
    id: "punctuation",
    title: "Punctuation that changes meaning",
    rule: "Commas set off non-essential information; no comma for essential (restrictive) information. Use a colon after a complete clause to introduce a list or explanation; use a semicolon between two related independent clauses. It's = it is; its = possessive.",
    diagram: [
      { text: "My brother,", role: "subject" },
      { text: "who lives in Sylhet,", role: "modifier", note: "non-essential → commas" },
      { text: "is", role: "verb" },
      { text: "an engineer.", role: "complement" },
    ],
    diagramCaption: "Remove the commas and you imply you have several brothers.",
    pairs: [
      { wrong: "The company announced it's quarterly results.", right: "The company announced its quarterly results.", error: "it's", fix: "its", why: "Possessive 'its' has no apostrophe." },
      { wrong: "The reasons are: cost, time and risk.", right: "There are three reasons: cost, time and risk.", error: "are:", fix: "(complete clause before colon)", why: "A colon should follow a complete independent clause." },
      { wrong: "Students, who cheat, will be expelled.", right: "Students who cheat will be expelled.", error: ", who cheat,", fix: "who cheat", why: "The clause is essential (only cheating students); commas would say all students cheat." },
    ],
    plausible: "Apostrophes usually show possession, so 'it's' feels possessive.",
    tips: ["Test 'it's' by expanding to 'it is'.", "'that' for essential clauses, ', which' for non-essential."],
  },
  {
    id: "redundancy",
    title: "Redundancy and conciseness",
    rule: "Say each idea once. Remove words that repeat a meaning already present. Between two grammatically correct options, the test prefers the shorter, clearer one — unless brevity changes the meaning.",
    diagram: [
      { text: "The two companies", role: "subject" },
      { text: "merged", role: "verb", note: "'merged together' repeats" },
      { text: "in 2021.", role: "modifier" },
    ],
    diagramCaption: "'Merge' already means 'join together'.",
    pairs: [
      { wrong: "The reason why he resigned is because he was underpaid.", right: "He resigned because he was underpaid.", error: "The reason why … is because", fix: "because", why: "'Reason' and 'because' express the same idea twice." },
      { wrong: "Please return back the file.", right: "Please return the file.", error: "back", fix: "(delete)", why: "'Return' means 'go/give back'." },
      { wrong: "Sales increased by 20 percent from 2022 to 2023, which was an increase of 20 percent.", right: "Sales increased by 20 percent from 2022 to 2023.", error: "which was an increase of 20 percent", fix: "(delete)", why: "The clause repeats the figure." },
    ],
    plausible: "Repetition sounds emphatic in speech.",
    tips: ["Common doubles: repeat again, revert back, past history, final outcome, free gift, each and every, consensus of opinion, cooperate together, return back, combine together."],
  },
  {
    id: "comparison",
    title: "Comparisons",
    rule: "Compare like with like, use the comparative (-er/more) for two and superlative (-est/most) for three or more, and never double them ('more better'). 'Than' must follow a comparative; 'as … as' for equality.",
    diagram: [
      { text: "The GDP of Bangladesh", role: "subject" },
      { text: "is larger than", role: "verb" },
      { text: "that of Nepal.", role: "complement", note: "'that' = the GDP" },
    ],
    diagramCaption: "GDP vs GDP, not GDP vs Nepal.",
    pairs: [
      { wrong: "This is the most cheapest option.", right: "This is the cheapest option.", error: "most cheapest", fix: "cheapest", why: "Double superlative." },
      { wrong: "Of the two plans, this is the best.", right: "Of the two plans, this is the better.", error: "best", fix: "better", why: "Two items → comparative." },
      { wrong: "Her salary is higher than her manager.", right: "Her salary is higher than her manager's.", error: "her manager", fix: "her manager's", why: "Compare salary with salary." },
      { wrong: "He is as tall, if not taller than, his brother.", right: "He is as tall as, if not taller than, his brother.", error: "as tall,", fix: "as tall as,", why: "Both comparisons must be complete." },
    ],
    plausible: "Speech often compares a thing with a person ('my phone is better than you') and the meaning is still understood.",
    tips: ["'Superior/inferior/senior/junior/prefer' take 'to'.", "'Fewer' for countable, 'less' for uncountable: fewer errors, less time."],
  },
];
