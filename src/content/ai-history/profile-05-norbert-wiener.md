---
title: "Norbert Wiener"
series: "ai-history"
type: "profile"
episode_number: 105
roman: "V"
part: "part-profiles-a"
part_label: "Profiles: Founders & Theorists"
tag: "Profile"
description: "The originator of cybernetics, whose ideas about feedback, control, and communication in machines and animals laid the groundwork for AI and robotics alike."
date: 2026-03-12
read_time: 14

---

# Norbert Wiener
## The Man Who Connected Minds and Machines

*Born: 26 November 1894, Columbia, Missouri, USA*
*Died: 18 March 1964, Stockholm, Sweden*
*Age at death: 69*

---

In 1948, two books appeared that would define the intellectual landscape of the second half of the twentieth century. One was Claude Shannon's "A Mathematical Theory of Communication." The other was Norbert Wiener's *Cybernetics: Or Control and Communication in the Animal and the Machine*.

Shannon's book was a technical paper of extraordinary precision. Wiener's was something stranger and more ambitious: a work of science that was also a work of philosophy, that ranged across mathematics, neuroscience, engineering, and social theory, and that proposed nothing less than a unified science of communication and control applicable to every system — mechanical, biological, social — that processed information and responded to its environment.

The word Wiener coined for this new science was cybernetics, from the Greek *kybernetes*, meaning steersman or governor. The choice was deliberate. A governor — in the mechanical sense, the device on a steam engine that regulates its own speed by feeding its output back into its input — was, for Wiener, the paradigmatic example of the phenomenon he was trying to study. Feedback. The loop that connects a system's output back to its input, allowing it to regulate itself, correct errors, pursue goals, and adapt to disturbance.

Feedback is everywhere, once you see it. A thermostat. The pupil of an eye. The immune system. The economy. The human brain. Wiener saw it everywhere and believed, with genuine conviction, that understanding it mathematically was the key to understanding intelligence itself. He was not entirely right. But he was right in ways that took decades to appreciate fully, and the science he founded — even now, even after being largely absorbed into other fields — shaped every serious attempt to understand how minds work and how machines might be made to think.

---

## The Prodigy

Norbert Wiener was born in Columbia, Missouri, in 1894, the son of Leo Wiener, a Harvard professor of Slavic languages, and Bertha Kahn. Leo Wiener was a formidable, domineering man who had educated himself from poverty to a Harvard professorship and who was determined that his son would be a prodigy. He began Norbert's formal education at home at an early age, pushing him hard through mathematics, languages, and natural science.

The experiment worked, in the narrow sense. Wiener entered Tufts University at eleven, graduated at fourteen, and received his PhD in mathematical logic from Harvard at eighteen. He was, by any measure, a prodigy. He was also, by his own account and the accounts of those who knew him, a deeply insecure, socially awkward, and emotionally volatile man for most of his life — qualities that his father's pressure had produced alongside the intellectual gifts.

He studied under Bertrand Russell at Cambridge and under David Hilbert in Göttingen, absorbing the foundations of mathematical logic and the German mathematical tradition. He spent time at MIT, which would become his permanent home, and worked briefly in various capacities — a journalist, a factory hand, an engineer at General Electric — before settling into academic mathematics in his mid-twenties.

His early mathematical work was on Brownian motion — the random movement of particles suspended in a fluid, first described by Robert Brown in 1827 and given a mathematical foundation by Einstein in 1905. Wiener developed a rigorous mathematical description of Brownian motion as a random process, creating what is now called the Wiener process — the foundation of modern stochastic calculus and, at several removes, the mathematical basis for financial derivatives, signal processing, and statistical physics.

This work established him as a serious mathematician. It also gave him something more important: a deep familiarity with random processes, with noise, with the mathematics of signals embedded in uncertainty. When he turned his attention to communication engineering during the war, this background proved decisive.

---

## The War and the Gunner

Wiener's path to cybernetics ran through antiaircraft artillery. During the Second World War, the problem of shooting down fast-moving aircraft had become urgent and technically difficult. Aircraft flew faster than gunners could manually track; by the time a shell arrived at the point the gunner had aimed at, the aircraft had moved. The solution required predicting where the aircraft would be several seconds in the future, not where it was now.

Wiener was asked to work on this problem, which he approached from the perspective of a mathematician rather than an engineer. His analysis began by treating the aircraft's future position as a signal to be predicted from its past positions — a problem in statistical time series analysis, directly related to his earlier work on stochastic processes. He developed what is now called the Wiener filter: a method for extracting a signal from noise that is mathematically optimal given assumptions about the statistical structure of both.

But the deeper insight came from thinking about the gunner as part of the system. The gunner observes the aircraft, aims the gun, fires, observes the result, adjusts. The aircraft pilot observes the tracers, manoeuvres, changes course. The system is not a simple chain from observation to action; it is a loop. The output — the position of the shell — feeds back into the input — the gunner's next aim. And the aircraft is doing the same thing from the other side.

Wiener realised that this feedback structure was not peculiar to antiaircraft systems. It was the same structure as voluntary movement in animals. When you reach for a cup, your nervous system observes the position of your hand, compares it to the desired position, and generates a corrective signal — continuously, in a loop, until the error is zero. The neurophysiologist Arturo Rosenblueth, who became Wiener's closest collaborator, pointed out that patients with a particular kind of cerebellar damage — intention tremor — showed exactly the failure mode you would predict from a feedback control system with too much gain: oscillation around the target rather than smooth approach.

This was the founding insight of cybernetics. The same mathematical structure — feedback, error correction, goal-directedness — described both the antiaircraft system and the reaching movement. And if the same structure described both, then the mathematics of control engineering could be applied to neuroscience, and the concepts of neuroscience could illuminate the design of machines. The boundary between the mechanical and the biological was, at this level of abstraction, not fundamental.

---

## Cybernetics

The book that Wiener published in 1948 to present these ideas is an unusual document. It is mathematically sophisticated in places — it assumes familiarity with Fourier analysis and probability theory — and entirely accessible in others, full of historical asides, philosophical reflections, and what would now be called popular science writing. It is also somewhat disorganised, driven by association rather than strict argument, and occasionally repetitive.

None of this diminished its impact. *Cybernetics* was read by mathematicians, engineers, neurophysiologists, psychiatrists, sociologists, anthropologists, and philosophers. It generated a series of interdisciplinary conferences — the Macy Conferences, held between 1946 and 1953 — that brought together some of the most interesting minds of the era to think about feedback, communication, and control. Attendees included Shannon, von Neumann, the psychologist Kurt Lewin, the anthropologist Margaret Mead, and the neurophysiologist Warren McCulloch — who had, with Walter Pitts, already published a paper on neural networks that Wiener had influenced and that would influence everything that followed.

The Macy Conferences are one of the most remarkable intellectual gatherings of the twentieth century. They were interdisciplinary in a way that academic conferences rarely are — genuinely so, not ceremonially. The participants disagreed vigorously, misunderstood each other productively, and generated ideas that none of them would have produced alone. The concept of feedback became, over the course of these meetings, a lens through which every discipline at the table was re-examined.

The core ideas of cybernetics can be stated simply. Every purposive system — every system that pursues a goal — requires information about the difference between its current state and its desired state, and a mechanism for using that information to reduce the difference. This is feedback. The amount of information in a system is a measure of its degree of organisation; entropy measures disorganisation, and purposive behaviour is the continuous local reduction of entropy at the cost of increasing it elsewhere. Communication — the transmission of information — is the fundamental process that makes co-ordinated behaviour possible, in machines, in animals, and in societies.

These ideas look obvious now, partly because they have been thoroughly absorbed into the intellectual furniture of every technical field. They were not obvious in 1948. The concept of information as a measurable quantity had just been established by Shannon. The idea that the same mathematical framework applied to nervous systems and servomechanisms was genuinely novel. The proposal that feedback was the key to purposive behaviour — that goal-directedness did not require anything beyond the right kind of causal loop — was philosophically radical.

---

## The Human Use of Human Beings

Wiener was not content to write for scientists. In 1950 he published *The Human Use of Human Beings*, a popular exposition of cybernetics aimed at a general audience. It is a better book than *Cybernetics* in many respects — clearer, better organised, more humane — and it addresses questions that the technical book had largely avoided.

The central concern of the popular book is the social implications of automation. Wiener had thought carefully, from the early days of his work on feedback systems, about what it would mean for machines to take over the functions that humans currently performed. His conclusions were not optimistic.

He argued that the automatic factory — the fully automated industrial plant that was already visible on the horizon in 1950 — would displace industrial workers on a massive scale, and that the social disruption this caused would dwarf the disruption of the first Industrial Revolution. The first revolution had replaced muscle; the second would replace routine cognitive work. The workers displaced would not simply move to new jobs, as economic optimists predicted, because the new jobs would increasingly be the kind that machines could also do.

He also worried about something subtler: the danger of building systems whose goals were specified incorrectly or incompletely. He told the story of the monkey's paw — the horror story in which wishes are granted literally and catastrophically — as a parable for the problem of building powerful systems that do exactly what you tell them rather than what you want. He was describing, in 1950, what AI researchers now call the alignment problem: the difficulty of specifying human values precisely enough that an optimising system will pursue them without producing outcomes we find horrifying.

He was also, in *The Human Use of Human Beings*, a consistent and explicit advocate for labour rights and for the democratisation of technology. He corresponded with union leaders. He refused to consult for defence contractors on work he considered ethically problematic. He was publicly critical of the arms race at a time when such criticism was professionally costly. These commitments were not peripheral to his science; they were part of it. A science of control and communication that did not ask who was doing the controlling and communicating — and to what end — was, for Wiener, not taking its own ideas seriously.

---

## The Neural Network Precursor

Among the papers that Wiener influenced and that influenced the subsequent history of AI, the most important is the 1943 paper by Warren McCulloch and Walter Pitts, "A Logical Calculus of the Ideas Immanent in Nervous Activity." McCulloch was a neurophysiologist and psychiatrist; Pitts was a mathematical prodigy who had, at twelve, read Russell and Whitehead's *Principia Mathematica* and written a letter to Russell pointing out errors.

Their paper proposed a model of the neuron as a threshold logic unit — a device that fires if the sum of its inputs exceeds a threshold, and does not fire otherwise. They showed that networks of such units could compute any logical function — that a sufficiently large and appropriately connected network of artificial neurons was, in the formal sense, computationally universal.

This is the ancestor of every neural network ever built. The perceptron, the multilayer network, the deep learning model — all descend from the McCulloch-Pitts neuron, which descended from the intellectual environment that Wiener and the Macy Conferences had created. The connection is direct and traceable.

Wiener brought Pitts to MIT, where he worked as a researcher. The collaboration between Wiener, McCulloch, Pitts, and others in the cybernetics circle was the most productive period in Pitts' short and troubled life. He died in 1969, at forty-six, having published very little after his early work, consumed by depression and alcohol. His story is one of the sadder ones in the history of science, and Wiener's attempts to support him — imperfect, but genuine — are among the more human episodes in an intellectual history that is often told without people in it.

---

## The Falling Out

The cybernetics circle did not hold together. The Macy Conferences ended in 1953. The interdisciplinary synthesis that Wiener had envisioned gradually fragmented, each discipline absorbing what it needed and moving on.

The split with John von Neumann — the other giant of the early computing era — was significant. They had collaborated and corresponded extensively, and their relationship had been one of mutual respect if not warmth. But their visions for what computing was for diverged. Von Neumann was primarily interested in computation as a tool for solving specific, large-scale numerical problems — physics simulations, weapons calculations. Wiener was interested in the analogy between computing machines and biological systems, in the implications for understanding intelligence, in the social consequences of automation. These were not incompatible interests, but they pulled in different directions.

The most damaging rupture in the cybernetics community came not from intellectual disagreement but from personal conflict. Wiener became convinced, on the basis of what appears to have been a misunderstanding, that certain colleagues had deliberately undermined his work and excluded him from projects. He responded with a sweeping withdrawal from collaboration. The exact details of the dispute are murky and contested. What is clear is that by the mid-1950s, the cybernetics circle that had been so productive had largely dissolved, and Wiener was more isolated than he had been.

He continued working and writing. He published a memoir, *Ex-Prodigy*, in 1953 — a remarkably candid account of his childhood and his complicated relationship with his father. He published *God and Golem, Inc.* in 1964, returning to the themes of *The Human Use of Human Beings* with added urgency, worrying more explicitly about the possibility of machines that could learn, reproduce, and potentially exceed human control.

He died in Stockholm in March 1964, while attending a mathematics conference, of a heart attack. He was sixty-nine.

---

## The Rehabilitation

The word "cybernetics" largely disappeared from American and British scientific discourse by the 1970s, absorbed into control theory, systems theory, cognitive science, and computer science without being credited. The ideas survived; the name did not.

In Europe, particularly in France and Germany, cybernetics had a longer and more explicit life in the social sciences and in philosophy. In the Soviet Union, cybernetics was initially denounced as "bourgeois pseudoscience" — then, when its military applications became apparent, rapidly adopted as a state priority, with all the institutional energy the Soviet system could bring to bear.

The rehabilitation of Wiener's specific contributions began as the history of AI and cognitive science was written more carefully. The McCulloch-Pitts paper was recognised as foundational to neural network research. The Macy Conferences were identified as the crucible in which the conceptual vocabulary of information processing was formed. The alignment concerns in *The Human Use of Human Beings* were recognised, especially after the mid-2010s, as anticipating precisely the problems that AI safety researchers were beginning to formalise.

The word cybernetics returned, first in science fiction — William Gibson's "cyberspace" derives from it — and then in the compound "cybersecurity," now ubiquitous. Wiener would likely have found this ironic. He had intended the word to describe a science of purposive control. It has become primarily associated with threat.

---

## Why He Matters Now

Wiener was not always right. His mathematical neuroscience was more suggestive than rigorous; the analogy between feedback control and biological cognition, while fruitful, has limits that he did not always acknowledge. His social predictions were sometimes too apocalyptic too soon; the displacement of industrial workers by automation took longer, and followed different paths, than he anticipated.

But he was right about the things that matter most. He was right that feedback was a fundamental concept that cut across the boundary between the mechanical and the biological. He was right that information was a measurable physical quantity with thermodynamic significance. He was right that building powerful optimising systems without adequate specification of their goals was dangerous. He was right — decades before anyone was taking it seriously — that the social consequences of automation required urgent and sustained attention.

The field that now calls itself AI safety is working, in large part, on the problems Wiener identified in 1950. The recognition that an intelligent system pursuing a poorly specified goal can cause catastrophic harm — the alignment problem — is Wiener's insight, formalised and extended. The concern that automation will displace human labour faster than new employment can be created is Wiener's concern, still unresolved.

He was the first person to think seriously and publicly about what it would mean to build machines that could regulate themselves, pursue goals, and learn. He did not build those machines. But he described, with considerable accuracy, the world that building them would create — and the questions we would need to answer before we could inhabit that world safely.

We are still working on the answers.

---

## Key Works & Further Reading

**Primary sources:**
- *Cybernetics: Or Control and Communication in the Animal and the Machine* — Norbert Wiener (1948). Second edition, 1961, includes two additional chapters.
- *The Human Use of Human Beings: Cybernetics and Society* — Norbert Wiener (1950). Revised edition, 1954.
- *God and Golem, Inc.: A Comment on Certain Points where Cybernetics Impinges on Religion* — Norbert Wiener (1964).
- *Ex-Prodigy: My Childhood and Youth* — Norbert Wiener (1953).

**Recommended reading:**
- *Dark Hero of the Information Age: In Search of Norbert Wiener, the Father of Cybernetics* — Flo Conway and Jim Siegelman (2005). The most thorough biography. Occasionally overwrought but essential.
- *How We Became Posthuman* — N. Katherine Hayles (1999). The most rigorous scholarly account of the Macy Conferences and their intellectual legacy.
- *The Dream Machine* — M. Mitchell Waldrop (2001). Focuses on J.C.R. Licklider but provides essential context for the cybernetics-to-computing transition.
- "A Logical Calculus of the Ideas Immanent in Nervous Activity" — Warren McCulloch and Walter Pitts, *Bulletin of Mathematical Biophysics*, 1943. The paper Wiener's circle produced that launched neural network research.
