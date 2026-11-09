import type { Difficulty, Question } from "@/lib/types";

/**
 * Original English practice questions written for this app.
 * None of these are DU IBA past-paper questions. Each was checked for a single
 * defensible answer; see scripts/verify-bank.ts for the automated checks.
 */

type Extra = Partial<Pick<Question, "fastest" | "traps" | "errorSpan" | "objective" | "timeSec">>;

const E = (
  id: string,
  topic: string,
  difficulty: Difficulty,
  stem: string,
  options: string[],
  answer: number,
  explanation: string,
  extra: Extra = {},
): Question => ({
  id: `en-${id}`,
  subject: "english",
  topic,
  difficulty,
  stem,
  options,
  answer,
  explanation,
  fastest: extra.fastest,
  traps: extra.traps,
  errorSpan: extra.errorSpan,
  timeSec: extra.timeSec ?? (difficulty >= 4 ? 60 : 40),
  source: "original",
  objective: extra.objective ?? "",
});

const ERR = "Identify the part of the sentence that contains an error. Choose 'No error' if the sentence is correct.";

export const ENGLISH_QUESTIONS: Question[] = [
  // ───────── Subject–verb agreement
  E("sva1", "sva", 2, `${ERR}\n\nThe performance of the new interns (A) / have exceeded (B) / the expectations of (C) / the senior managers. (D)`, ["A", "B", "C", "D", "No error"], 1,
    "The subject is 'performance' (singular). 'Of the new interns' is a prepositional phrase. Correct: 'has exceeded'.", { errorSpan: "have exceeded", objective: "Find the true subject past a prepositional phrase.", traps: ["Matching the verb to 'interns'."] }),
  E("sva2", "sva", 3, "Choose the correct option.\n\nNeither the chairman nor the directors ____ aware of the irregularities in the accounts.", ["was", "were", "has been", "is"], 1,
    "With 'neither … nor', the verb agrees with the nearer subject, 'directors' (plural) → 'were'.", { objective: "Proximity rule for neither/nor.", traps: ["Treating 'neither' as always singular — that applies to 'neither of', not 'neither … nor'."] }),
  E("sva3", "sva", 4, "Which sentence is grammatically correct?", [
    "A number of employees has complained about the new shift system.",
    "The number of complaints have risen sharply this quarter.",
    "Every one of the auditors and their assistants were questioned.",
    "The number of applicants for the programme has doubled since last year.",
  ], 3,
    "'The number of' is singular (has); 'a number of' is plural (have). Option C: 'Every one' is singular → 'was questioned'.", { objective: "'A number of' vs 'the number of'.", traps: ["Option A looks formal but 'a number of' means 'many' → plural."] }),
  E("sva4", "sva", 5, "Choose the best version of the underlined part.\n\nThe proliferation of mobile banking services, together with the government's push for digital payments, [have transformed how rural households save and borrow].", [
    "have transformed how rural households save and borrow",
    "has transformed how rural households save and borrow",
    "have been transforming how rural households saves and borrows",
    "has transformed how rural households are saving and borrowing it",
  ], 1,
    "Subject = 'proliferation' (singular). 'Together with…' does not create a compound subject → 'has transformed'. Option D adds a meaningless 'it'.", { objective: "Ignore 'together with' phrases.", timeSec: 60 }),

  // ───────── Tenses
  E("tns1", "tense", 2, `${ERR}\n\nI have met (A) / the new country director (B) / at a conference (C) / in Singapore last month. (D)`, ["A", "B", "C", "D", "No error"], 0,
    "'Last month' is a finished time; use simple past 'met', not present perfect.", { errorSpan: "have met", objective: "Present perfect never takes a finished time marker." }),
  E("tns2", "tense", 3, "Choose the correct option.\n\nBy the time the regulator issued its warning, most investors ____ their shares.", ["sold", "have sold", "had already sold", "were selling"], 2,
    "Two past events: selling happened before the warning → past perfect.", { objective: "Past perfect for the earlier past event." }),
  E("tns3", "tense", 3, "Choose the correct option.\n\nShe ____ for this firm for six years before she was promoted to partner.", ["has worked", "had been working", "is working", "was worked"], 1,
    "A continuing action up to a point in the past → past perfect continuous.", { objective: "Duration before a past point." }),
  E("tns4", "tense", 4, "Which sentence is correct?", [
    "As soon as the results will be published, we will inform you.",
    "As soon as the results are published, we will inform you.",
    "As soon as the results would be published, we inform you.",
    "As soon as the results had been published, we will inform you.",
  ], 1,
    "Time clauses (as soon as, when, until, before) use the present tense for future meaning.", { objective: "No 'will' in time clauses." }),

  // ───────── Articles
  E("art1", "articles", 1, "Choose the correct option.\n\nIt took her ____ hour to finish ____ European history chapter.", ["a, an", "an, a", "an, an", "a, a"], 1,
    "'Hour' starts with a vowel sound (silent h) → 'an'. 'European' starts with a 'y' sound → 'a'.", { objective: "Choose a/an by sound." }),
  E("art2", "articles", 3, `${ERR}\n\nThe honesty (A) / is often regarded (B) / as the most valuable trait (C) / in a leader. (D)`, ["A", "B", "C", "D", "No error"], 0,
    "Abstract nouns in a general sense take no article: 'Honesty is often regarded…'.", { errorSpan: "The honesty", objective: "No article with general abstract nouns." }),
  E("art3", "articles", 3, "Choose the correct option.\n\n____ Padma Bridge has reduced travel time between Dhaka and ____ south-western districts.", ["The, the", "A, the", "The, —", "—, the"], 0,
    "Specific, unique structure → 'The Padma Bridge'; specific districts identified → 'the south-western districts'.", { objective: "'The' for specific/unique referents." }),

  // ───────── Prepositions
  E("pre1", "prepositions", 2, "Choose the correct option.\n\nThe new manager is senior ____ me by three years.", ["than", "to", "from", "over"], 1,
    "senior/junior/superior/inferior/prior take 'to'.", { objective: "Latin comparatives take 'to'." }),
  E("pre2", "prepositions", 3, `${ERR}\n\nThe board discussed about (A) / the proposal at length (B) / but could not reach (C) / a consensus. (D)`, ["A", "B", "C", "D", "No error"], 0,
    "'Discuss' is transitive: 'discussed the proposal'. No 'about'.", { errorSpan: "discussed about", objective: "Transitive verbs without prepositions." }),
  E("pre3", "prepositions", 3, "Choose the correct option.\n\nThe firm was accused ____ violating labour laws and was later convicted ____ fraud.", ["for, for", "of, of", "with, of", "of, for"], 1,
    "accused of; convicted of.", { objective: "Fixed preposition pairs." }),
  E("pre4", "prepositions", 4, "Choose the correct option.\n\nThe committee comprises ____ seven members, all of whom are averse ____ taking risks.", ["of, to", "—, to", "of, from", "—, from"], 1,
    "'Comprise' takes no 'of' (the whole comprises the parts). 'Averse to'.", { objective: "comprise vs consist of; averse to.", traps: ["'Comprises of' is a common error; 'is comprised of' is disputed — avoid on tests."] }),
  E("pre5", "prepositions", 4, "Choose the option that best completes the sentence.\n\nThe new regulations prohibit banks ____ lending more than 25% of their capital to a single group.", ["to", "from", "against", "for"], 1,
    "'Prohibit someone from doing'. Compare 'forbid someone to do'.", { objective: "prohibit from vs forbid to." }),

  // ───────── Pronouns
  E("pro1", "pronouns", 2, `${ERR}\n\nThe manager asked (A) / Tanvir and I (B) / to prepare the (C) / quarterly report. (D)`, ["A", "B", "C", "D", "No error"], 1,
    "Object of 'asked' → 'Tanvir and me'. Drop 'Tanvir' to test: 'asked I' is wrong.", { errorSpan: "Tanvir and I", objective: "Object case in compound objects." }),
  E("pro2", "pronouns", 3, "Choose the correct option.\n\nThe company has revised ____ leave policy, and every employee must update ____ records.", ["their, their", "its, his or her", "its, their own's", "it's, his or her"], 1,
    "Company = singular → 'its'. 'Every employee' is singular → 'his or her' (formal test style).", { objective: "Pronoun–antecedent number." }),
  E("pro3", "pronouns", 5, "Choose the correct option.\n\nThe award will go to ____ the jury considers most innovative.", ["whom", "whoever", "whomever", "who"], 2,
    "The whole clause '___ the jury considers most innovative' is the object of 'to', but the pronoun's case is decided INSIDE the clause: 'the jury considers HIM most innovative' → object → 'whomever'. Compare: 'The award will go to whoever is most innovative' (there the pronoun is the subject of 'is').", { objective: "who/whom inside noun clauses.", traps: ["Choosing 'whoever' because it follows 'to' — the clause decides the case, not the preposition."] }),
  E("pro4", "pronouns", 3, "Which sentence avoids an ambiguous pronoun?", [
    "When Nadia met Farzana, she was very nervous.",
    "Nadia was very nervous when she met Farzana.",
    "Nadia told Farzana that her presentation was excellent.",
    "When the bank merged with the insurer, it lost many clients.",
  ], 1,
    "In B, 'she' can only refer to Nadia (the subject of the same clause it modifies). A, C and D each have two possible antecedents.", { objective: "Spot ambiguous reference." }),

  // ───────── Modifiers
  E("mod1", "modifiers", 3, "Choose the best version.\n\n[Having reviewed the financial statements, several discrepancies were noticed by the auditor.]", [
    "Having reviewed the financial statements, several discrepancies were noticed by the auditor.",
    "Having reviewed the financial statements, the auditor noticed several discrepancies.",
    "The financial statements having been reviewed, several discrepancies were noticed by the auditor.",
    "Having reviewed the financial statements, there were several discrepancies noticed.",
  ], 1,
    "The person who reviewed must follow the comma: 'the auditor'. A and D dangle; C is wordy and passive.", { objective: "Fix dangling -ing modifiers." }),
  E("mod2", "modifiers", 4, "Choose the best version.\n\n[Unlike most developing economies, Bangladesh's garment exports have grown steadily] despite global shocks.", [
    "Unlike most developing economies, Bangladesh's garment exports have grown steadily",
    "Unlike most developing economies, Bangladesh has seen its garment exports grow steadily",
    "Unlike most developing economies, the garment exports of Bangladesh have grown steadily",
    "Unlike most developing economies, Bangladesh's garment exports, which have grown steadily,",
  ], 1,
    "'Unlike most developing economies' must be followed by another economy. Only B puts 'Bangladesh' right after the comma. A and C compare economies with exports; D also leaves the sentence without a main verb.", { objective: "Logical comparison with 'unlike'.", timeSec: 75 }),
  E("mod3", "modifiers", 3, "Where should 'only' go to say that nobody except the CFO may sign cheques?\n\n'(1) The CFO (2) can sign (3) cheques (4) above Tk 10 lakh.'", ["Before 'The CFO'", "After 'can'", "After 'cheques'", "At the end"], 0,
    "'Only the CFO can sign…' limits the person. 'can only sign' would limit the action.", { objective: "Place limiting words correctly." }),

  // ───────── Parallelism
  E("par1", "parallelism", 2, `${ERR}\n\nThe programme trains participants in (A) / negotiating deals, (B) / managing teams, and (C) / how to lead change. (D)`, ["A", "B", "C", "D", "No error"], 3,
    "List items should match: negotiating, managing, leading change.", { errorSpan: "how to lead change", objective: "Keep list items in the same form." }),
  E("par2", "parallelism", 4, "Choose the best version.\n\nThe new CEO is known [not only for her analytical skills but also because she is compassionate].", [
    "not only for her analytical skills but also because she is compassionate",
    "not only for her analytical skills but also for her compassion",
    "for not only her analytical skills but also because of her compassion",
    "not only because of analytical skills but also her compassion",
  ], 1,
    "'not only for X but also for Y' — both elements are 'for + noun'.", { objective: "Correlative parallelism." }),
  E("par3", "parallelism", 5, "Choose the best version.\n\nThe consultant recommended [that the firm cut costs, diversify its suppliers, and that it should invest in automation].", [
    "that the firm cut costs, diversify its suppliers, and that it should invest in automation",
    "that the firm cut costs, diversify its suppliers, and invest in automation",
    "the firm to cut costs, diversifying its suppliers, and investing in automation",
    "that the firm cuts costs, diversifies its suppliers, and invests in automation",
  ], 1,
    "After 'recommend that', use the subjunctive base verb for each item: cut, diversify, invest. D uses indicative (-s), which is wrong after 'recommend that' in formal English.", { objective: "Parallel subjunctive after recommend/suggest/insist." }),

  // ───────── Conditionals
  E("con1", "conditionals", 2, "Choose the correct option.\n\nIf I ____ the governor, I would lower the policy rate.", ["am", "was", "were", "had been"], 2,
    "Unreal present → 'were' (subjunctive) for all persons in formal English.", { objective: "Second conditional." }),
  E("con2", "conditionals", 3, `${ERR}\n\nIf the company would have hedged (A) / its dollar exposure, (B) / it would not have lost (C) / so much money. (D)`, ["A", "B", "C", "D", "No error"], 0,
    "No 'would' in the if-clause: 'If the company had hedged…'.", { errorSpan: "would have hedged", objective: "Third conditional form." }),
  E("con3", "conditionals", 4, "Choose the correct option.\n\n____ the shipment arrive late, the buyer may cancel the order.", ["If", "Should", "Unless", "Had"], 1,
    "Inverted conditional: 'Should the shipment arrive late' = 'If the shipment should arrive late'. 'If the shipment arrive' would need 'arrives'.", { objective: "Inverted conditionals." }),

  // ───────── Clauses
  E("cla1", "clauses", 3, "Which of the following is a complete, correctly punctuated sentence?", [
    "Inflation fell in March, however, food prices kept rising.",
    "Inflation fell in March; however, food prices kept rising.",
    "Inflation fell in March however food prices, kept rising.",
    "Although inflation fell in March; food prices kept rising.",
  ], 1,
    "'However' between two independent clauses needs a semicolon before it. D wrongly uses a semicolon after a dependent clause.", { objective: "Avoid comma splices." }),
  E("cla2", "clauses", 4, "Which option is a sentence fragment?", [
    "The proposal that the board approved last week.",
    "The board approved the proposal last week.",
    "Last week, the proposal was approved.",
    "Approved last week, the proposal will take effect in July.",
  ], 0,
    "A has a subject ('The proposal') modified by a relative clause, but no main verb.", { objective: "Spot fragments." }),

  // ───────── Gerunds & infinitives
  E("ger1", "gerund-inf", 2, `${ERR}\n\nWe look forward (A) / to receive (B) / your feedback on (C) / the draft proposal. (D)`, ["A", "B", "C", "D", "No error"], 1,
    "In 'look forward to', 'to' is a preposition → 'to receiving'.", { errorSpan: "to receive", objective: "Preposition 'to' + -ing." }),
  E("ger2", "gerund-inf", 3, "Choose the correct option.\n\nThe minister denied ____ any bribe and refused ____ to the press.", ["to take, talking", "taking, to talk", "taking, talking", "to take, to talk"], 1,
    "deny + -ing; refuse + to-infinitive.", { objective: "Verb patterns." }),
  E("ger3", "gerund-inf", 4, "What does the sentence mean?\n\n'He stopped to check his email.'", [
    "He quit the habit of checking email.",
    "He paused what he was doing in order to check his email.",
    "He stopped checking email for the day.",
    "He was stopped from checking his email.",
  ], 1,
    "stop + to-infinitive = stop (something else) in order to do. stop + -ing = quit doing.", { objective: "Meaning change: stop/remember/forget/try." }),

  // ───────── Voice
  E("voi1", "voice", 2, `${ERR}\n\nThe fire was occurred (A) / in the warehouse (B) / late at night, (C) / destroying all the stock. (D)`, ["A", "B", "C", "D", "No error"], 0,
    "'Occur' is intransitive — no passive. 'The fire occurred…'.", { errorSpan: "was occurred", objective: "No passive for intransitive verbs." }),
  E("voi2", "voice", 3, "Choose the correct passive form.\n\n'They are building a new terminal at the airport.'", [
    "A new terminal is built at the airport.",
    "A new terminal is being built at the airport.",
    "A new terminal has been building at the airport.",
    "A new terminal was being built at the airport.",
  ], 1,
    "Present continuous active → 'is being + V3'.", { objective: "Passive of continuous tenses." }),

  // ───────── Narration
  E("nar1", "narration", 2, "Choose the correct indirect speech.\n\nThe interviewer said to me, \"Why do you want to join IBA?\"", [
    "The interviewer asked me why did I want to join IBA.",
    "The interviewer asked me why I wanted to join IBA.",
    "The interviewer told me why I want to join IBA.",
    "The interviewer asked me that why I wanted to join IBA.",
  ], 1,
    "Question → 'asked'; statement order; tense back-shift; no 'that' before the question word.", { objective: "Reported questions." }),
  E("nar2", "narration", 3, "Choose the correct indirect speech.\n\nShe said, \"I will submit the report tomorrow.\"", [
    "She said that she will submit the report tomorrow.",
    "She said that she would submit the report the next day.",
    "She said that I would submit the report the next day.",
    "She told that she would submit the report tomorrow.",
  ], 1,
    "will → would; tomorrow → the next day; 'told' needs an object.", { objective: "Tense and time-word shifts." }),

  // ───────── Conjunctions
  E("cnj1", "conjunctions", 2, `${ERR}\n\nAlthough the project was (A) / completed on time, (B) / but it exceeded (C) / the budget. (D)`, ["A", "B", "C", "D", "No error"], 2,
    "Don't pair 'although' with 'but'.", { errorSpan: "but", objective: "One contrast connector per contrast." }),
  E("cnj2", "conjunctions", 3, "Choose the correct option.\n\nScarcely had the CEO finished his speech ____ the shareholders began to protest.", ["than", "when", "then", "that"], 1,
    "'Scarcely/Hardly … when'; 'No sooner … than'.", { objective: "Correlative pairs." }),
  E("cnj3", "conjunctions", 3, "Choose the correct option.\n\nKeep the documents in a safe ____ they get lost.", ["unless", "lest", "so that", "until"], 1,
    "'Lest' = 'for fear that'. 'Unless they get lost' makes no sense; 'so that they get lost' reverses the meaning.", { objective: "lest." }),

  // ───────── Punctuation
  E("pun1", "punctuation", 2, "Which sentence is punctuated correctly?", [
    "The bank reported it's highest profit in a decade.",
    "The bank reported its highest profit in a decade.",
    "The bank reported its' highest profit in a decade.",
    "The banks' reported its highest profit in a decade.",
  ], 1,
    "Possessive 'its' has no apostrophe; 'it's' = 'it is'.", { objective: "its vs it's." }),
  E("pun2", "punctuation", 4, "Which sentence says that ALL the employees received a bonus?", [
    "The employees who met their targets received a bonus.",
    "The employees, who met their targets, received a bonus.",
    "The employees that met their targets received a bonus.",
    "Only the employees who met their targets received a bonus.",
  ], 1,
    "Commas make the clause non-essential: all the employees met their targets and all received a bonus.", { objective: "Restrictive vs non-restrictive clauses." }),

  // ───────── Redundancy
  E("red1", "redundancy", 2, "Choose the most concise correct version.\n\n'The two firms decided to cooperate together on a joint venture.'", [
    "The two firms decided to cooperate together on a joint venture.",
    "The two firms decided to cooperate on a venture.",
    "The two firms decided to cooperate on a joint venture together.",
    "The two firms decided together to cooperate jointly.",
  ], 1,
    "'Cooperate' already implies 'together'; 'joint venture' plus 'cooperate' repeats the idea, so 'a venture' is enough.", { objective: "Remove repeated meaning." }),
  E("red2", "redundancy", 3, "Choose the best version.\n\n[The reason why sales fell is because the price was raised].", [
    "The reason why sales fell is because the price was raised",
    "Sales fell because the price was raised",
    "The reason sales fell is due to the fact that the price was raised",
    "Because the price was raised is the reason sales fell",
  ], 1,
    "'Reason … because' and 'due to the fact that' are redundant. B is concise and complete.", { objective: "Concise causal statements." }),

  // ───────── Comparison
  E("cmp1", "comparison", 2, `${ERR}\n\nOf the two candidates, (A) / Rafiq is clearly (B) / the most qualified (C) / for the position. (D)`, ["A", "B", "C", "D", "No error"], 2,
    "Two items → comparative 'the more qualified'.", { errorSpan: "the most qualified", objective: "Comparative for two." }),
  E("cmp2", "comparison", 4, "Choose the best version.\n\nThe literacy rate in Kerala is higher [than any state in India].", [
    "than any state in India",
    "than that of any other state in India",
    "than any other state in India",
    "than those of any state in India",
  ], 1,
    "Compare rate with rate ('that of') and exclude Kerala itself ('any other').", { objective: "Like-with-like and 'any other'." }),
  E("cmp3", "comparison", 3, "Choose the correct option.\n\nThere were ____ applicants this year, so the committee spent ____ time on interviews.", ["less, fewer", "fewer, less", "fewer, fewer", "less, less"], 1,
    "fewer + countable (applicants); less + uncountable (time).", { objective: "fewer vs less." }),

  // ───────── Sentence completion
  E("sc1", "sentence-completion", 3, "Choose the word that best completes the sentence.\n\nFar from being ____, the new governor's statements were so cautious that analysts struggled to find any clear signal in them.", ["equivocal", "candid", "ambiguous", "evasive"], 1,
    "'Far from being X' + 'so cautious… no clear signal' → X is the opposite of cautious/unclear: candid (frank).", { objective: "Use contrast signals ('far from').", traps: ["'Equivocal', 'ambiguous' and 'evasive' describe what the statements WERE, not what they were far from being."] }),
  E("sc2", "sentence-completion", 3, "Choose the word that best completes the sentence.\n\nThe startup's growth was ____: within two years it went from a two-person team to the country's largest delivery platform.", ["meteoric", "sporadic", "stagnant", "incremental"], 0,
    "The colon introduces evidence of extremely rapid rise → meteoric.", { objective: "Colon = explanation follows." }),
  E("sc3", "sentence-completion", 4, "Choose the pair that best completes the sentence.\n\nAlthough the policy was intended to ____ inequality, critics argued that its benefits were ____ captured by the already wealthy.", ["reduce … disproportionately", "exacerbate … equitably", "alleviate … rarely", "widen … largely"], 0,
    "'Although' sets up a contrast between the intention (reduce inequality) and the result (benefits went mostly to the wealthy).", { objective: "Two-blank logic with 'although'." }),
  E("sc4", "sentence-completion", 4, "Choose the word that best completes the sentence.\n\nThe auditor's report was ____; every claim was supported by documents, and no detail was too small to verify.", ["perfunctory", "meticulous", "cursory", "slapdash"], 1,
    "The semicolon introduces support: extreme care → meticulous. The others mean careless/hasty.", { objective: "Definition-by-description." }),
  E("sc5", "sentence-completion", 5, "Choose the word that best completes the sentence.\n\nHis reputation for ____ made investors wary: he had changed his position on the merger three times in a single month.", ["tenacity", "vacillation", "probity", "parsimony"], 1,
    "Changing position repeatedly = vacillation (wavering).", { objective: "Hard vocabulary from context." }),
  E("sc6", "sentence-completion", 5, "Choose the pair that best completes the sentence.\n\nThe chairman's speech was so ____ that even his supporters found it hard to stay awake, yet its central proposal was surprisingly ____.", ["soporific … radical", "riveting … dull", "tedious … conventional", "stirring … bold"], 0,
    "First blank: hard to stay awake → soporific/tedious. 'Yet … surprisingly' → contrast with boring style → radical. 'Tedious … conventional' doesn't contrast.", { objective: "Use 'yet … surprisingly' as a reversal signal." }),
  E("sc7", "sentence-completion", 3, "Choose the word that best completes the sentence.\n\nThe agreement was only ____; the two sides were expected to sign a binding contract the following month.", ["provisional", "permanent", "irrevocable", "final"], 0,
    "Not yet binding → provisional (temporary, subject to change).", { objective: "Context clue after a semicolon." }),
  E("sc8", "sentence-completion", 4, "Choose the word that best completes the sentence.\n\nCritics dismissed the report as ____, pointing out that it repeated the same three arguments across forty pages.", ["concise", "redundant", "incisive", "succinct"], 1,
    "Repeating the same arguments → redundant (needlessly repetitive).", { objective: "Match the evidence to the word." }),

  // ───────── Analogy
  E("ana1", "analogy", 2, "Choose the pair with the same relationship.\n\nAUDITOR : ACCOUNTS ::", ["editor : manuscript", "pilot : aeroplane", "judge : lawyer", "teacher : school"], 0,
    "An auditor examines and checks accounts; an editor examines and corrects a manuscript.", { objective: "Name the relationship in a sentence first." }),
  E("ana2", "analogy", 3, "Choose the pair with the same relationship.\n\nPARSIMONIOUS : SPEND ::", ["loquacious : talk", "reticent : speak", "generous : give", "voracious : eat"], 1,
    "A parsimonious person is unwilling to spend; a reticent person is unwilling to speak. A, C and D are 'inclined TO' relationships.", { objective: "Reluctance vs tendency analogies.", traps: ["Loquacious : talk looks similar but is the opposite direction."] }),
  E("ana3", "analogy", 4, "Choose the pair with the same relationship.\n\nINTREPID : FEAR ::", ["tenacious : persistence", "impartial : bias", "affluent : wealth", "candid : honesty"], 1,
    "Intrepid means without fear; impartial means without bias. The others mean 'having' the quality.", { objective: "'Lacking' relationships." }),
  E("ana4", "analogy", 3, "Choose the pair with the same relationship.\n\nDROUGHT : FAMINE ::", ["rain : cloud", "negligence : accident", "doctor : hospital", "harvest : crop"], 1,
    "Drought can cause famine; negligence can cause an accident (cause → effect). 'Rain : cloud' is effect → cause.", { objective: "Cause–effect direction." }),
  E("ana5", "analogy", 5, "Choose the pair with the same relationship.\n\nEPHEMERAL : PERMANENCE ::", ["obsolete : novelty", "lucid : clarity", "ubiquitous : presence", "fervent : passion"], 0,
    "Ephemeral lacks permanence; obsolete lacks novelty (it is outdated). B, C, D mean having the quality.", { objective: "Antonym-based analogies." }),

  // ───────── Idioms
  E("idm1", "idioms", 2, "What does the idiom mean?\n\n'The new tax reform is still up in the air.'", ["It has been widely praised.", "It is uncertain and undecided.", "It has been cancelled.", "It is very ambitious."], 1,
    "'Up in the air' = not yet settled.", { objective: "Common idioms." }),
  E("idm2", "idioms", 3, "What does the idiom mean?\n\n'After the scandal, the CEO decided to face the music.'", ["To celebrate success", "To accept the consequences of one's actions", "To resign quietly", "To blame others"], 1,
    "'Face the music' = accept criticism or punishment for something you did.", { objective: "Common idioms." }),
  E("idm3", "idioms", 3, "Choose the correct meaning.\n\n'Their profit forecast was a far cry from the actual results.'", ["very similar to", "very different from", "a warning about", "an exaggeration of"], 1,
    "'A far cry from' = very different from.", { objective: "Common idioms." }),
  E("idm4", "idioms", 4, "Choose the correct meaning.\n\n'The minister's promise to build ten new universities in a year was taken with a pinch of salt.'", ["accepted enthusiastically", "regarded with scepticism", "criticised harshly", "ignored completely"], 1,
    "'With a pinch/grain of salt' = with doubt about its truth.", { objective: "Common idioms." }),
  E("idm5", "idioms", 4, "Choose the correct meaning.\n\n'The merger talks fell through at the eleventh hour.'", ["at 11 pm", "at the last possible moment", "after a long delay", "in the early stages"], 1,
    "'At the eleventh hour' = at the last moment.", { objective: "Common idioms." }),
  E("idm6", "idioms", 3, "Choose the correct meaning.\n\n'Securing the loan was a feather in her cap.'", ["a burden", "an achievement to be proud of", "a lucky accident", "a minor task"], 1,
    "'A feather in one's cap' = an achievement one can be proud of.", { objective: "Common idioms." }),

  // ───────── Vocabulary in context
  E("vic1", "vocab-context", 3, "In the sentence below, 'sanguine' most nearly means:\n\n'Despite the weak quarterly numbers, the CFO remained sanguine about the company's long-term prospects.'", ["bloody", "optimistic", "anxious", "indifferent"], 1,
    "'Despite weak numbers… remained ___ about prospects' → hopeful. 'Sanguine' = optimistic (its literal root relates to blood, a trap).", { objective: "Secondary meanings in context.", traps: ["Picking the root meaning 'bloody'."] }),
  E("vic2", "vocab-context", 4, "In the sentence below, 'qualified' most nearly means:\n\n'The committee gave the plan only qualified approval, insisting on several changes.'", ["competent", "limited / conditional", "licensed", "enthusiastic"], 1,
    "'Qualified approval' with conditions = approval with reservations.", { objective: "Common words with test meanings." }),
  E("vic3", "vocab-context", 4, "In the sentence below, 'arrest' most nearly means:\n\n'The central bank raised rates to arrest the slide in the taka.'", ["detain", "halt", "accelerate", "report"], 1,
    "'Arrest a decline' = stop it.", { objective: "Common words with test meanings." }),
  E("vic4", "vocab-context", 5, "In the sentence below, 'check' most nearly means:\n\n'Independent courts serve as a check on executive power.'", ["inspection", "restraint", "payment", "test"], 1,
    "A check on power = something that restrains it.", { objective: "Common words with test meanings." }),

  // ───────── Para jumbles
  E("pj1", "para-jumble", 3, "Arrange the sentences into a coherent paragraph.\n\nP. As a result, many small exporters struggled to pay for imported raw materials.\nQ. In 2022, the taka lost significant value against the US dollar.\nR. To ease the pressure, the central bank introduced special foreign-exchange windows for exporters.\nS. This made imported goods more expensive in local currency.", ["QSPR", "QPSR", "SQPR", "QSRP"], 0,
    "Q (cause) → S (immediate effect: imports costlier) → P (consequence for exporters, 'As a result') → R (policy response).", { objective: "Find the opener, then follow cause → effect → response." }),
  E("pj2", "para-jumble", 4, "Arrange the sentences into a coherent paragraph.\n\nP. Yet the same feature that makes them convenient also makes them risky.\nQ. Buy-now-pay-later services let shoppers split a purchase into small instalments.\nR. Regulators are therefore considering affordability checks.\nS. Because approval takes seconds, consumers can take on several loans without anyone checking their total debt.", ["QPSR", "QSPR", "PQSR", "QRPS"], 0,
    "Q introduces the topic; P ('Yet… convenient… risky') turns; S explains the risk; R ('therefore') gives the response.", { objective: "Use 'yet', 'therefore' as order clues." }),
];
