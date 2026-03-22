---
title: "John McCarthy"
series: "ai-history"
type: "profile"
episode_number: 106
roman: "VI"
part: "part-profiles-a"
part_label: "Profiles: Founders & Theorists"
tag: "Profile"
description: "The man who named artificial intelligence, invented Lisp, and spent fifty years insisting that machines could — and should — be made to reason."
date: 2026-03-12
read_time: 14

---

# John McCarthy
## The Man Who Named the Field

*Born: 4 September 1927, Boston, Massachusetts, USA*
*Died: 24 October 2011, Stanford, California, USA*
*Age at death: 84*

---

In the summer of 1956, a group of mathematicians, engineers, and psychologists gathered at Dartmouth College in Hanover, New Hampshire, for a workshop that had been proposed, organised, and largely funded by a twenty-eight-year-old mathematician named John McCarthy. The workshop lasted six weeks. Its attendance was irregular — people came and went as their schedules permitted — and it produced no unified theory, no landmark paper, no agreed programme of research. By most of the ordinary measures of academic conferences, it was not a great success.

What it did produce was a name.

McCarthy had chosen the phrase "artificial intelligence" for the workshop proposal, deliberately, over the objections of colleagues who preferred "complex information processing" or "automata studies" or simply "machine intelligence." He wanted a name that was clean, ambitious, and — crucially — separate from the cybernetics tradition that Norbert Wiener had established. He thought cybernetics was too focused on analogue systems and feedback control, too biological in its metaphors, too Wiener-centric in its sociology. What he had in mind was something different: machines that reasoned, that used logic, that could represent knowledge and draw inferences from it.

The name stuck. The field it named has, in the seven decades since, expanded far beyond what McCarthy envisioned, incorporated ideas he rejected, and repeatedly confounded his predictions about how progress would be made. He lived to see neural networks — which he consistently underestimated — become the dominant paradigm in the field he had founded. He was not entirely gracious about it.

But none of that diminishes what he built. McCarthy invented the programming language Lisp, which dominated AI research for thirty years and introduced concepts — garbage collection, dynamic typing, higher-order functions, symbolic computation — that permeate modern programming. He invented the concept of time-sharing, the system that allows multiple users to share a single computer, which was the practical foundation for interactive computing and, eventually, the internet. He developed the framework of formal logic as a basis for AI that, though it did not produce human-level intelligence, generated decades of productive research and tools that are still used. And he thought, with unusual seriousness and unusual early attention, about the ethics of artificial intelligence — about what it would mean for machines to have rights, about what obligations powerful AI systems would create.

He was difficult, argumentative, and frequently wrong about the things he was most certain about. He was also one of the most important figures in the history of computing, and the field he named would not exist in its current form without him.

---

## Boston and Caltech

McCarthy was born in Boston in 1927, the son of John Patrick McCarthy, an Irish immigrant labour organiser, and Ida Glatt, a Lithuanian Jewish activist. The family was politically radical — Communist Party members during the Depression — and moved frequently, following work and the requirements of political organising. They ended up in Los Angeles, where McCarthy grew up.

He was the kind of child who reads mathematics textbooks for pleasure. He found a collection of Caltech course notes at a library sale, worked through them independently, and arrived at Caltech — where he was admitted at seventeen — having already taught himself the first two years of the mathematics curriculum. His undergraduate career was, by his own account, somewhat desultory; he was asked to repeat his sophomore year after neglecting courses that did not interest him. He stayed, graduated, and went to Princeton for graduate work in mathematics.

At Princeton he encountered von Neumann, attended his lectures, and became absorbed in the question that von Neumann's automata theory raised: could a machine be made to think? He also met Marvin Minsky, a graduate student in mathematics who shared his obsession and who would become his closest collaborator, most productive rival, and, eventually, an intellectual antagonist. Their relationship — warm, competitive, occasionally bitter — runs through the first three decades of AI history like a continuous thread.

McCarthy completed his PhD in mathematics in 1951, with a thesis on operator theory that he found unremarkable and never published. What he cared about was not operator theory. What he cared about was machine intelligence, and for that there was, in 1951, no department, no journal, no conference, no established vocabulary. There was barely a field. He decided to create one.

---

## Dartmouth

The proposal McCarthy wrote for the Dartmouth workshop in 1955 — co-signed by Minsky, Claude Shannon, and Nathaniel Rochester of IBM — is one of the founding documents of computer science. Its opening sentence is worth quoting in full:

"We propose that a 2 month, 10 man study of artificial intelligence be carried out during the summer of 1956 at Dartmouth College in Hanover, New Hampshire."

The proposal goes on to assert, with a confidence that reads differently in retrospect, that "every aspect of learning or every other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it." This was the founding assumption of classical AI: that intelligence was, at bottom, a matter of computation, and that computation could be made to produce it.

The workshop itself was attended, at various points, by McCarthy, Minsky, Shannon, Rochester, Allen Newell, Herbert Simon, Arthur Samuel, and others who would define the next two decades of AI research. Newell and Simon arrived with a working program — the Logic Theorist, which could prove theorems in propositional logic — and dominated the intellectual atmosphere of the meeting. McCarthy found their approach too narrow. The disagreement about what AI should be trying to do — prove theorems or simulate intelligent behaviour more broadly — would persist for decades.

What the workshop achieved was not consensus but community. For the first time, the people working on machine intelligence knew each other, had a shared vocabulary, and had a name for what they were doing. McCarthy had provided that name. It was, in retrospect, an enormous gift.

---

## Lisp

In 1958, McCarthy invented Lisp. He was trying to implement a system for symbolic computation — for writing programs that manipulated symbols and expressions rather than numbers — and found that no existing programming language was suitable. Fortran was designed for numerical calculation. Assembly language was too low-level. He needed something that could represent and manipulate the kind of tree-structured symbolic expressions that logical reasoning required.

What he designed, in a series of papers and memos at MIT, was a language based on the lambda calculus — the mathematical formalism for expressing computation as function application, developed by Alonzo Church in the 1930s. The fundamental data structure of Lisp is the list (the name is a contraction of "List Processing"). Programs in Lisp are represented as lists — which means that programs can manipulate other programs as data, that code and data have the same structure, and that writing programs that generate or modify programs is natural rather than difficult.

This property — homoiconicity, in the technical term — made Lisp uniquely suited to AI research. A program that reasoned about logical expressions, or that generated natural language, or that manipulated plans and goals, could treat those expressions, sentences, and plans as data to be processed, modified, and created. The distinction between the program and what the program was reasoning about dissolved.

Lisp also introduced, either directly or through early implementations, a cluster of programming concepts that were genuinely new and that took decades to fully permeate the broader programming world: automatic memory management (garbage collection), dynamic typing, first-class functions, closures, and the read-eval-print loop that makes interactive programming possible. Languages that owe a direct debt to Lisp include Python, Ruby, JavaScript, Haskell, and Clojure. The influence is so pervasive that it has become invisible.

McCarthy did not invent Lisp as a commercial product or as a practical tool for everyday programming. He invented it because he needed it for a specific research purpose. The practical implementation was largely done by his students, particularly Steve Russell, who wrote the first Lisp interpreter by realising — against McCarthy's initial expectation — that the eval function described in McCarthy's theoretical paper could be directly implemented on a computer. McCarthy's reaction to this, by his own later account, was genuine surprise. He had not expected his theoretical construction to be directly executable.

---

## Time-Sharing

In 1959, McCarthy wrote a memo proposing that MIT's IBM 704 computer be converted to a time-sharing system — a system that would allow multiple users to interact with the computer simultaneously, each receiving the impression of having the machine to themselves. This was a radical proposal. Computers in 1959 operated in batch mode: you submitted a job, it ran when its turn came, you collected the output hours later. Interactive computing did not exist.

McCarthy's argument was simple and powerful. Batch computing was enormously wasteful of human time: researchers spent hours waiting for results rather than thinking. An interactive system would allow immediate feedback, faster iteration, and a qualitatively different kind of work. The computer would become a tool for thought rather than a machine for batch calculation.

The proposal was not immediately implemented at MIT, but it launched a movement. Fernando Corbató at MIT built the Compatible Time-Sharing System in 1961, the first practical time-sharing system. Project MAC, the MIT research programme that grew from these ideas, became one of the most productive research environments in computing history. Time-sharing was the practical prerequisite for everything that followed: interactive terminals, personal computing, the internet, the web. McCarthy had identified the need and articulated the vision.

He never received adequate credit for this contribution, partly because his memo was informal and unpublished, and partly because the practical implementation was done by others. This was a pattern in his career: he had ideas of extraordinary importance, described them clearly in memos and informal papers, and watched others implement them and receive the recognition.

---

## Formal Logic and the Situation Calculus

McCarthy's most sustained technical contribution to AI was the development of formal logic as a basis for knowledge representation and reasoning. The project occupied him, in various forms, from the early 1960s until the end of his career.

The fundamental idea was that intelligent behaviour required the ability to represent facts about the world, reason about them using formal inference rules, and act on the conclusions. This is not an unreasonable hypothesis about human cognition; it is, in fact, a reasonable description of how humans approach many kinds of deliberate reasoning. McCarthy wanted to formalise it precisely enough that machines could do it.

With Patrick Hayes, he developed the situation calculus — a formal language for representing actions and their effects on the world. A situation is a snapshot of the world at a moment in time. An action transitions one situation to another. The effects of actions can be stated as axioms. Given a description of the initial situation and the available actions, a reasoning system can plan — can work out what sequence of actions will lead to a desired goal.

The situation calculus is still used in AI planning research. It also, inevitably, ran into the frame problem — the question of how to represent what does not change when an action is performed. If I pick up a cup, the cup moves. Does my coffee table still exist? Yes, obviously. But how does a formal reasoning system know that? Every action changes some things and leaves others unchanged, and specifying what is unchanged — the frame axioms — turns out to require an enormous amount of information that humans simply assume without thinking.

The frame problem is not merely a technical nuisance. It points to something deep about the difference between human cognition and formal reasoning: humans bring to every situation a vast amount of implicit background knowledge that they have never needed to make explicit, because they have never needed to specify it for a machine. McCarthy and his colleagues spent years working on approaches to this problem. It was never fully solved within the classical AI paradigm.

---

## The Disagreements

McCarthy disagreed with most of his major colleagues about most of the important questions in AI, and he was not diplomatic about it.

He disagreed with Minsky about the relative importance of logic versus more flexible, heuristic approaches to AI. Minsky became increasingly interested in the messy, exception-laden, case-based character of human cognition; McCarthy remained committed to the view that formal reasoning was the right foundation. Their intellectual relationship, which had been close and productive in the 1950s, grew distant and occasionally hostile.

He disagreed with the neural network researchers — Rosenblatt, Rumelhart, Hinton, LeCun — about whether connectionist approaches could lead to genuine intelligence. He believed they could not, that a system that learned statistical patterns from data without explicit symbolic representation was not, in any meaningful sense, reasoning. He held this view with considerable conviction and expressed it in print and in conversation throughout his career. In the final years of his life, as deep learning produced increasingly impressive results, he acknowledged the progress while maintaining his scepticism about whether it constituted what he had meant by intelligence.

He also disagreed with the AI safety researchers who, from the 1990s onward, began arguing that advanced AI systems posed existential risks. McCarthy thought the risks were real but manageable, that the focus on catastrophic scenarios was premature, and that the appropriate response was careful engineering rather than alarm. He was not dismissive of the concerns — he had thought about AI ethics since the 1970s — but he found the existential risk framing overwrought.

These disagreements were not failures of character. They were the natural consequence of a man who had strong views and was willing to defend them. McCarthy was, in the description of colleagues who knew him well, someone who had thought carefully about what he believed and who expected the same rigour from everyone else. He was not always right. He was rarely vague.

---

## The Ethics, Early

One of the least-known aspects of McCarthy's work is how early and how seriously he engaged with questions about the ethics of AI. In 1979 he published a paper titled "Ascribing Mental Qualities to Machines" that argued, carefully, that it was appropriate to attribute beliefs, intentions, and desires to machines when doing so was useful for predicting and explaining their behaviour. This was a philosophical position with practical implications: if machines could have mental states in the relevant functional sense, questions about their interests and their treatment arose naturally.

He also wrote, from the 1990s onward, about the long-term future of AI — about the possibility of machines with human-level and superhuman intelligence, about what obligations such machines would have and what rights they might deserve. His conclusions were characteristically his own: he thought powerful AI was achievable and desirable, that the risks were manageable, that the benefits would be enormous, and that the most important thing was to get the reasoning right rather than to raise alarms prematurely.

He cared about these questions not as thought experiments but as genuine practical problems that the field he had founded would eventually have to address. That he disagreed with the answers that many of his successors proposed does not diminish the seriousness with which he engaged the questions.

---

## The End

McCarthy spent most of his career at Stanford, where he founded the Stanford Artificial Intelligence Laboratory in 1962 and ran it for two decades. He was a notoriously demanding supervisor who expected his students to think at the level he thought, which was very high, and who was sometimes better at identifying weaknesses in ideas than at encouraging the people who had them. Several of the best AI researchers of the following generation passed through his laboratory; several of them have described the experience as formative and difficult in equal measure.

He retired from Stanford in 2000 and continued working — writing, arguing, attending conferences, maintaining a website with his views on AI and a great many other subjects — until near the end of his life. He died in October 2011, at eighty-four, having lived to see the field he named become one of the most consequential and well-funded areas of human endeavour.

He did not live to see deep learning's most dramatic achievements — the large language models, the image generators, the systems that would pass, by most practical measures, the Turing Test he had once dismissed as too behavioural a criterion. Whether he would have been pleased, or sceptical, or both, is impossible to know. He would, at minimum, have had a precise and well-argued opinion.

---

## Why He Matters Now

McCarthy's specific technical contributions — the situation calculus, the frame problem formulation, the logic-based approach to reasoning — are not at the centre of current AI research. The paradigm that dominates today is statistical and connectionist, not logical and symbolic. The systems that currently command attention learn patterns from data rather than reasoning from explicit representations. McCarthy would not have predicted this, and did not welcome it.

But the name he chose — artificial intelligence — matters enormously. It carried the commitment that what was being attempted was genuine, not simulation; that the goal was not to mimic intelligent behaviour but to instantiate it; that the benchmark was not a narrow task but the full range of human cognitive ability. This ambition, embedded in the name, has shaped how the field has been funded, how it has been evaluated, and how it has been feared and celebrated. McCarthy made a naming choice in 1955 that committed his field to the most audacious possible version of its own project.

Lisp matters. Time-sharing matters. The formal treatment of knowledge representation matters. But perhaps the most consequential thing McCarthy did was to insist, at the beginning, that the goal was real intelligence and not its imitation. Whether that goal is achievable, whether current systems are approaching it or merely appearing to, whether the word "intelligence" even applies to what machines now do — these are still live questions. McCarthy put them on the table. He kept them there for fifty years. The field he named is still trying to answer them.

---

## Key Works & Further Reading

**Primary sources:**
- "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence." McCarthy, Minsky, Rochester, Shannon, 1955.
- "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." *Communications of the ACM*, Vol. 3, No. 4, April 1960. The Lisp paper.
- "Some Philosophical Problems from the Standpoint of Artificial Intelligence." McCarthy and Hayes, in *Machine Intelligence 4*, 1969. Introduces the situation calculus and the frame problem.
- "Ascribing Mental Qualities to Machines." In *Philosophical Perspectives in Artificial Intelligence*, 1979.

**Recommended reading:**
- *Machines Who Think* — Pamela McCorduck (1979). The first serious popular history of AI, written with access to the founders. McCarthy features extensively.
- *The Dream Machine* — M. Mitchell Waldrop (2001). Focuses on Licklider but essential for understanding the MIT computing environment McCarthy helped create.
- *Artificial Intelligence: A Modern Approach* — Russell and Norvig (1995, multiple subsequent editions). The standard AI textbook, whose logic-based chapters are the direct descendant of McCarthy's research programme.
- *Hackers: Heroes of the Computer Revolution* — Steven Levy (1984). For the cultural context of MIT and Stanford in the era McCarthy dominated.
