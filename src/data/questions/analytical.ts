import type { ChartSpec, Difficulty, Question } from "@/lib/types";

/** Original analytical-ability questions. Charts use fictional data, never real statistics. */

type X = Partial<Pick<Question, "traps" | "fastest" | "timeSec" | "chart" | "shortcut">>;
const A = (id: string, topic: string, difficulty: Difficulty, stem: string, options: string[], answer: number, explanation: string, objective: string, x: X = {}): Question => ({
  id: `an-${id}`,
  subject: "analytical",
  topic,
  difficulty,
  stem,
  options,
  answer,
  explanation,
  objective,
  traps: x.traps,
  fastest: x.fastest,
  shortcut: x.shortcut,
  chart: x.chart,
  timeSec: x.timeSec ?? (difficulty >= 4 ? 75 : 50),
  source: "original",
});

export const DS_OPTIONS = [
  "Statement (1) ALONE is sufficient, but (2) alone is not",
  "Statement (2) ALONE is sufficient, but (1) alone is not",
  "BOTH statements TOGETHER are sufficient, but neither alone is",
  "EACH statement ALONE is sufficient",
  "Statements (1) and (2) TOGETHER are NOT sufficient",
];

const novatech: ChartSpec = {
  kind: "bar",
  title: "NovaTech revenue by division (Tk crore) — fictional data",
  unit: "Tk crore",
  categories: ["2021", "2022", "2023", "2024"],
  series: [
    { name: "Mobile", values: [120, 150, 180, 210] },
    { name: "Cloud", values: [60, 90, 144, 180] },
    { name: "Hardware", values: [100, 95, 90, 80] },
  ],
};

const budget: ChartSpec = {
  kind: "pie",
  title: "A household's monthly budget of Tk 60,000 — fictional data",
  slices: [
    { label: "Rent", value: 30 },
    { label: "Food", value: 25 },
    { label: "Education", value: 15 },
    { label: "Savings", value: 12 },
    { label: "Transport", value: 10 },
    { label: "Other", value: 8 },
  ],
  unit: "%",
};

const footfall: ChartSpec = {
  kind: "line",
  title: "Weekly visitors (thousands) at two stores — fictional data",
  unit: "thousand",
  categories: ["W1", "W2", "W3", "W4", "W5", "W6"],
  series: [
    { name: "Store P", values: [12, 15, 14, 18, 21, 20] },
    { name: "Store Q", values: [16, 16, 17, 17, 19, 22] },
  ],
};

export const ANALYTICAL_QUESTIONS: Question[] = [
  // ── Series
  A("sr1", "series", 2, "Find the next term: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "36"], 1, "Terms are n(n + 1): 1×2, 2×3, 3×4, 4×5, 5×6, 6×7 = 42. Differences 4, 6, 8, 10, 12 also work.", "Spot n(n+1) or second differences.", { fastest: "Write the differences first." }),
  A("sr2", "series", 2, "Find the next term: 3, 5, 9, 17, 33, ?", ["49", "65", "66", "64"], 1, "Each term = previous × 2 − 1: 33 × 2 − 1 = 65. (Differences 2, 4, 8, 16, 32.)", "Doubling patterns."),
  A("sr3", "series", 3, "Find the next letter: B, E, I, N, ?", ["S", "T", "U", "R"], 1, "Positions 2, 5, 9, 14 → gaps 3, 4, 5, 6 → 14 + 6 = 20 = T.", "Convert letters to numbers.", { fastest: "Memorise EJOTY: E5, J10, O15, T20, Y25." }),
  A("sr4", "series", 5, "Find the next term: 1, 4, 9, 61, 52, 63, 94, ?", ["64", "46", "81", "18"], 1, "Squares with digits reversed: 16 → 61, 25 → 52, 36 → 63, 49 → 94, 64 → 46.", "Disguised patterns.", { traps: ["Answering 64 (the square itself)."] }),

  // ── Coding
  A("cd1", "coding", 2, "If COMPUTER is coded as DPNQVUFS, how is MANAGER coded?", ["NBOBHFS", "NBOBGFS", "LZMZFDQ", "NBOBHFT"], 0, "Each letter is shifted +1: M→N, A→B, N→O, A→B, G→H, E→F, R→S.", "Letter shifts."),
  A("cd2", "coding", 3, "In a code language, TEAM is written as VGCO. How is BANK written?", ["DCPM", "DBPM", "CBOL", "DCOM"], 0, "Each letter +2: B→D, A→C, N→P, K→M.", "Letter shifts."),
  A("cd3", "coding", 3, "If CAT = 24 and DOG = 26, what is BAT?", ["22", "23", "24", "25"], 1, "Sum of alphabet positions: C3 + A1 + T20 = 24; D4 + O15 + G7 = 26; B2 + A1 + T20 = 23.", "Numeric letter codes."),

  // ── Blood relations
  A("bl1", "blood", 2, "Pointing to a man, Rina says, \"He is the son of my grandfather's only son.\" How is the man related to Rina?", ["Cousin", "Brother", "Uncle", "Father"], 1, "Grandfather's only son = Rina's father. His son = Rina's brother.", "Decode from the end of the chain.", { fastest: "Replace phrases one at a time, starting from the person nearest the speaker." }),
  A("bl2", "blood", 4, "A is B's sister. C is B's mother. D is C's father. E is D's mother. How is A related to D?", ["Daughter", "Granddaughter", "Great-granddaughter", "Niece"], 1, "A is C's daughter (sibling of B). D is C's father → A is D's granddaughter. (E is irrelevant.)", "Family trees; ignore distractor people.", { traps: ["Counting the E generation."] }),

  // ── Direction
  A("dr1", "direction", 3, "Sumon walks 10 km north, turns right and walks 6 km, then turns right again and walks 18 km. How far is he from his starting point?", ["8 km", "10 km", "12 km", "14 km"], 1, "Coordinates: (0,10) → (6,10) → (6,−8). Distance = √(6² + 8²) = 10 km.", "Track coordinates.", { fastest: "Net N–S = 10 − 18 = −8; net E–W = 6 → 6-8-10 triangle." }),
  A("dr2", "direction", 4, "A man facing north turns 90° clockwise, then 135° anticlockwise, then 180°. Which direction is he facing now?", ["North-West", "South-East", "South-West", "North-East"], 1, "N (0°) → +90 = E (90°) → −135 = 315° (NW) → +180 = 135° (SE).", "Use bearings (clockwise +).", { traps: ["Stopping one turn early (NW)."] }),

  // ── Ranking
  A("rk1", "ranking", 2, "In a class, Ravi is 14th from the top and 23rd from the bottom. How many students are there?", ["36", "37", "35", "38"], 0, "Total = 14 + 23 − 1 = 36.", "Position arithmetic.", { shortcut: { trick: "Total = left rank + right rank − 1.", why: "The person is counted twice.", whenNot: "Two different people's ranks — then add and adjust for overlap/gap." } }),
  A("rk2", "ranking", 4, "In a row, A is 12th from the left and B is 15th from the right. When they swap places, A becomes 20th from the left. How many people are in the row?", ["33", "34", "35", "36"], 1, "After swapping, A is at B's old place: 20th from left and 15th from right → 20 + 15 − 1 = 34.", "Swaps transfer positions."),

  // ── Calendar & clock
  A("ck1", "calendar-clock", 3, "What is the angle between the hour and minute hands at 3:40?", ["120°", "130°", "140°", "125°"], 1, "|30H − 5.5M| = |90 − 220| = 130°.", "Clock-angle formula.", { shortcut: { trick: "Angle = |30H − 5.5M|; if > 180°, subtract from 360°.", why: "Hour hand moves 0.5°/min, minute hand 6°/min.", whenNot: "—" } }),
  A("ck2", "calendar-clock", 4, "If 1 January 2023 was a Sunday, what day was 1 January 2024?", ["Sunday", "Monday", "Tuesday", "Saturday"], 1, "2023 is not a leap year: 365 days = 52 weeks + 1 odd day → Monday.", "Odd days."),
  A("ck3", "calendar-clock", 5, "How many times do the hour and minute hands of a clock coincide in 24 hours?", ["24", "22", "23", "48"], 1, "They coincide 11 times every 12 hours (the 11–1 overlap happens at 12:00 only) → 22.", "Clock overlaps.", { traps: ["Answering 24."] }),

  // ── Syllogisms
  A("sy1", "syllogism", 3, "Statements: All managers are graduates. Some graduates are engineers.\nConclusions: I. Some managers are engineers. II. Some engineers are graduates.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "II is a direct conversion of 'Some graduates are engineers'. I does not follow — the engineers among graduates might not be managers.", "Venn-diagram testing.", { fastest: "Draw the case where the conclusion fails; if you can, it doesn't follow." }),
  A("sy2", "syllogism", 4, "Statements: No bank is a hospital. All hospitals are buildings.\nConclusions: I. Some buildings are not banks. II. No building is a bank.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 0, "Hospitals are buildings and are not banks → some buildings (the hospitals) are not banks. II is not certain — some buildings could be banks.", "Venn-diagram testing."),
  A("sy3", "syllogism", 5, "Statements: Some A are B. All B are C. No C is D.\nConclusions: I. Some A are not D. II. Some C are A.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 2, "The A's that are B are also C → some C are A (II). Those A's are C, and no C is D → those A's are not D (I).", "Chained syllogisms."),

  // ── Critical reasoning: assumption
  A("as1", "cr-assumption", 3, "To reduce traffic congestion in Gulshan, the city will double parking fees there. Officials argue that this will lead people to drive into Gulshan less often.\n\nThe officials' argument assumes that:", [
    "public transport in Gulshan is excellent",
    "a significant number of drivers entering Gulshan pay for parking and will respond to higher costs",
    "parking fees in Gulshan are currently lower than elsewhere in Dhaka",
    "congestion is worst in the morning",
  ], 1, "If most drivers don't pay for parking (e.g., they have private parking or are passing through), raising fees won't change behaviour. Negate B and the argument collapses.", "Assumption: negation test.", { fastest: "Negation test: negate each option; the one that destroys the argument is the assumption." }),
  A("as2", "cr-assumption", 4, "Shoply's sales rose 30% in the year after it hired a new marketing director. The board concluded that the director's strategy caused the rise.\n\nThe board's conclusion depends on which assumption?", [
    "The director had previously worked at larger firms.",
    "No other significant change, such as a major competitor leaving the market, accounts for the rise.",
    "The director is paid more than her predecessor.",
    "Sales will continue to rise next year.",
  ], 1, "Causal conclusions from 'after' require ruling out alternative causes.", "Causal assumptions."),
  A("as3", "cr-assumption", 5, "Students who use the university's tutoring centre have higher average GPAs than those who do not. Therefore, the university should require all students to use the centre in order to raise GPAs.\n\nWhich of the following is an assumption on which the argument depends?", [
    "The tutoring centre has enough staff.",
    "The higher GPAs of centre users are not mainly because more motivated students choose to use the centre.",
    "GPA is the best measure of learning.",
    "Most students would like to use the centre.",
  ], 1, "If motivated students self-select into tutoring, forcing others to attend may not raise their GPAs. The argument must assume tutoring itself causes the difference.", "Self-selection.", { traps: ["A matters for implementation but not for the logic of the conclusion."] }),

  // ── Strengthen
  A("st1", "cr-strengthen", 3, "Workers at a factory who were given flexible schedules took 15% fewer sick days than before. The researchers concluded that flexible schedules improve workers' health.\n\nWhich of the following, if true, most strengthens the conclusion?", [
    "Workers with flexible schedules also reported lower stress and made fewer doctor visits for stress-related illness.",
    "Some workers preferred fixed schedules.",
    "The factory is located in a large city.",
    "At the same time, the factory made it harder for flexible-schedule workers to claim sick days.",
  ], 0, "A provides independent evidence of better health, not just fewer sick-day claims. D would weaken (an alternative explanation).", "Strengthen by independent evidence."),
  A("st2", "cr-strengthen", 4, "Advocates argue that farmers should switch from diesel to solar irrigation pumps because solar pumps reduce farmers' costs.\n\nWhich of the following most strengthens this argument?", [
    "Solar pumps are quieter than diesel pumps.",
    "The higher purchase price of a solar pump is typically recovered through fuel savings within three years, and the pumps last over fifteen years.",
    "Diesel prices have been stable for a decade.",
    "Some farmers already use solar panels for lighting.",
  ], 1, "The argument is about cost; B addresses the main objection (upfront price) and shows a net saving.", "Address the weak point."),
  A("st3", "cr-strengthen", 5, "A grocery app's weekly orders rose after it launched a 'one-tap reorder' button. The product team concluded that the button increased orders.\n\nWhich of the following most strengthens the team's conclusion?", [
    "Users who tried the button rated it highly.",
    "A randomly selected group of users who did not receive the button showed no increase in orders over the same period.",
    "The app also launched a new logo that month.",
    "Orders usually rise during the holiday season, which coincided with the launch.",
  ], 1, "A control group rules out seasonal or market-wide causes. C and D weaken.", "Control groups strengthen causal claims."),

  // ── Weaken
  A("wk1", "cr-weaken", 3, "Coffee shops near universities earn higher revenues than those elsewhere. Therefore, opening our new shop near a university will make it profitable.\n\nWhich of the following most weakens the argument?", [
    "Students drink a lot of coffee.",
    "Rents near universities are so high that most coffee shops there operate at a loss despite higher revenue.",
    "Some universities have their own cafés.",
    "Coffee prices have risen recently.",
  ], 1, "Revenue ≠ profit. B shows costs offset the revenue advantage.", "Revenue vs profit gap."),
  A("wk2", "cr-weaken", 4, "Since a new highway opened, accidents on the old road it replaced have fallen by 40%. Officials claim the highway has made travel in the region safer.\n\nWhich of the following most seriously weakens the claim?", [
    "The old road is now used mainly by local traffic.",
    "The number of accidents on the new highway is greater than the reduction on the old road.",
    "The highway cost more than expected.",
    "The old road has more traffic lights than the highway.",
  ], 1, "The claim is about the whole region. If total accidents rose, travel isn't safer.", "Scope shift: part vs whole."),
  A("wk3", "cr-weaken", 5, "Countries with more mobile phones per person have higher GDP per person. A policymaker proposes distributing free phones to raise national income.\n\nWhich of the following most weakens the proposal's reasoning?", [
    "Mobile phones help farmers find better prices.",
    "People in richer countries buy more phones because they can afford them, so higher income drives phone ownership rather than the reverse.",
    "Phones are cheaper now than ten years ago.",
    "Some poor countries have high phone ownership.",
  ], 1, "Reverse causation undermines the policy logic. A strengthens. D is a partial counterexample but doesn't attack the causal logic as directly.", "Reverse causation."),

  // ── Inference
  A("if1", "cr-inference", 3, "Every product the firm launched last year was either a phone or a tablet. None of the tablets it launched was profitable. The firm's only profitable product last year was launched last year.\n\nWhich of the following must be true?", [
    "All the phones launched last year were profitable.",
    "The firm's only profitable product last year was a phone.",
    "The firm launched more phones than tablets.",
    "The firm will stop making tablets.",
  ], 1, "The profitable product was launched last year → it was a phone or tablet → tablets weren't profitable → it was a phone.", "Must-be-true chaining.", { traps: ["A: only ONE product was profitable, so any other phones were not."] }),
  A("if2", "cr-inference", 4, "In 2023, Company A's revenue grew by 10%, while its share of the total market revenue fell.\n\nWhich of the following can be properly inferred?", [
    "Company A's profits fell.",
    "Total market revenue grew by more than 10%.",
    "Company A lost customers.",
    "A competitor's revenue fell.",
  ], 1, "Share = A / Total. If A rose 10% and share fell, Total rose faster than 10%.", "Ratio reasoning."),
  A("if3", "cr-inference", 5, "All applicants to the programme must take the written test. Some applicants who scored above 700 on the GMAT also applied to other universities.\n\nWhich of the following must be true?", [
    "Everyone who scored above 700 applied to the programme.",
    "Some people who applied to other universities must take the programme's written test.",
    "Applicants with high GMAT scores are exempt from the written test.",
    "Most applicants applied to other universities.",
  ], 1, "The high scorers who applied here are applicants → they must take the test, and some of them also applied elsewhere.", "Quantifier logic."),

  // ── Flaw & evaluate
  A("fl1", "cr-flaw", 3, "Many famous billionaires dropped out of university. Therefore, dropping out of university is a good strategy for becoming rich.\n\nThe reasoning is flawed because it:", [
    "relies on the opinions of billionaires",
    "generalises from a few notable cases while ignoring the many dropouts who did not become rich",
    "assumes university education is expensive",
    "confuses wealth with happiness",
  ], 1, "Survivorship bias: the unsuccessful dropouts are invisible.", "Survivorship bias."),
  A("fl2", "cr-flaw", 3, "Rafi argues that the new tax is fair. But Rafi is a tax consultant who profits from complicated taxes, so the tax must be unfair.\n\nThe argument is flawed because it:", [
    "attacks Rafi's motives instead of addressing his reasons",
    "assumes that all taxes are unfair",
    "uses a term in two different senses",
    "relies on an unrepresentative sample",
  ], 0, "Ad hominem: a person's interests don't make their argument false.", "Ad hominem."),
  A("ev1", "cr-flaw", 4, "After City X required cyclists to wear helmets, reported head injuries among cyclists fell by 30%. A council member argues that City Y should adopt the same law.\n\nWhich information would be most useful in evaluating the argument?", [
    "Whether helmets in City Y are more expensive",
    "Whether the number of people cycling in City X fell after the law was introduced",
    "Whether City X has more parks than City Y",
    "Whether the council member cycles",
  ], 1, "If fewer people cycled, injuries would fall even without helmets doing anything — the answer to B could strengthen or weaken the argument.", "Evaluate: find the question whose answer swings the conclusion."),

  // ── Paradox
  A("px1", "cr-paradox", 3, "After a supermarket chain cut prices on most items by 10%, its total profit increased.\n\nWhich of the following best explains this?", [
    "Its competitors also cut prices.",
    "The price cuts attracted so many new customers that the increase in sales volume more than offset the lower margins.",
    "Its suppliers raised their prices.",
    "Its staff costs rose.",
  ], 1, "Volume gains can outweigh margin losses.", "Explain both facts at once."),
  A("px2", "cr-paradox", 5, "Hospital A has a higher patient death rate than Hospital B, yet most doctors consider Hospital A the better hospital.\n\nWhich of the following best resolves this apparent discrepancy?", [
    "Hospital A is older than Hospital B.",
    "Hospital A is the region's main referral centre and treats far more critically ill patients than Hospital B.",
    "Hospital B has more beds.",
    "Doctors are paid more at Hospital A.",
  ], 1, "Different patient mix explains the higher death rate without implying worse care.", "Base-rate / case-mix differences."),

  // ── Data interpretation
  A("di1", "di", 3, "Refer to the chart. In which year did Cloud revenue grow by the largest percentage over the previous year?", ["2022", "2023", "2024", "Equal in 2022 and 2023"], 1, "2022: 60→90 = +50%. 2023: 90→144 = +60%. 2024: 144→180 = +25%.", "Percentage growth from a chart.", { chart: novatech, fastest: "Compare ratios: 90/60 = 1.5, 144/90 = 1.6, 180/144 = 1.25." }),
  A("di2", "di", 2, "Refer to the chart. What was NovaTech's total revenue in 2024?", ["Tk 450 crore", "Tk 470 crore", "Tk 480 crore", "Tk 490 crore"], 1, "210 + 180 + 80 = 470.", "Read and add.", { chart: novatech }),
  A("di3", "di", 3, "Refer to the chart. Approximately what share of NovaTech's 2021 revenue came from Hardware?", ["32%", "36%", "40%", "28%"], 1, "100 / (120 + 60 + 100) = 100/280 ≈ 35.7% ≈ 36%.", "Share of total.", { chart: novatech }),
  A("di4", "di", 4, "Refer to the chart. By how much did the Mobile division's average annual revenue over 2021–2024 exceed Hardware's average annual revenue over the same period?", ["Tk 66.25 crore", "Tk 73.75 crore", "Tk 60 crore", "Tk 70 crore"], 1, "Mobile total = 120 + 150 + 180 + 210 = 660 → average 165. Hardware total = 100 + 95 + 90 + 80 = 365 → average 91.25. Difference = 73.75. Faster: difference of averages = (660 − 365)/4 = 295/4.", "Averages from a chart.", { chart: novatech }),
  A("di5", "di", 3, "Refer to the chart. How much more does the household spend on Food than on Education each month?", ["Tk 4,000", "Tk 6,000", "Tk 9,000", "Tk 10,000"], 1, "(25% − 15%) × 60,000 = 6,000.", "Differences of percentages.", { chart: budget, fastest: "Subtract percentages first, then convert once." }),
  A("di6", "di", 4, "Refer to the chart. If rent rises by 20% while income stays the same and the entire increase is taken out of savings, what will the household's monthly savings be?", ["Tk 3,600", "Tk 5,760", "Tk 4,200", "Tk 3,000"], 0, "Rent = 18,000 → +20% = +3,600. Savings = 7,200 − 3,600 = 3,600.", "Multi-step DI.", { chart: budget, traps: ["Reducing savings by 20% instead."] }),
  A("di7", "di", 2, "Refer to the chart. If the budget is drawn as a pie chart, what is the central angle of the Transport slice?", ["30°", "36°", "40°", "45°"], 1, "10% of 360° = 36°.", "Pie angles.", { chart: budget }),
  A("di8", "di", 4, "Refer to the chart. In how many of weeks W2–W6 did Store P's visitors increase from the previous week while Store Q's did not increase?", ["0", "1", "2", "3"], 2, "W2: P 12→15 up, Q 16→16 flat ✓. W3: P fell. W4: P 14→18 up, Q 17→17 flat ✓. W5: both rose. W6: P fell. So 2 weeks (W2 and W4).", "Compare two series week by week.", { chart: footfall }),
  A("di9", "di", 3, "Refer to the chart. What was Store Q's average weekly number of visitors over the six weeks?", ["17,500", "17,833", "18,000", "17,000"], 1, "16+16+17+17+19+22 = 107 → 107/6 ≈ 17.83 thousand.", "Average from a line chart.", { chart: footfall }),

  // ── Data sufficiency
  A("ds1", "ds", 2, "What is the value of x?\n(1) 2x + 3 = 11\n(2) x² = 16", DS_OPTIONS, 0, "(1) gives x = 4. (2) gives x = ±4 → not sufficient. Answer A.", "Data sufficiency basics.", { fastest: "Never solve fully — only decide whether a unique answer exists." }),
  A("ds2", "ds", 3, "n is an integer. Is n even?\n(1) 3n is even.\n(2) n + 5 is odd.", DS_OPTIONS, 3, "(1) 3n even → n even (3 is odd). (2) n + 5 odd → n even. Each alone is sufficient.", "Parity rules."),
  A("ds3", "ds", 3, "What is the price of one pen?\n(1) 3 pens and 2 pencils cost Tk 50.\n(2) 6 pens and 4 pencils cost Tk 100.", DS_OPTIONS, 4, "(2) is just (1) doubled — one equation, two unknowns even together.", "Dependent equations.", { traps: ["Choosing C because there are 'two equations'."] }),
  A("ds4", "ds", 3, "Is triangle ABC right-angled?\n(1) AB = 3 and BC = 4.\n(2) AC = 5.", DS_OPTIONS, 2, "Alone, neither fixes the triangle. Together, the sides are 3, 4, 5 and 3² + 4² = 5² → right angle.", "Combine geometry facts."),
  A("ds5", "ds", 5, "Is x > y?\n(1) x² > y²\n(2) x + y > 0", DS_OPTIONS, 2, "(1): x = 3, y = 1 → yes; x = −3, y = 1 → no. (2): x = 2, y = 1 → yes; x = 1, y = 2 → no. Together: x² − y² = (x − y)(x + y) > 0 and x + y > 0 → x − y > 0 → yes.", "Factor and combine."),
];
