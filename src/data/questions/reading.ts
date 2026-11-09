import type { Difficulty, Passage, Question } from "@/lib/types";

/** Original reading passages and questions written for this app. */

export const PASSAGES: Passage[] = [
  {
    id: "p-remit",
    title: "The double edge of remittances",
    domain: "Economics",
    difficulty: 3,
    text: `For a country like Bangladesh, money sent home by workers abroad is often described as a lifeline. Remittances arrive in foreign currency, they do not have to be repaid, and they reach households directly rather than passing through a government budget. In years when export earnings stall, these inflows can keep the balance of payments from tipping into crisis.

Yet economists have long cautioned against treating remittances as an unmixed blessing. A large and steady inflow of foreign currency tends to push up the value of the domestic currency, or at least to prevent it from falling. A stronger currency makes a country's exports more expensive abroad and its imports cheaper at home. Over time, manufacturers who compete with foreign producers may find their margins squeezed, while the sectors that serve remittance-funded consumption — housing, retail, imported consumer goods — expand. The pattern resembles what happened to some resource-rich countries, where a boom in one source of foreign earnings quietly hollowed out other industries.

There is a further, subtler concern. Because remittances are private transfers, they are spent according to household priorities, which may favour consumption and land purchases over productive investment. In villages with many migrant families, land prices can climb sharply without any corresponding rise in agricultural output.

None of this means remittances are harmful. Studies consistently find that remittance-receiving households spend more on education and health, and are better able to withstand floods or illness. The point is rather that the benefits are largest when the rest of the economy is ready to absorb the money productively: when there are accessible savings instruments, credible small-business lending, and an exchange-rate policy that does not let the currency drift too far from what exporters can bear.`,
  },
  {
    id: "p-choice",
    title: "Too many jams",
    domain: "Psychology",
    difficulty: 4,
    text: `A widely cited experiment from the early 2000s set up a tasting booth in a supermarket. On some days the booth displayed twenty-four varieties of jam; on others, only six. The larger display attracted more passers-by, but a far smaller share of those who stopped actually bought a jar. The finding became the foundation of a popular idea, the "paradox of choice": beyond a certain point, more options make people less likely to choose and less satisfied when they do.

The idea spread quickly into marketing seminars and self-help books. Less attention was paid to what happened next in the research literature. When other teams attempted to reproduce the effect, results were mixed. Statistical reviews that pooled dozens of studies found that the average effect of large assortments on purchase decisions was close to zero — though later work suggested the effect was real under particular conditions, such as when options were hard to compare, when people had no clear preferences beforehand, or when they were under time pressure.

This does not mean the original researchers were careless. It means that a single striking result, however elegant, is weak evidence for a universal law of human behaviour. Context matters: a shopper who knows she wants strawberry jam is unlikely to be paralysed by a wall of flavours, whereas a first-time buyer of a complicated insurance product may well be. For managers, the practical lesson is not "always offer fewer choices" but "make choices easier to compare" — through clear categories, sensible defaults and honest summaries of trade-offs.`,
  },
  {
    id: "p-ai",
    title: "Automation and the shape of work",
    domain: "Technology",
    difficulty: 4,
    text: `Predictions about machines destroying jobs are as old as machines themselves. In the early nineteenth century, textile workers smashed mechanised looms; in the 1960s, commentators warned that computers would leave millions idle. In each case, the feared collapse in employment did not arrive. New industries emerged, and the jobs that disappeared were replaced, over time, by jobs no one had imagined.

Optimists conclude from this record that today's anxieties about artificial intelligence are similarly misplaced. Their argument is historical: technology changes the composition of work, not its quantity. Sceptics accept the history but question whether it applies. Earlier machines, they note, mostly replaced physical effort, leaving humans to specialise in tasks requiring judgement, communication and pattern recognition. Software that can draft contracts, summarise medical records and write computer code reaches directly into those very tasks.

A more careful reading of the evidence suggests that the important question is not "how many jobs?" but "which tasks, and how fast?". Most occupations are bundles of tasks, only some of which can be automated. A loan officer whose data-entry work disappears may spend more time on difficult cases — or the bank may decide it needs fewer loan officers. Which outcome prevails depends on whether demand for the service grows as it becomes cheaper, on how quickly workers can retrain, and on choices made by firms and governments. The transition, rather than the destination, is where most of the pain lies: workers displaced in their fifties rarely become the software engineers of the new economy.`,
  },
  {
    id: "p-ship",
    title: "The Theseus problem",
    domain: "Philosophy",
    difficulty: 5,
    text: `Plutarch records a puzzle about the ship in which Theseus returned to Athens. The Athenians preserved it for centuries, replacing each rotting plank with a new one, until eventually no original timber remained. Was it still the same ship? Later philosophers sharpened the puzzle: suppose someone collected the discarded planks and reassembled them. Which of the two vessels is Theseus's ship?

One response holds that identity follows material: the reassembled ship, made of the original planks, is the real one. But this seems to imply that the Athenians, who never ceased to own and maintain their ship, were somehow robbed of it by a scavenger. A second response holds that identity follows continuity of form and function: the ship that was gradually repaired, never ceasing to exist as a ship, is the original. Yet this view must say that a vessel built entirely from Theseus's own timbers is an impostor.

A third, deflationary response suggests the question has no deep answer. "Same ship" is a concept we use for practical purposes — ownership, insurance, museum labels — and different purposes favour different criteria. On this view, once we know all the facts about the planks and the repairs, there is no further fact about which ship is "really" Theseus's; there is only a decision about how to use words.

The puzzle is not idle. Organisations face it whenever their membership, assets and even purpose change over decades. Whether a company that has replaced every employee and product is "the same company" is, in law, settled by registration; in practice, by whatever its stakeholders choose to honour.`,
  },
  {
    id: "p-delta",
    title: "Living with water",
    domain: "Environment",
    difficulty: 3,
    text: `For much of the twentieth century, the dominant approach to floods in deltas was to keep water out. Engineers built embankments around low-lying islands to protect crops and homes. In coastal Bangladesh, these enclosures, known as polders, did increase rice production for a time. But they also had an unintended consequence. Rivers in a delta carry enormous amounts of sediment, and in natural conditions, floods spread this sediment across the land, gradually raising it. Inside the embankments, the land received no new sediment while it continued to settle. Meanwhile, sediment deposited in the channels outside raised the riverbeds. Over decades, some polders ended up lower than the surrounding rivers, and when embankments failed, water flooded in and could not drain out.

In response, planners have experimented with an approach sometimes called "tidal river management". Instead of keeping water out permanently, selected areas are deliberately opened to the tides for several years, allowing sediment to settle and raise the land before the area is closed again. The method asks some farmers to give up their fields temporarily, which requires compensation and trust between communities and authorities — both of which have at times been lacking.

The broader lesson, which applies from the Netherlands to the Mekong, is that deltas are not static. Strategies that treat them as fixed ground to be defended may succeed for a generation and then fail in ways that are harder to repair.`,
  },
  {
    id: "p-guild",
    title: "Credit before banks",
    domain: "History",
    difficulty: 5,
    text: `It is tempting to assume that trade on a large scale requires the institutions we associate with modern capitalism: courts that enforce contracts, banks that extend credit, and states that guarantee property. Historians of medieval Mediterranean commerce have shown that this assumption is too simple. Long-distance merchants in the eleventh century routinely entrusted goods worth years of income to agents in distant ports, with no realistic prospect of suing them if they absconded.

How did such trust survive? One influential account emphasises reputation within closed networks. A group of traders, often linked by religion and kinship, shared information through letters about which agents had behaved honestly. An agent who cheated one merchant would be shunned by all, losing far more in future business than he could gain from a single theft. On this view, the network functioned as a substitute for formal courts.

Later scholars have qualified this picture. Surviving correspondence shows that merchants also used formal contracts, appealed to local courts and dealt freely with outsiders when it was profitable. Reputation mattered, but it operated alongside legal institutions rather than replacing them. The debate is not merely antiquarian: development economists cite it when they ask whether poor countries must build Western-style legal systems before markets can flourish, or whether informal institutions can carry them part of the way.`,
  },
];

type X = Partial<Pick<Question, "traps" | "fastest" | "timeSec">>;
const R = (id: string, passageId: string, difficulty: Difficulty, stem: string, options: string[], answer: number, explanation: string, objective: string, x: X = {}): Question => ({
  id: `rc-${id}`,
  subject: "english",
  topic: "rc",
  difficulty,
  stem,
  options,
  answer,
  explanation,
  objective,
  passageId,
  traps: x.traps,
  fastest: x.fastest ?? "Read the question first, locate the paragraph, then predict an answer before reading the options.",
  timeSec: x.timeSec ?? 75,
  source: "original",
});

export const RC_QUESTIONS: Question[] = [
  R("remit1", "p-remit", 3, "The primary purpose of the passage is to:", [
    "argue that Bangladesh should discourage remittances",
    "explain that remittances bring real benefits but also risks that depend on wider economic conditions",
    "describe the history of migration from Bangladesh",
    "prove that remittances cause land prices to rise",
  ], 1, "The passage lists benefits (para 1, 4) and concerns (para 2, 3), then concludes the benefits are largest when the economy can absorb the money productively.", "Main idea", { traps: ["D is a detail, not the purpose.", "A is too extreme: 'None of this means remittances are harmful'."] }),
  R("remit2", "p-remit", 4, "According to the passage, a large inflow of remittances can hurt exporters mainly because it:", [
    "raises taxes on manufacturing",
    "keeps the domestic currency stronger than it would otherwise be",
    "causes workers to leave factories for jobs abroad",
    "reduces household spending on education",
  ], 1, "Para 2: inflows push up (or prevent a fall in) the currency, making exports more expensive abroad.", "Detail / mechanism"),
  R("remit3", "p-remit", 4, "The author mentions resource-rich countries in order to:", [
    "contrast them with Bangladesh",
    "illustrate a similar pattern in which one source of foreign earnings weakened other industries",
    "suggest Bangladesh should develop its natural resources",
    "show that remittances are larger than resource exports",
  ], 1, "The comparison says the pattern 'resembles' a boom that hollowed out other industries — an analogy, not a contrast.", "Function of a detail"),
  R("remit4", "p-remit", 5, "Which of the following can most reasonably be inferred from the passage?", [
    "Households receiving remittances never invest in businesses.",
    "Better access to savings and small-business credit could increase the productive use of remittances.",
    "The government should tax remittances to slow currency appreciation.",
    "Land prices in villages without migrants have fallen.",
  ], 1, "The last paragraph says benefits are largest when there are accessible savings instruments and credible small-business lending — B follows directly.", "Inference", { traps: ["A uses 'never' — too strong.", "C proposes a policy the passage never discusses."] }),

  R("choice1", "p-choice", 3, "The 'paradox of choice' as described in the passage is the idea that:", [
    "people prefer stores with more variety",
    "beyond some point, more options reduce the likelihood of choosing and satisfaction",
    "jam sales depend on price",
    "consumers always buy the first product they taste",
  ], 1, "Defined at the end of para 1.", "Detail"),
  R("choice2", "p-choice", 4, "The author's attitude toward the original jam study is best described as:", [
    "dismissive",
    "respectful but cautious about over-generalising from it",
    "enthusiastically supportive",
    "indifferent",
  ], 1, "Para 3: 'This does not mean the original researchers were careless' + 'a single striking result… is weak evidence for a universal law'.", "Tone", { traps: ["'Dismissive' overstates — the author explicitly defends the researchers."] }),
  R("choice3", "p-choice", 5, "According to the passage, a large assortment is MOST likely to discourage a purchase when the buyer:", [
    "already knows exactly which flavour she wants",
    "is choosing among complex options with no clear prior preference",
    "is shopping in a supermarket",
    "has plenty of time",
  ], 1, "Conditions listed: options hard to compare, no clear preferences, time pressure. The insurance example illustrates this.", "Application"),
  R("choice4", "p-choice", 5, "Which practical recommendation does the author endorse?", [
    "Always reduce the number of products offered.",
    "Make options easier to compare through categories, defaults and clear summaries.",
    "Stop running tasting booths.",
    "Rely on self-help books for marketing strategy.",
  ], 1, "Last sentence.", "Author's conclusion"),

  R("ai1", "p-ai", 3, "The optimists' argument, as presented, relies mainly on:", [
    "economic modelling of AI",
    "the historical record of earlier technologies",
    "surveys of workers",
    "government employment data from the 1960s only",
  ], 1, "'Their argument is historical.'", "Argument structure"),
  R("ai2", "p-ai", 4, "The sceptics' main point is that:", [
    "history shows technology always destroys jobs",
    "new software may automate the judgement-based tasks that earlier machines left to humans",
    "AI will not change the composition of work",
    "textile workers were right to smash looms",
  ], 1, "Para 2: earlier machines replaced physical effort; new software 'reaches directly into those very tasks'.", "Argument structure"),
  R("ai3", "p-ai", 5, "The example of the loan officer is used to show that:", [
    "loan officers will certainly lose their jobs",
    "the effect of automating some tasks on employment can go either way depending on other factors",
    "banks are slow to adopt technology",
    "data entry is the most important part of lending",
  ], 1, "The officer 'may spend more time on difficult cases — or the bank may decide it needs fewer'; 'which outcome prevails depends on…'.", "Function of an example"),
  R("ai4", "p-ai", 5, "With which statement would the author most likely agree?", [
    "Concern about automation is entirely misplaced.",
    "The hardest problems of automation arise during the transition, especially for older displaced workers.",
    "Governments can do nothing to influence the outcome.",
    "Most occupations will be fully automated within a decade.",
  ], 1, "Last sentences: 'The transition… is where most of the pain lies'. The author also lists 'choices made by firms and governments' (so C is wrong).", "Author's view"),

  R("ship1", "p-ship", 4, "The 'deflationary' response holds that:", [
    "the reassembled ship is the real one",
    "the repaired ship is the real one",
    "once all physical facts are known, which ship is 'really' Theseus's is a matter of how we choose to use words",
    "neither ship ever existed",
  ], 2, "Para 3.", "Detail"),
  R("ship2", "p-ship", 5, "Which objection does the passage raise against the view that identity follows material?", [
    "It cannot explain how planks rot.",
    "It implies the Athenians lost their ship to a scavenger even though they never stopped owning and maintaining it.",
    "It makes the repaired ship an impostor.",
    "It relies on museum labels.",
  ], 1, "Para 2, first view. C is the objection to the SECOND view.", "Argument structure", { traps: ["Swapping the objections of the two views."] }),
  R("ship3", "p-ship", 6, "The final paragraph's reference to companies suggests that the author believes:", [
    "philosophical puzzles have no relevance to business",
    "questions of organisational identity are often settled by convention or stakeholder choice rather than by a deeper fact",
    "companies should never change their employees",
    "the law always reflects the true identity of an organisation",
  ], 1, "'In law, settled by registration; in practice, by whatever its stakeholders choose to honour' echoes the deflationary view.", "Inference / implication", { timeSec: 90 }),
  R("ship4", "p-ship", 5, "As used in the passage, 'idle' (last paragraph) most nearly means:", ["lazy", "without practical significance", "unemployed", "slow"], 1, "'The puzzle is not idle' = it has real-world relevance.", "Vocabulary in context"),

  R("delta1", "p-delta", 3, "According to the passage, why did some polders end up lower than the surrounding rivers?", [
    "Rising sea levels flooded them each year.",
    "Embankments blocked sediment from reaching the land while sediment raised the riverbeds outside.",
    "Farmers removed soil for brick-making.",
    "Engineers deliberately lowered the land.",
  ], 1, "Para 1 explains the mechanism.", "Cause and effect"),
  R("delta2", "p-delta", 4, "Tidal river management differs from the earlier approach mainly in that it:", [
    "builds higher embankments",
    "temporarily lets tidal water in so that sediment can raise the land",
    "relocates all farmers permanently",
    "uses Dutch engineers",
  ], 1, "Para 2.", "Comparison"),
  R("delta3", "p-delta", 4, "The passage suggests that a challenge for tidal river management is:", [
    "it has no effect on land levels",
    "it requires farmers to give up land temporarily, which depends on compensation and trust",
    "it is too expensive to build",
    "it only works in the Netherlands",
  ], 1, "Para 2, last sentence.", "Detail"),
  R("delta4", "p-delta", 5, "Which of the following best expresses the passage's broader lesson?", [
    "Embankments should never be built.",
    "Delta management should work with natural processes because deltas change over time.",
    "Rice production is more important than land height.",
    "The Mekong delta is the best-managed delta.",
  ], 1, "Final paragraph: deltas are not static; treating them as fixed may fail later.", "Main idea", { traps: ["A is too absolute — the passage says embankments did increase production for a time."] }),

  R("guild1", "p-guild", 4, "The passage is primarily concerned with:", [
    "proving that medieval merchants were dishonest",
    "examining how long-distance trade was sustained without strong formal institutions, and how historians' views have been revised",
    "describing the religious beliefs of medieval traders",
    "arguing that poor countries do not need legal systems",
  ], 1, "Para 1 sets the question, para 2 gives the reputation account, para 3 qualifies it.", "Main idea"),
  R("guild2", "p-guild", 5, "According to the reputation account, an agent would rarely cheat because:", [
    "courts would punish him severely",
    "the loss of future business from being shunned would outweigh the gain from cheating",
    "religious law forbade it",
    "merchants paid agents very high salaries",
  ], 1, "Para 2.", "Detail / mechanism"),
  R("guild3", "p-guild", 5, "Later scholars 'qualified' the earlier picture by showing that:", [
    "reputation did not matter at all",
    "merchants used formal contracts and courts as well as reputation",
    "medieval trade was mostly local",
    "letters were rarely written",
  ], 1, "Para 3: reputation 'operated alongside legal institutions rather than replacing them'.", "Detail", { traps: ["A overstates — 'Reputation mattered'."] }),
  R("guild4", "p-guild", 6, "Which of the following would most WEAKEN the original reputation-network account?", [
    "Evidence that cheating agents were named in many letters",
    "Evidence that agents who were publicly exposed as cheats continued to receive business from the same network",
    "Evidence that merchants were related by kinship",
    "Evidence that goods were very valuable",
  ], 1, "The account depends on cheaters being shunned. If exposed cheats kept getting business, the enforcement mechanism fails.", "Weaken (applied to a passage)", { timeSec: 90 }),
];
