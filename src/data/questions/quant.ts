import type { Difficulty, Question, Shortcut } from "@/lib/types";

/**
 * Original quantitative questions. Each entry carries `check`: the answer
 * recomputed independently in code. scripts/verify-bank.ts asserts that the
 * keyed option matches `check` for every question.
 */

export const QUANT_CHECKS: Record<string, number | string> = {};

interface QArgs {
  d: Difficulty;
  stem: string;
  options: string[];
  answer: number;
  check: number | string;
  explanation: string;
  fastest: string;
  mental?: string;
  shortcut?: Shortcut;
  traps: string[];
  t: number;
  obj: string;
}

const Q = (id: string, topic: string, a: QArgs): Question => {
  QUANT_CHECKS[`qt-${id}`] = a.check;
  return {
    id: `qt-${id}`,
    subject: "quant",
    topic,
    difficulty: a.d,
    stem: a.stem,
    options: a.options,
    answer: a.answer,
    explanation: a.explanation,
    fastest: a.fastest,
    mental: a.mental,
    shortcut: a.shortcut,
    traps: a.traps,
    timeSec: a.t,
    source: "original",
    objective: a.obj,
  };
};

export const QUANT_QUESTIONS: Question[] = [
  // ── Percentages
  Q("pc1", "percent", { d: 2, stem: "A's salary is 25% more than B's. By what percentage is B's salary less than A's?", options: ["25%", "20%", "22.5%", "15%"], answer: 1, check: (25 / 125) * 100,
    explanation: "Let B = 100, then A = 125. B is 25 less than A. As a percentage of A: 25/125 × 100 = 20%.",
    fastest: "x/(100 + x) × 100 = 25/125 = 1/5 = 20%.",
    shortcut: { trick: "If A is x% more than B, B is x/(100 + x) × 100 % less than A.", why: "The base changes from B to A.", whenNot: "Doesn't apply when both are compared with a third quantity." },
    traps: ["Answering 25% — the base is different."], t: 25, obj: "Percent change depends on the base." }),
  Q("pc2", "percent", { d: 2, stem: "A town's population grows by 10% every year. Its population is now 1,21,000. What was it two years ago?", options: ["1,00,000", "98,000", "1,01,000", "99,000"], answer: 0, check: 121000 / 1.21,
    explanation: "P × 1.1 × 1.1 = 121,000 → P = 121,000 / 1.21 = 100,000.",
    fastest: "Spot 121 = 11²: 1,21,000 / 1.21 = 1,00,000.",
    traps: ["Subtracting 20% (gives 96,800)."], t: 25, obj: "Reverse compound growth." }),
  Q("pc3", "percent", { d: 2, stem: "40% of a number is 72 more than 25% of the same number. What is the number?", options: ["400", "480", "450", "360"], answer: 1, check: 72 / 0.15,
    explanation: "0.40x − 0.25x = 72 → 0.15x = 72 → x = 480.",
    fastest: "15% = 72 → 1% = 4.8 → 100% = 480.",
    mental: "72 ÷ 15 = 4.8, × 100.", traps: ["Dividing 72 by 0.4 or 0.25."], t: 20, obj: "Unitary method with percents." }),
  Q("pc4", "percent", { d: 3, stem: "The price of sugar rises by 25%. By what percentage must a family reduce its consumption so that its expenditure on sugar does not change?", options: ["25%", "20%", "18%", "22%"], answer: 1, check: (25 / 125) * 100,
    explanation: "Expenditure = price × quantity. New price = 1.25p; to keep pq constant, new q = q/1.25 = 0.8q → 20% reduction.",
    fastest: "r/(100 + r) × 100 = 25/125 = 20%.", traps: ["Answering 25%."], t: 25, obj: "Inverse proportion with percent." }),
  Q("pc5", "percent", { d: 3, stem: "In a two-candidate election where every vote was valid, the losing candidate received 35% of the votes and lost by 450 votes. How many votes were cast?", options: ["1,200", "1,500", "1,800", "1,350"], answer: 1, check: 450 / 0.3,
    explanation: "Winner got 65%. Margin = 65% − 35% = 30% of total = 450 → total = 1,500.",
    fastest: "Margin % = 100 − 2×35 = 30% → 450/0.3.", traps: ["Using 35% = 450."], t: 30, obj: "Translate margins into percentages." }),
  Q("pc6", "percent", { d: 6, stem: "A's income is 20% more than B's, and B's income is 25% less than C's. If C earns Tk 40,000, what does A earn?", options: ["Tk 36,000", "Tk 38,000", "Tk 32,000", "Tk 39,000"], answer: 0, check: 40000 * 0.75 * 1.2,
    explanation: "B = 0.75 × 40,000 = 30,000. A = 1.2 × 30,000 = 36,000.",
    fastest: "Chain multipliers: 40,000 × 0.75 × 1.2 = 40,000 × 0.9 = 36,000.",
    mental: "0.75 × 1.2 = 0.9.", traps: ["Netting −25% + 20% = −5% → 38,000."], t: 25, obj: "Chain percentage multipliers." }),

  // ── Profit & loss
  Q("pl1", "profit-loss", { d: 2, stem: "By selling an item for Tk 1,140, a shopkeeper loses 5%. At what price should he sell it to gain 5%?", options: ["Tk 1,200", "Tk 1,254", "Tk 1,260", "Tk 1,197"], answer: 2, check: (1140 / 0.95) * 1.05,
    explanation: "CP = 1,140 / 0.95 = 1,200. SP for 5% gain = 1,200 × 1.05 = 1,260.",
    fastest: "SP2 = SP1 × 105/95 = 1,140 × 21/19 = 60 × 21 = 1,260.",
    traps: ["Adding 10% to 1,140 (gives 1,254)."], t: 30, obj: "Find CP from SP and loss%." }),
  Q("pl2", "profit-loss", { d: 4, stem: "A trader sells two phones at Tk 9,900 each. He gains 10% on one and loses 10% on the other. What is his overall result?", options: ["No profit, no loss", "Loss of Tk 200", "Gain of Tk 200", "Loss of Tk 100"], answer: 1, check: 9000 + 11000 - 19800,
    explanation: "CP1 = 9,900/1.1 = 9,000; CP2 = 9,900/0.9 = 11,000. Total CP = 20,000, total SP = 19,800 → loss of Tk 200 (1%).",
    fastest: "Same SP, same ±x% → always a loss of x²/100 % = 1% of total CP.",
    shortcut: { trick: "Equal SPs with gain x% and loss x% → net loss = x²/100 %.", why: "The loss item has a bigger cost price, so the loss outweighs the gain.", whenNot: "If the COST prices (not selling prices) are equal, there is no net loss." },
    traps: ["Assuming the gain and loss cancel."], t: 40, obj: "Equal-SP gain/loss trap." }),
  Q("pl3", "profit-loss", { d: 2, stem: "Two successive discounts of 20% and 10% are equivalent to a single discount of:", options: ["30%", "28%", "27%", "25%"], answer: 1, check: 100 - 80 * 0.9,
    explanation: "100 → 80 → 72. Single discount = 28%.",
    fastest: "x + y − xy/100 = 20 + 10 − 2 = 28%.", traps: ["Adding to 30%."], t: 15, obj: "Successive discounts." }),
  Q("pl4", "profit-loss", { d: 4, stem: "A dishonest trader claims to sell at cost price but uses a 900 g weight instead of 1 kg. What is his profit percentage?", options: ["10%", "11.11%", "9.09%", "12%"], answer: 1, check: (100 / 900) * 100,
    explanation: "He receives the price of 1,000 g but gives 900 g. Profit = 100 g on a cost of 900 g → 100/900 × 100 = 11.11%.",
    fastest: "Error / (true weight given) × 100 = 100/900 = 1/9 = 11.11%.",
    traps: ["Dividing by 1,000 instead of 900 (gives 10%)."], t: 30, obj: "Profit on the goods actually given." }),
  Q("pl5", "profit-loss", { d: 6, stem: "By selling 33 metres of cloth, a shopkeeper gains the selling price of 11 metres. What is his gain percentage?", options: ["33.33%", "50%", "25%", "66.67%"], answer: 1, check: ((33 / 22) - 1) * 100,
    explanation: "SP(33) − CP(33) = SP(11) → SP(22) = CP(33) → SP/CP per metre = 33/22 = 1.5 → 50% gain.",
    fastest: "Gain% = 11/(33 − 11) × 100 = 50%.",
    shortcut: { trick: "If gain on n items = SP of m items, gain% = m/(n − m) × 100.", why: "SP(n − m) = CP(n).", whenNot: "If gain = CP of m items, gain% = m/n × 100 instead." },
    traps: ["11/33 = 33.33% (that would be gain = CP of 11 m)."], t: 45, obj: "Gain expressed in selling-price units." }),

  // ── Ratio
  Q("ra1", "ratio", { d: 3, stem: "Tk 1,700 is divided among A, B and C so that A gets 2/3 of what B gets and B gets 1/4 of what C gets. What is C's share?", options: ["Tk 1,200", "Tk 1,100", "Tk 1,000", "Tk 1,275"], answer: 0, check: (1700 / 17) * 12,
    explanation: "Let C = 12k. B = 3k, A = 2k. Total 17k = 1,700 → k = 100 → C = 1,200.",
    fastest: "Choose C as the LCM of denominators (4 × 3 = 12) to avoid fractions.", traps: ["Setting C = 1 and working with fractions slowly."], t: 40, obj: "Pick convenient values in ratio problems." }),
  Q("ra2", "ratio", { d: 4, stem: "The incomes of A and B are in the ratio 3 : 2 and their expenditures are in the ratio 5 : 3. If each saves Tk 2,000, what is A's income?", options: ["Tk 10,000", "Tk 12,000", "Tk 9,000", "Tk 15,000"], answer: 1, check: 12000,
    explanation: "3x − 5y = 2,000 and 2x − 3y = 2,000. Multiply: 6x − 10y = 4,000 and 6x − 9y = 6,000 → y = 2,000, x = 4,000 → A's income = 12,000.",
    fastest: "Backsolve: A = 12,000 → spends 10,000 → y = 2,000 → B earns 8,000, spends 6,000, saves 2,000 ✓.", traps: ["Solving for x and forgetting to multiply by 3."], t: 60, obj: "Two-ratio equations or backsolving." }),
  Q("ra3", "ratio", { d: 4, stem: "50 litres of a mixture contain milk and water in the ratio 7 : 3. How many litres of water must be added to make the ratio 7 : 5?", options: ["8", "10", "12", "15"], answer: 1, check: 10,
    explanation: "Milk = 35, water = 15. Milk stays 35 = 7 parts → 1 part = 5 → water needed = 25 → add 10.",
    fastest: "Milk is unchanged: 7 parts = 35 both times, so water goes from 3 parts to 5 parts = +2 parts = +10 L.", traps: ["Adding 2 litres (2 parts without scaling)."], t: 35, obj: "Hold the unchanged quantity fixed." }),

  // ── Averages
  Q("av1", "average", { d: 2, stem: "The average of five consecutive odd numbers is 61. What is the largest of them?", options: ["63", "65", "67", "69"], answer: 1, check: 65,
    explanation: "For evenly spaced numbers, the average is the middle one: 57, 59, 61, 63, 65.",
    fastest: "Middle = 61; largest = 61 + 2×2 = 65.", traps: ["Adding 4 consecutive (not odd) steps."], t: 15, obj: "Average of an evenly spaced set = middle term." }),
  Q("av2", "average", { d: 4, stem: "A batsman's average increases by 3 after he scores 87 in his 17th innings. What is his average after the 17th innings?", options: ["36", "39", "42", "40"], answer: 1, check: 39,
    explanation: "Old average a: 16a + 87 = 17(a + 3) → a = 36 → new = 39.",
    fastest: "The 87 must top up each of the 16 old innings by 3 (= 48) and still leave the new average for itself: new average = 87 − 16 × 3 = 39.",
    shortcut: { trick: "New average = new score − (old count) × increase.", why: "The new score must give every old innings +3 and still sit at the new average itself.", whenNot: "If the average decreases, add instead of subtract." },
    traps: ["Subtracting 17×3 (gives 36, the OLD average)."], t: 35, obj: "Use the 'share-out' view of averages." }),
  Q("av3", "average", { d: 3, stem: "The average age of 30 students is 15 years. When the teacher's age is included, the average becomes 16. How old is the teacher?", options: ["45", "46", "31", "47"], answer: 1, check: 31 * 16 - 30 * 15,
    explanation: "31 × 16 − 30 × 15 = 496 − 450 = 46.",
    fastest: "Teacher = new avg + 30 × (increase) = 16 + 30 = 46.", traps: ["Answering 16 + 31 = 47."], t: 25, obj: "Totals change with count." }),

  // ── Mixtures
  Q("mx1", "mixture", { d: 4, stem: "A 60-litre solution is 20% alcohol. How many litres of pure alcohol must be added to make it 40% alcohol?", options: ["12", "15", "20", "24"], answer: 2, check: 20,
    explanation: "Alcohol = 12 L. (12 + x)/(60 + x) = 0.4 → 12 + x = 24 + 0.4x → x = 20.",
    fastest: "Water (48 L) is unchanged and must become 60% → total = 80 L → add 20 L.",
    shortcut: { trick: "Track the component that does NOT change.", why: "Its absolute amount is fixed, so you can find the new total from its new percentage.", whenNot: "When both components change." },
    traps: ["Adding 12 L (doubling the alcohol but not accounting for the new total)."], t: 35, obj: "Use the invariant component." }),
  Q("mx2", "mixture", { d: 5, stem: "A container holds 40 litres of milk. 4 litres are removed and replaced with water. This is done three times in total. How much milk is left?", options: ["28 L", "29.16 L", "30 L", "28.8 L"], answer: 1, check: 40 * 0.9 ** 3,
    explanation: "Each operation keeps 36/40 = 0.9 of the milk. After 3: 40 × 0.9³ = 40 × 0.729 = 29.16 L.",
    fastest: "Final = initial × (1 − r/V)ⁿ.", shortcut: { trick: "Replacement: milk left = V(1 − x/V)ⁿ.", why: "Each removal takes the same fraction of whatever milk is present.", whenNot: "If the amount removed changes each time, multiply step by step." },
    traps: ["Subtracting 12 L (removes only milk each time)."], t: 40, obj: "Repeated dilution." }),

  // ── Interest
  Q("in1", "interest", { d: 1, stem: "Simple interest on a sum for 3 years at 8% per annum is Tk 1,200. What is the sum?", options: ["Tk 4,500", "Tk 5,000", "Tk 4,800", "Tk 6,000"], answer: 1, check: (1200 * 100) / 24,
    explanation: "P = SI × 100 / (R × T) = 1,200 × 100 / 24 = 5,000.", fastest: "24% of P = 1,200 → P = 5,000.", traps: ["Using 8% only."], t: 15, obj: "SI formula." }),
  Q("in2", "interest", { d: 2, stem: "A sum doubles itself in 8 years at simple interest. What is the rate of interest?", options: ["10%", "12.5%", "8%", "15%"], answer: 1, check: 100 / 8,
    explanation: "Interest = P in 8 years → 100% in 8 years → 12.5% per year.", fastest: "Rate = 100/years to double.", traps: ["Using the CI 'rule of 72'."], t: 15, obj: "SI doubling." }),
  Q("in3", "interest", { d: 4, stem: "A sum amounts to Tk 6,050 in 2 years and Tk 6,655 in 3 years at compound interest. What is the rate?", options: ["8%", "10%", "11%", "12%"], answer: 1, check: ((6655 - 6050) / 6050) * 100,
    explanation: "The third year's interest (6,655 − 6,050 = 605) is earned on 6,050 → 605/6,050 = 10%.",
    fastest: "Consecutive CI amounts: rate = difference ÷ earlier amount.", traps: ["Dividing 605 by the principal."], t: 25, obj: "CI between consecutive years." }),

  // ── Work
  Q("wk1", "work", { d: 2, stem: "A and B together finish a job in 12 days. A alone takes 20 days. How long would B alone take?", options: ["25 days", "30 days", "32 days", "8 days"], answer: 1, check: 1 / (1 / 12 - 1 / 20),
    explanation: "B's rate = 1/12 − 1/20 = (5 − 3)/60 = 1/30 → 30 days.", fastest: "Product/difference: 12×20/(20−12) = 240/8 = 30.", traps: ["Subtracting days: 20 − 12 = 8."], t: 25, obj: "Subtract rates." }),
  Q("wk2", "work", { d: 5, stem: "A can do a job in 10 days and B in 15 days. They start together, but A leaves 2 days before the work is finished. How many days does the job take in total?", options: ["6", "7.2", "8", "6.8"], answer: 1, check: 36 / 5,
    explanation: "Let total = t. A works t − 2 days, B works t: (t − 2)/10 + t/15 = 1 → 3(t − 2) + 2t = 30 → t = 7.2.",
    fastest: "LCM units: job = 30; A = 3/day, B = 2/day. B alone for the last 2 days does 4 → remaining 26 at 5/day = 5.2 days → total 7.2.", traps: ["Assuming A leaves after 2 days."], t: 60, obj: "Handle a worker leaving." }),
  Q("wk3", "work", { d: 4, stem: "12 workers can finish a project in 18 days. After 6 days, 4 more workers join. In how many days in total is the project completed?", options: ["14", "15", "16", "13.5"], answer: 1, check: 6 + (12 * 18 - 12 * 6) / 16,
    explanation: "Work = 216 worker-days. Done = 72. Remaining 144 with 16 workers = 9 days. Total 15.",
    fastest: "Remaining 12 days of work for 12 workers → with 16 workers: 12×12/16 = 9.", traps: ["Giving 9 (forgets the first 6 days)."], t: 35, obj: "Man-days." }),
  Q("wk4", "work", { d: 6, stem: "A is twice as efficient as B. Together they finish a job in 14 days. How long would A alone take?", options: ["21 days", "28 days", "42 days", "18 days"], answer: 0, check: 21,
    explanation: "Rates 2 : 1. Together 3 units/day for 14 days = 42 units. A alone at 2/day = 21 days.", fastest: "A does 2/3 of the joint rate → time = 14 × 3/2 = 21.", traps: ["Answering 42 (that's B)."], t: 25, obj: "Efficiency ratios." }),
  Q("wk5", "work", { d: 4, stem: "Pipes A and B can fill a tank in 20 and 30 minutes respectively. Both are opened together, and B is closed after 4 minutes. How long does it take in total to fill the tank?", options: ["16 min", "17 min 20 s", "18 min", "15 min 40 s"], answer: 1, check: "17 min 20 s",
    explanation: "In 4 min, both fill 4(1/20 + 1/30) = 1/3. Remaining 2/3 by A alone takes (2/3)×20 = 40/3 = 13 min 20 s. Total = 17 min 20 s.",
    fastest: "Tank = 60 units; A = 3/min, B = 2/min. 4 min → 20 units. 40 left ÷ 3 = 13⅓ min.", traps: ["Forgetting to add the first 4 minutes."], t: 45, obj: "Phase-by-phase work." }),

  // ── Time, speed, distance
  Q("sd1", "tsd", { d: 3, stem: "Walking at 3/4 of his usual speed, a man reaches his office 20 minutes late. What is his usual time?", options: ["40 min", "60 min", "80 min", "45 min"], answer: 1, check: 60,
    explanation: "Time ∝ 1/speed → new time = 4/3 usual. Extra 1/3 of usual = 20 → usual = 60 min.",
    fastest: "Speed factor a/b → delay = usual × (b − a)/a → usual = 20 × 3/1 = 60.", traps: ["Answering 80 (the new time)."], t: 25, obj: "Inverse proportion of speed and time." }),
  Q("sd2", "tsd", { d: 3, stem: "Two cars start at 9:00 am from cities 300 km apart and drive toward each other at 40 km/h and 60 km/h. When do they meet?", options: ["11:30 am", "12:00 noon", "12:30 pm", "1:00 pm"], answer: 1, check: "12:00 noon",
    explanation: "Closing speed = 100 km/h → 300/100 = 3 h → 12:00 noon.", fastest: "Opposite directions → add speeds.", traps: ["Subtracting speeds."], t: 20, obj: "Relative speed (towards each other)." }),
  Q("sd3", "tsd", { d: 5, stem: "A thief runs at 8 km/h. A police officer starts chasing 15 minutes later at 10 km/h. How far does the officer run before catching the thief?", options: ["8 km", "10 km", "12 km", "5 km"], answer: 1, check: 10,
    explanation: "Thief's head start = 8 × 1/4 = 2 km. Relative speed = 2 km/h → catch in 1 h. Officer runs 10 km.", fastest: "Gap ÷ relative speed = time; × chaser's speed.", traps: ["Giving the thief's distance from the officer's start time (8 km)."], t: 35, obj: "Chase problems." }),
  Q("sd4", "boats-trains", { d: 3, stem: "A 150 m long train crosses a 250 m platform in 20 seconds. What is its speed in km/h?", options: ["54", "72", "60", "90"], answer: 1, check: (400 / 20) * 3.6,
    explanation: "Distance = 150 + 250 = 400 m. Speed = 20 m/s × 18/5 = 72 km/h.", fastest: "m/s × 3.6 = km/h.", traps: ["Using only the platform length."], t: 25, obj: "Train + platform length." }),
  Q("sd5", "boats-trains", { d: 4, stem: "A train crosses a pole in 15 seconds and a 100 m bridge in 25 seconds. What is the length of the train?", options: ["120 m", "150 m", "180 m", "100 m"], answer: 1, check: 150,
    explanation: "Speed v: L = 15v and L + 100 = 25v → 10v = 100 → v = 10 m/s → L = 150 m.", fastest: "The extra 10 s covers the 100 m bridge → v = 10 m/s.", traps: ["Answering 100."], t: 30, obj: "Difference method." }),
  Q("sd6", "boats-trains", { d: 3, stem: "A boat's speed in still water is 15 km/h and the stream flows at 3 km/h. How long does it take to go 36 km downstream and come back?", options: ["4.8 h", "5 h", "4.5 h", "5.5 h"], answer: 1, check: 36 / 18 + 36 / 12,
    explanation: "Down = 18 km/h → 2 h. Up = 12 km/h → 3 h. Total 5 h.", fastest: "Compute each leg separately — never average the speeds.", traps: ["Using 15 km/h both ways (4.8 h)."], t: 25, obj: "Downstream/upstream." }),

  // ── Numbers
  Q("nm1", "numbers", { d: 2, stem: "What is the smallest number that leaves a remainder of 3 when divided by 6, 9 or 15?", options: ["90", "93", "183", "87"], answer: 1, check: 90 + 3,
    explanation: "LCM(6, 9, 15) = 90. Add the common remainder: 93.", fastest: "LCM + common remainder.", traps: ["Stopping at 90."], t: 25, obj: "LCM with remainder." }),
  Q("nm2", "numbers", { d: 4, stem: "How many integers from 1 to 300 inclusive are divisible by 3 or 5?", options: ["160", "140", "120", "150"], answer: 1, check: 100 + 60 - 20,
    explanation: "÷3: 100. ÷5: 60. ÷15 (both): 20. Total = 100 + 60 − 20 = 140.", fastest: "Inclusion–exclusion with floor division.", traps: ["Forgetting to subtract multiples of 15."], t: 35, obj: "Counting multiples." }),
  Q("nm3", "numbers", { d: 5, stem: "If n is a positive integer and n² is divisible by 72, what is the largest integer that must divide n?", options: ["6", "12", "24", "36"], answer: 1, check: 12,
    explanation: "72 = 2³ × 3². n² has even powers, so n² must include at least 2⁴ × 3² → n must include 2² × 3 = 12.", fastest: "Halve each exponent of 72, rounding up: 2^⌈3/2⌉ × 3^⌈2/2⌉ = 4 × 3.", traps: ["Answering 6 (√36) or 72."], t: 50, obj: "Prime factorisation of perfect squares." }),
  Q("nm4", "remainders", { d: 4, stem: "What is the remainder when 2¹⁰⁰ is divided by 7?", options: ["1", "2", "4", "3"], answer: 1, check: 2,
    explanation: "2³ = 8 ≡ 1 (mod 7). 100 = 3 × 33 + 1 → 2¹⁰⁰ = (2³)³³ × 2 ≡ 1 × 2 = 2.", fastest: "Find a power that gives remainder 1, then reduce the exponent.", traps: ["Using units-digit cycles (mod 10) instead of mod 7."], t: 35, obj: "Remainder cycles." }),
  Q("nm5", "lcm-hcf", { d: 2, stem: "The HCF of two numbers is 12 and their LCM is 360. If one number is 72, what is the other?", options: ["48", "60", "90", "120"], answer: 1, check: (12 * 360) / 72,
    explanation: "HCF × LCM = product → other = 12 × 360 / 72 = 60.", fastest: "Product rule.", traps: ["Dividing LCM by HCF."], t: 20, obj: "HCF × LCM = product (two numbers)." }),

  // ── Algebra
  Q("al1", "linear", { d: 1, stem: "The sum of two numbers is 50 and their difference is 14. What is the larger number?", options: ["30", "32", "36", "18"], answer: 1, check: (50 + 14) / 2,
    explanation: "Larger = (sum + difference)/2 = 32.", fastest: "(S + D)/2.", traps: ["Answering the smaller (18)."], t: 15, obj: "Sum–difference." }),
  Q("al2", "linear", { d: 4, stem: "If 1 is added to both the numerator and denominator of a fraction, it becomes 1/2. If 1 is subtracted from both, it becomes 1/3. What is the fraction?", options: ["3/7", "2/5", "4/9", "3/8"], answer: 0, check: "3/7",
    explanation: "2(x + 1) = y + 1 → y = 2x + 1. 3(x − 1) = y − 1 → y = 3x − 2. So x = 3, y = 7.", fastest: "Backsolve: 3/7 → 4/8 = 1/2 ✓, 2/6 = 1/3 ✓.", traps: [], t: 40, obj: "Backsolving fractions." }),
  Q("al3", "quadratic", { d: 3, stem: "If x + 1/x = 5, what is x² + 1/x²?", options: ["25", "23", "27", "21"], answer: 1, check: 25 - 2,
    explanation: "(x + 1/x)² = x² + 2 + 1/x² → 25 − 2 = 23.", fastest: "Square and subtract 2.", traps: ["Answering 25."], t: 15, obj: "Algebraic identities." }),
  Q("al4", "quadratic", { d: 5, stem: "If a + b = 7 and ab = 10, what is a³ + b³?", options: ["133", "343", "153", "113"], answer: 0, check: 343 - 3 * 10 * 7,
    explanation: "a³ + b³ = (a + b)³ − 3ab(a + b) = 343 − 210 = 133.", fastest: "Identity; or spot a, b = 5, 2 → 125 + 8.", traps: ["Forgetting the −3ab(a+b) term."], t: 30, obj: "Cubic identities." }),
  Q("al5", "inequalities", { d: 3, stem: "How many integers x satisfy |2x − 5| < 3?", options: ["1", "2", "3", "4"], answer: 1, check: 2,
    explanation: "−3 < 2x − 5 < 3 → 2 < 2x < 8 → 1 < x < 4 → x = 2, 3.", fastest: "Centre 2.5, radius 1.5 → open interval (1, 4).", traps: ["Including 1 and 4 (strict inequality)."], t: 30, obj: "Absolute value as distance." }),
  Q("al6", "inequalities", { d: 5, stem: "If −3 ≤ x ≤ 2 and −1 ≤ y ≤ 4, what is the greatest possible value of xy?", options: ["3", "8", "12", "−12"], answer: 1, check: Math.max(-3 * -1, -3 * 4, 2 * -1, 2 * 4),
    explanation: "Check corner products: (−3)(−1) = 3, (−3)(4) = −12, (2)(−1) = −2, (2)(4) = 8. Max = 8.", fastest: "Extremes of a product occur at the endpoints — test all four corners.", traps: ["Assuming the two negatives give the maximum."], t: 35, obj: "Range of products." }),
  Q("al7", "exponents", { d: 3, stem: "If 2^(x+3) = 32^(x−1), what is x?", options: ["1", "2", "3", "4"], answer: 1, check: 2,
    explanation: "32 = 2⁵ → x + 3 = 5x − 5 → 4x = 8 → x = 2.", fastest: "Same base, equate exponents.", traps: ["Forgetting to distribute the 5."], t: 25, obj: "Exponent equations." }),
  Q("al8", "exponents", { d: 3, stem: "What is log₂ 8 + log₃ 81 − log₅ 25?", options: ["4", "5", "6", "7"], answer: 1, check: 3 + 4 - 2,
    explanation: "3 + 4 − 2 = 5.", fastest: "Ask 'what power?' for each.", traps: [], t: 20, obj: "Basic logarithms." }),
  Q("al9", "exponents", { d: 5, stem: "What is the value of √(12 + √(12 + √(12 + …)))?", options: ["3", "4", "√12", "6"], answer: 1, check: 4,
    explanation: "Let y = √(12 + y) → y² − y − 12 = 0 → (y − 4)(y + 3) = 0 → y = 4 (positive).", fastest: "Find n with n(n − 1) = 12 → n = 4.", traps: ["Choosing √12."], t: 30, obj: "Infinite nested radicals." }),
  Q("al10", "sequences", { d: 2, stem: "What is the sum of the first 20 odd natural numbers?", options: ["380", "400", "420", "441"], answer: 1, check: 400,
    explanation: "Sum of first n odd numbers = n² = 400.", fastest: "n².", traps: [], t: 10, obj: "Standard series." }),
  Q("al11", "sequences", { d: 4, stem: "The 3rd term of an arithmetic progression is 12 and the 7th term is 28. What is the 15th term?", options: ["56", "60", "64", "52"], answer: 1, check: 28 + 8 * 4,
    explanation: "4d = 16 → d = 4; a = 12 − 8 = 4; a₁₅ = 4 + 14×4 = 60.", fastest: "a₁₅ = a₇ + 8d = 28 + 32.", traps: [], t: 25, obj: "Jump between AP terms." }),
  Q("al12", "sequences", { d: 3, stem: "What is the sum of the infinite series 8 + 4 + 2 + 1 + …?", options: ["15", "16", "18", "∞"], answer: 1, check: 8 / (1 - 0.5),
    explanation: "Infinite GP with |r| < 1: S = a/(1 − r) = 8/0.5 = 16.", fastest: "a/(1 − r).", traps: ["Thinking an infinite sum must be infinite."], t: 15, obj: "Infinite GP." }),
  Q("al13", "functions", { d: 2, stem: "If f(x) = 2x + 3 and g(x) = x², what is f(g(2))?", options: ["11", "49", "14", "7"], answer: 0, check: 2 * 4 + 3,
    explanation: "g(2) = 4; f(4) = 11.", fastest: "Work inside-out.", traps: ["Computing g(f(2)) = 49."], t: 15, obj: "Composition." }),

  // ── Geometry
  Q("ge1", "triangles", { d: 1, stem: "The angles of a triangle are in the ratio 2 : 3 : 4. What is the largest angle?", options: ["60°", "80°", "90°", "100°"], answer: 1, check: (180 / 9) * 4,
    explanation: "9 parts = 180° → 1 part = 20° → largest = 80°.", fastest: "180/9 × 4.", traps: [], t: 15, obj: "Angle sum." }),
  Q("ge2", "circles", { d: 3, stem: "Each exterior angle of a regular polygon is 24°. How many sides does it have?", options: ["12", "15", "18", "20"], answer: 1, check: 360 / 24,
    explanation: "Exterior angles sum to 360° → n = 360/24 = 15.", fastest: "360 ÷ exterior angle.", traps: ["Using 180°."], t: 15, obj: "Polygon angles." }),
  Q("ge3", "triangles", { d: 4, stem: "In triangle ABC, D is on AB and E is on AC with DE ∥ BC. If AD = 4, DB = 6 and DE = 8, what is BC?", options: ["12", "20", "16", "14"], answer: 1, check: (8 * 10) / 4,
    explanation: "Triangles ADE and ABC are similar: AD/AB = DE/BC → 4/10 = 8/BC → BC = 20.", fastest: "Scale factor AB/AD = 10/4 = 2.5 → 8 × 2.5.", traps: ["Using DB instead of AB (gives 12)."], t: 30, obj: "Similar triangles." }),
  Q("ge4", "circles", { d: 2, stem: "The circumference of a circle is 44 cm. What is its area? (Use π = 22/7.)", options: ["144 cm²", "154 cm²", "616 cm²", "308 cm²"], answer: 1, check: (22 / 7) * 49,
    explanation: "2πr = 44 → r = 7. Area = 22/7 × 49 = 154.", fastest: "Know: r = 7 ↔ C = 44, A = 154.", traps: ["Using diameter as radius (616)."], t: 20, obj: "Circle formulas." }),
  Q("ge5", "circles", { d: 3, stem: "An arc subtends an angle of 120° at the centre of a circle. What angle does it subtend at any point on the remaining part of the circumference?", options: ["30°", "60°", "120°", "240°"], answer: 1, check: 60,
    explanation: "The angle at the circumference is half the angle at the centre on the same arc.", fastest: "Halve it.", traps: [], t: 15, obj: "Circle theorems." }),
  Q("ge6", "mensuration", { d: 2, stem: "The volume of a cube is 343 cm³. What is its total surface area?", options: ["196 cm²", "294 cm²", "343 cm²", "245 cm²"], answer: 1, check: 6 * 49,
    explanation: "Side = ∛343 = 7. TSA = 6 × 49 = 294.", fastest: "Know cubes 1–10.", traps: [], t: 15, obj: "Cube formulas." }),
  Q("ge7", "mensuration", { d: 3, stem: "The length of a rectangle is increased by 20% and its breadth is decreased by 20%. What happens to its area?", options: ["No change", "Decreases by 4%", "Increases by 4%", "Decreases by 2%"], answer: 1, check: "Decreases by 4%",
    explanation: "1.2 × 0.8 = 0.96 → 4% decrease.", fastest: "+x and −x → always −x²/100 %.", traps: ["Assuming they cancel."], t: 15, obj: "Area percentage change." }),
  Q("ge8", "mensuration", { d: 3, stem: "What is the curved surface area of a cylinder with radius 7 cm and height 10 cm? (π = 22/7)", options: ["440 cm²", "1,540 cm²", "748 cm²", "220 cm²"], answer: 0, check: 2 * (22 / 7) * 7 * 10,
    explanation: "CSA = 2πrh = 2 × 22/7 × 7 × 10 = 440.", fastest: "2 × 22 × 10.", traps: ["Computing volume (1,540) or total surface area (748)."], t: 20, obj: "Cylinder formulas." }),
  Q("ge9", "coordinate", { d: 2, stem: "What is the distance between the points (2, 3) and (8, 11)?", options: ["8", "10", "12", "14"], answer: 1, check: Math.hypot(6, 8),
    explanation: "√(6² + 8²) = √100 = 10.", fastest: "Spot the 6-8-10 triple.", traps: [], t: 15, obj: "Distance formula." }),
  Q("ge10", "coordinate", { d: 2, stem: "What is the slope of the line through (1, 2) and (4, 11)?", options: ["2", "3", "4", "1/3"], answer: 1, check: 9 / 3,
    explanation: "(11 − 2)/(4 − 1) = 3.", fastest: "Rise over run.", traps: ["Inverting (run/rise)."], t: 10, obj: "Slope." }),

  // ── Counting, probability, sets, stats
  Q("cp1", "pnc", { d: 3, stem: "In how many distinct ways can the letters of the word LEVEL be arranged?", options: ["60", "30", "120", "20"], answer: 1, check: 120 / 4,
    explanation: "5 letters with L×2 and E×2: 5!/(2!·2!) = 30.", fastest: "Divide by factorials of repeats.", traps: ["Dividing by only one 2!."], t: 25, obj: "Arrangements with repetition." }),
  Q("cp2", "pnc", { d: 4, stem: "In how many ways can 6 people sit around a round table?", options: ["720", "120", "60", "360"], answer: 1, check: 120,
    explanation: "Circular arrangements of n distinct people: (n − 1)! = 5! = 120.", fastest: "Fix one person, arrange the rest.", traps: ["Using 6! = 720."], t: 15, obj: "Circular permutations." }),
  Q("cp3", "pnc", { d: 2, stem: "At a meeting, each of 12 people shakes hands with every other person exactly once. How many handshakes take place?", options: ["132", "66", "144", "72"], answer: 1, check: (12 * 11) / 2,
    explanation: "C(12, 2) = 66.", fastest: "n(n − 1)/2.", traps: ["Forgetting to divide by 2 (132)."], t: 15, obj: "Combinations." }),
  Q("cp4", "probability", { d: 3, stem: "A bag has 5 red and 3 blue balls. Two balls are drawn without replacement. What is the probability that both are red?", options: ["25/64", "5/14", "5/16", "15/28"], answer: 1, check: "5/14",
    explanation: "5/8 × 4/7 = 20/56 = 5/14.", fastest: "C(5,2)/C(8,2) = 10/28 = 5/14.", traps: ["Using replacement (25/64).", "15/28 = P(exactly one red) — answering a different question."], t: 30, obj: "Without replacement." }),
  Q("cp5", "probability", { d: 3, stem: "A fair coin is tossed three times. What is the probability of getting at least one head?", options: ["1/2", "3/4", "7/8", "1/8"], answer: 2, check: "7/8",
    explanation: "P(no head) = (1/2)³ = 1/8 → P(at least one) = 7/8.", fastest: "1 − P(none).", traps: ["Adding probabilities."], t: 15, obj: "Complement rule." }),
  Q("cp6", "sets", { d: 3, stem: "Of 100 people, 60 like tea, 50 like coffee and 30 like both. How many like exactly one of the two?", options: ["50", "80", "20", "40"], answer: 0, check: 60 - 30 + (50 - 30),
    explanation: "Tea only = 30, coffee only = 20 → 50.", fastest: "A + B − 2·Both.", traps: ["Computing 'at least one' (80)."], t: 25, obj: "Exactly one vs at least one." }),
  Q("cp7", "statistics", { d: 2, stem: "What is the median of 7, 3, 9, 1, 5, 11?", options: ["5", "6", "7", "6.5"], answer: 1, check: 6,
    explanation: "Sorted: 1, 3, 5, 7, 9, 11. Median = (5 + 7)/2 = 6.", fastest: "Sort first; even count → average the middle two.", traps: ["Taking the middle of the unsorted list."], t: 15, obj: "Median." }),
  Q("cp8", "ages", { d: 3, stem: "The sum of the present ages of a father and son is 50 years. Five years ago, the father was four times as old as the son. What is the son's present age?", options: ["12", "13", "15", "10"], answer: 1, check: 13,
    explanation: "F + S = 50; F − 5 = 4(S − 5) → F = 4S − 15 → 5S − 15 = 50 → S = 13.", fastest: "Backsolve: S = 13 → F = 37 → 32 = 4 × 8 ✓.", traps: [], t: 35, obj: "Age equations." }),
];
