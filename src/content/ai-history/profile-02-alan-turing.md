---
title: "Alan Turing"
series: "ai-history"
type: "profile"
episode_number: 102
roman: "II"
part: "part-profiles-a"
part_label: "Profiles: Founders & Theorists"
tag: "Profile"
description: "The man who asked 'Can machines think?' — his wartime codebreaking, the Turing Test, and his tragic end."
date: 2026-03-12
read_time: 14

---

# Alan Turing
## The Man Who Asked If Machines Could Think

*Born: 23 June 1912, Maida Vale, London, England*
*Died: 7 June 1954, Wilmslow, Cheshire, England*
*Age at death: 41*

---

In 1950, a mathematician who had spent the previous decade breaking Nazi codes, designing the theoretical foundations of the modern computer, and building one of the first working electronic machines in Britain, sat down and wrote a paper that opened with a question so simple it felt almost naive.

"Can machines think?"

Alan Turing knew the question was a trap. He spent the first several pages of "Computing Machinery and Intelligence" explaining why it was the wrong question — why the concepts of "machine" and "thinking" were too poorly defined to support a direct answer — before proposing a different question entirely, one that could actually be investigated. He called it the Imitation Game. The world would come to call it the Turing Test.

That paper is the founding document of artificial intelligence as a field of inquiry. It did not just ask whether machines could think. It defined what it would even mean to ask the question seriously, mapped the objections that anyone would raise, answered most of them, and sketched a research programme that computer scientists are still working through today. It was written by a forty-year-old man who had four years left to live, who was at that moment being investigated by the British government for a crime that would destroy him.

Turing's life is one of the most consequential and most tragic in the history of science. Understanding it requires holding two things simultaneously: the extraordinary intellectual achievement, and the extraordinary injustice. Neither one diminishes the other. Together they form a story about what societies do to the people they most need, and most fail to protect.

---

## A Mind That Worked Differently

Alan Mathison Turing was born in London in 1912, the second son of Julius Turing, a civil servant in the Indian Imperial Service, and Ethel Sara Stoney, daughter of an Anglo-Irish engineer. His parents spent much of his childhood in India, and Alan and his brother John were largely raised by a retired army couple in Hastings, seeing their parents during home leaves. It was not a warm childhood, but it was not an unhappy one. He was, by all accounts, a child who lived primarily inside his own head.

The signs of unusual ability were present early and were not entirely welcome. He was admitted to Sherborne School in Dorset in 1926, one of England's old public schools, where the emphasis was firmly on classics and character rather than science. His science master reported that Turing's work was "dirty" — meaning disorganised, unconventional — and that while he showed ability, he would not make progress without proper method. What the school saw as a deficiency was something closer to the opposite: Turing had a habit of working from first principles rather than received technique, which meant his methods looked wrong even when his answers were correct.

At Sherborne, he formed an intense friendship with Christopher Morcom, a boy a year older who shared his passion for mathematics and science. Morcom was, by the accounts of people who knew both of them, the most important person in the young Turing's life — intellectually, emotionally, in ways Turing himself may not have fully understood. When Morcom died suddenly of tuberculosis in 1930, just weeks before he was to go up to Cambridge, Turing was devastated. He wrote long letters to Morcom's mother. He kept a photograph. The loss appears to have sharpened something in him — a drive to accomplish things, to honour the promise of a mind that had been cut short.

He went to King's College, Cambridge, in 1931, read mathematics, and was elected a Fellow in 1935 on the basis of a dissertation on probability theory. He was twenty-two years old. The work that would define him had not yet begun.

---

## The Computable and the Uncomputable

In 1928, the German mathematician David Hilbert had posed a challenge to the mathematical community that became known as the Entscheidungsproblem — the "decision problem." In essence: is there a definite procedure, a mechanical method, that could in principle decide the truth or falsity of any mathematical statement? Hilbert believed the answer was yes. Mathematics, he felt, was a complete and consistent system that could, given enough time and ingenuity, answer any well-formed question.

By 1935, this optimism was already in trouble. Kurt Gödel had published his incompleteness theorems in 1931, showing that any sufficiently powerful formal system contains true statements that cannot be proved within that system. The dream of a complete mathematics was dead. But the Entscheidungsproblem remained technically open.

Turing's solution, published in 1936 in a paper titled "On Computable Numbers, with an Application to the Entscheidungsproblem," answered the question definitively — and in doing so, invented the theoretical computer.

His method was to ask: what does it mean for a process to be "mechanical"? What is the most general description of a procedure that could be carried out by a human following explicit rules, step by step, with no exercise of judgement? He constructed an abstract model — what we now call a Turing machine — that captured this notion precisely. A Turing machine consists of an infinite tape divided into cells, a read/write head that can move along the tape, and a finite set of rules that determine what to do based on what the head reads and what state the machine is in. Nothing more.

This description is almost insultingly simple. The power of the idea is that it is general: any mechanical procedure, however complex, can be simulated by some Turing machine. And then Turing showed something remarkable: there exist problems that no Turing machine can solve. The Entscheidungsproblem is one of them. There is no general algorithm for deciding mathematical truth. Not because we haven't found one — because none can exist.

The proof involved what Turing called the "halting problem": given a Turing machine and an input, will the machine eventually halt, or will it run forever? He proved, using a careful diagonal argument, that no Turing machine can answer this question for all possible inputs. The proof is elegant and surprisingly accessible; it is one of the few great mathematical results that a patient non-specialist can actually follow.

The byproduct of this proof was the concept of the universal Turing machine — a single machine that could simulate any other Turing machine, given a description of that machine as input. This is the theoretical basis for the general-purpose computer: one machine, indefinitely reprogrammable, capable of performing any computation. Von Neumann would later implement this idea in hardware. Turing had already described it, in abstract, at twenty-three.

---

## Bletchley Park

When war broke out in 1939, Turing reported to Bletchley Park, the country house in Buckinghamshire that had been converted into Britain's codebreaking centre. He joined a team of mathematicians, linguists, chess players, and crossword champions assembled under conditions of total secrecy to attack the German Enigma cipher — the machine that encrypted all Wehrmacht military communications.

Enigma was not unbreakable in principle; Polish mathematicians had already made significant progress before the war. But the operational scale of the problem was enormous: the Germans changed their Enigma settings every day at midnight, which meant that whatever keys the codebreakers found were valid for only twenty-four hours. The work had to be done faster than it could be done by hand.

Turing's contribution was twofold. First, he developed a theoretical framework for attacking Enigma messages by exploiting predictable features of the plaintext — the fact that German operators often began messages with formulaic phrases, that weather reports followed standard formats, that certain words appeared with reliable frequency. These "cribs" gave the codebreakers a foothold.

Second, he designed the Bombe — an electromechanical device that automated the process of testing possible Enigma settings against a crib. The Bombe was an extension and improvement of a Polish device called the Bomba, but Turing's version was fundamentally different in its logical design, incorporating a technique that eliminated self-contradictory settings and dramatically reduced the search space. By the end of the war there were over two hundred Bombes operating in Britain, processing intercepted traffic around the clock.

The impact of Ultra — the intelligence derived from broken Enigma traffic — on the war is still debated by historians. Winston Churchill called the Bletchley codebreakers "the geese that laid the golden eggs and never cackled." The official British assessment, declassified decades later, suggested that Ultra shortened the war in Europe by at least two years. Turing was not the only person responsible for this. But he was, by the consensus of his colleagues, the most important single individual at Bletchley. Gordon Welchman, who designed key improvements to the Bombe, wrote later that without Turing the work at Bletchley would have been "much more difficult and would have taken much longer." Others were less measured: Stewart Menzies, the head of MI6, said simply that Turing had won the war.

He received an OBE in 1946. The citation was classified. He could not tell anyone what it was for.

---

## Building the Machine

After the war, Turing turned to what the theoretical work of 1936 had implied but not built: an actual computer. He joined the National Physical Laboratory in London in 1945 and wrote a design proposal for an Automatic Computing Engine — the ACE — that was technically sophisticated and considerably ahead of most contemporary thinking. The NPL's administration was slow, cautious, and resistant to urgency. Turing grew frustrated with the bureaucracy and left in 1948 for Manchester, where Freddie Williams and Tom Kilburn were building what would become the first stored-program computer to run a program.

At Manchester, Turing was appointed deputy director of the computing laboratory and turned his attention to programming the machine — to the question of what you actually did with a computer once you had one. He wrote some of the first programs for the Manchester machine, including a programme to play chess. He also began thinking about a question that his 1936 paper had skirted but not addressed: not just what machines could compute, but what they might be able to do that looked like thinking.

This was the question behind "Computing Machinery and Intelligence," published in the journal Mind in October 1950.

---

## The Imitation Game

The paper opens with a thought experiment. Suppose you are communicating by typewritten messages with two entities in a separate room — one a human, one a machine. Your task is to determine which is which. If the machine can reliably fool you into thinking it is human, does that constitute evidence that the machine is thinking?

Turing did not claim the answer was yes. He claimed that this was a better-defined version of the original question, and that it removed a certain class of prejudice from the discussion — particularly the tendency to assume that thinking must involve a biological substrate, a human body, a particular kind of appearance. The Imitation Game tests behaviour, not architecture.

He then worked through nine objections to the idea that machines could think, with an efficiency and fairness that is remarkable given how predictable most of these objections still seem. The Theological Objection: thinking requires a soul, and God has not given souls to machines. The Mathematical Objection: Gödel's theorems show that there are things machines cannot do. The Argument from Consciousness: a machine cannot feel anything, therefore it cannot truly think. The Lady Lovelace Objection: a machine can only do what it is programmed to do, nothing more.

His answers were not always decisive. On the Lady Lovelace Objection — which he attributed to Ada's 1843 notes — he was thoughtful and careful: he agreed that machines can only do what they are programmed to do, but argued that this did not rule out surprising or apparently creative outputs. A machine can be programmed in ways whose full consequences are not anticipated by its programmer. He had watched the Manchester machine do things that surprised him.

The paper ends with what Turing called the "child machine" hypothesis — the suggestion that rather than trying to build an adult-level thinking machine directly, one might instead build a simple machine with the capacity to learn, and educate it. He was describing, in 1950, the basic research agenda of machine learning. The first practical systems to implement something like this approach would not appear for another thirty years.

---

## The Persecution

In December 1951, Turing's house in Wilmslow was burgled. During the investigation, he told the police that he suspected the burglar was an acquaintance of a man named Arnold Murray, with whom Turing had been having a relationship. The police investigation shifted. In January 1952, Turing was charged with gross indecency under the same law — Section 11 of the Criminal Law Amendment Act 1885 — that had destroyed Oscar Wilde sixty years earlier.

He did not attempt to deny the relationship. He saw no reason to. He appears to have believed, with a certain naivety that his colleagues found heartbreaking in retrospect, that the law was simply wrong and that saying so openly would somehow help. He was convicted in March 1952 and given the choice between imprisonment and probation with hormonal treatment — a course of synthetic oestrogen injections intended to chemically suppress his sexual drive. He chose the latter to avoid prison and continue his work.

The treatment lasted a year. Its effects on him physically and psychologically are documented only partially, through letters and the observations of friends. He continued working — on morphogenesis, the mathematical study of how biological forms develop, which produced a paper that is now recognised as foundational in theoretical biology. He applied for a position at GCHQ, the successor to Bletchley's signals intelligence work, and was refused security clearance.

On 8 June 1954, his housekeeper found him dead in his bedroom. He was forty-one years old. A half-eaten apple lay on his bedside table. The inquest recorded a verdict of suicide by cyanide poisoning. The apple was not tested.

Whether it was suicide is debated. His mother believed it was an accident — he had been conducting chemistry experiments at home and was careless about safety. Some historians find the deliberate staging too neat, the apple too symbolic. The truth is not known and probably cannot be recovered. What is not in doubt is that the British state had spent the previous two years subjecting one of the most important scientists in its history to a regime of chemical castration for the crime of sleeping with another adult man.

---

## The Reckoning

For decades after his death, Turing was almost entirely unknown to the public. His wartime work was classified until the 1970s. His theoretical contributions were known to computer scientists but not the general culture. The injustice done to him was not widely understood.

The rehabilitation was slow and then sudden. A biography by Andrew Hodges, published in 1983, brought his story to a wide audience for the first time. In 2009, Prime Minister Gordon Brown issued a formal apology on behalf of the British government, describing what had been done to Turing as "appalling." In 2013, Queen Elizabeth II granted him a royal pardon — a gesture that struck many observers as inadequate, since a pardon implies wrongdoing, and Turing had done nothing wrong, but which was at least an acknowledgement of the injustice. In 2021, his face appeared on the British fifty-pound note.

The Turing Award — given annually by the Association for Computing Machinery to the person who has made the most important contribution to the field — has been called the Nobel Prize of computing since its establishment in 1966. It bears his name because the field itself, in a meaningful sense, bears his name. The theoretical foundation he laid in 1936 and the conceptual framework he built in 1950 are the twin pillars on which computer science and artificial intelligence rest.

---

## Why He Matters Now

It would be convenient if Turing's legacy were simply the Turing Test — a neat experiment that AI researchers are still trying to pass. The reality is messier and more interesting.

The Turing Test has been "passed," in various limited forms, many times — by chatbots that exploit human credulity rather than demonstrate genuine intelligence. Most serious AI researchers no longer consider passing the Turing Test a meaningful goal. Turing himself said explicitly that he was not proposing it as the definition of intelligence, merely as a useful replacement for a poorly posed question. The test was always a heuristic, not a benchmark.

What endures is something deeper. Turing established that intelligence, whatever it is, must be studied as a computational phenomenon — as a matter of information processing, symbol manipulation, and formal rules. He established that the question of whether machines can think is a scientific question, not a philosophical one to be settled by intuition or theology. And he established, in 1936, that there are limits to what any computational system can do — limits that turn out to be directly relevant to the question of what AI systems cannot, in principle, ever accomplish.

He did all of this before there was a single working computer. He did it in his twenties. He then went on to help build one of the first real computers, helped break the cipher that may have shortened the deadliest war in human history, and wrote the paper that launched artificial intelligence as a field of inquiry — before being destroyed by a government that could not tolerate who he was.

The debt the modern world owes him is not symbolic. It is structural. The device you are reading this on runs, in a direct and traceable line, on ideas he had. The question this website exists to explore — whether machines can be intelligent — is a question he formulated. He did not answer it. He made it possible to ask it properly.

That is enough. It is more than enough. It is almost everything.

---

## Key Works & Further Reading

**Primary sources:**
- "On Computable Numbers, with an Application to the Entscheidungsproblem." *Proceedings of the London Mathematical Society*, Series 2, Vol. 42, 1936.
- "Computing Machinery and Intelligence." *Mind*, Vol. 59, No. 236, October 1950.

**Recommended reading:**
- *Alan Turing: The Enigma* — Andrew Hodges (1983). The definitive biography. Comprehensive, rigorous, and moving.
- *The Imitation Game* — film directed by Morten Tyldum (2014). Dramatically simplified but a useful introduction to the Bletchley period.
- *Turing's Cathedral* — George Dyson (2012). Focuses on the Princeton and Institute for Advanced Study years; essential context for the computer-building period.
- *A Mind at Play* — Jimmy Soni and Rob Goodman (2017). On Claude Shannon, but essential companion reading for understanding the theoretical milieu Turing worked in.
