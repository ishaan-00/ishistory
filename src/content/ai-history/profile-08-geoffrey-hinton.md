---
title: Geoffrey Hinton
series: ai-history
type: profile
episode_number: 108
roman: VIII
part: part-profiles-b
part_label: 'Profiles: Deep Learning Revolution'
tag: Profile
description: The Godfather of Deep Learning — decades of perseverance on neural networks, the ImageNet breakthrough, and his dramatic departure from Google.
date: 2026-03-12
read_time: 13

---

# Geoffrey Hinton

## The Godfather of Deep Learning

_Born: 6 December 1947, Wimbledon, London, England_

***

Geoffrey Hinton once spent a year as a carpenter's apprentice. He had just finished his undergraduate degree at Cambridge, was not sure what to do next, and needed time to think. He was already convinced that the brain was a learning machine and that understanding it required understanding how networks of simple units could, through experience, come to represent complex structure. He did not yet know how to pursue this mathematically. So he built things with wood for a year, and then went back to academia.

It is a small biographical detail, but it is characteristic. Hinton has always been willing to pursue unpopular ideas patiently, to work in domains that the mainstream considered either solved or hopeless, and to wait — sometimes for decades — for the moment when the pieces came together. The idea he committed to in the early 1970s was that intelligence, biological and artificial, was fundamentally a matter of learning distributed representations in networks of connected units. This was not a popular idea. For most of the period between 1969 and 2006, neural networks were considered either a distraction from serious AI research or a dead end that had already been formally closed off. Hinton kept working on them anyway.

The vindication, when it came, was total. The deep learning revolution that transformed AI from roughly 2012 onward was built directly on ideas Hinton had developed, defended, and refined across four decades of unfashionable research. The image recognition systems, the speech recognition engines, the language models — all of them rest on foundations he helped lay. He shared the Turing Award in 2018. He shared the Nobel Prize in Physics in 2024. He is, by any measure, one of the most consequential scientists of the late twentieth and early twenty-first centuries.

He is also, since May 2023, the most prominent scientist to have publicly resigned from a major AI company in order to warn the world about what that company — and every other company like it — is building.

***

## Ancestry and Education

Hinton was born in London in December 1947 and grew up in a family with an unusual intellectual lineage. He is the great-great-grandson of George Boole, the mathematician who developed Boolean algebra — the binary logic on which every digital computer ultimately operates. His father was a distinguished entomologist; his siblings all pursued scholarly careers. The expectation of serious intellectual work was ambient.

He was educated at Clifton College in Bristol, then entered King's College, Cambridge in 1967. He was, by his own account, indecisive as an undergraduate. He switched between natural sciences, history of art, and philosophy before settling, finally, on experimental psychology. The choice was not arbitrary. He was interested in how the mind worked — not as a philosophical abstraction but as a physical system, a biological mechanism that somehow produced thought and perception from the activity of neurons. Psychology, he reasoned, was the discipline that took this question seriously.

He graduated in 1970 and spent the year as a carpenter's apprentice. Then he enrolled at the University of Edinburgh, where he worked toward a PhD in artificial intelligence. His supervisor, Christopher Longuet-Higgins, was a distinguished computational neuroscientist who had by then shifted toward symbolic AI — formal, logical approaches to representing knowledge and reasoning. Hinton was already committed to the opposite camp. He believed the symbolic approach was wrong in a deep way: that human knowledge was not stored as explicit symbols and logical rules but as patterns of activation distributed across large numbers of simple processing units. He believed this because it was what the biology suggested, and he had been trained to take biology seriously.

The tension between Hinton and his supervisor was productive. He completed his PhD in 1978, already convinced of the research programme he would spend the next four decades pursuing.

***

## The Neural Network Winters

The landscape Hinton entered as a researcher in the late 1970s was inhospitable to his convictions. Minsky and Papert's Perceptrons, published in 1969, had demonstrated that single-layer neural networks could not compute non-linear functions and had been widely, if incorrectly, interpreted as showing that neural networks in general were inadequate for intelligent behaviour. Funding for neural network research had dried up. The mainstream of AI was symbolic — logic, formal knowledge representation, expert systems. Neural networks were associated with inflated claims and demonstrated limitations.

Hinton did not find this discouraging. He found the mainstream unconvincing. The brain, he kept noting, was not a symbolic processor. It did not store knowledge as logical rules and apply them by formal inference. It was a network of neurons that learned from experience, and its representations were distributed — knowledge was encoded not in any single neuron but in patterns of activity across many neurons simultaneously. If you wanted to build something that worked like intelligence, you had to understand how such networks learned.

After his PhD he worked briefly at the University of Sussex and then the University of California San Diego, where he collaborated with David Rumelhart, a psychologist who shared his conviction that connectionist models — models based on networks of simple learning units — were the right framework for cognitive science. Together with Ronald Williams, they developed and published, in 1986, the paper that would define Hinton's early reputation: a demonstration that multi-layer neural networks could be trained using backpropagation.

Backpropagation was not new. The mathematical principle — propagating error signals backward through a network to adjust weights — had been worked out by others before, notably Paul Werbos in his 1974 PhD thesis. What Rumelhart, Hinton, and Williams did was demonstrate, clearly and with compelling experiments, that the algorithm worked in practice for training networks to learn interesting representations. They showed that networks trained this way developed internal representations that had structure — that the hidden units came to represent features of the input that were neither explicitly programmed nor obvious from the training examples alone. The network was, in a meaningful sense, learning to see.

The paper was enormously influential. It revived interest in neural network research and gave the field a practical training procedure it had lacked. But it did not end the winter. The networks that could be trained in the 1980s were small. Computing was slow. Data was scarce. Neural networks could learn interesting things in laboratory demonstrations but could not match the performance of rule-based systems on the practical tasks that AI researchers were actually trying to solve. The period of renewed interest in the late 1980s was followed by another contraction in the early 1990s. Expert systems attracted the money. Neural networks remained a marginal pursuit.

Hinton kept working.

***

## Carnegie Mellon, Toronto, and the Long Persistence

In 1982, Hinton joined the faculty at Carnegie Mellon University. He left in 1987 — partly, as he has described it, because he was uncomfortable with the degree to which American AI research was funded by the Department of Defense. He moved to the University of Toronto, where he would eventually spend the longest productive period of his career.

The years from 1987 to 2006 were years of continued work in the unfashionable margins. Hinton developed Boltzmann machines — stochastic neural networks that could learn to represent probability distributions over their inputs — with David Ackley and Terry Sejnowski in 1985, before his move to Toronto. He worked on distributed representations, time-delay neural networks, mixtures of experts, Helmholtz machines, and a range of other ideas, many of which fed into the eventual deep learning breakthrough even if they did not individually cause it. He spent 1998 to 2001 at University College London, founding the Gatsby Computational Neuroscience Unit, before returning to Toronto.

In 1998 he was elected a Fellow of the Royal Society, a recognition of the significance of his work even at a time when neural networks were still considered secondary to symbolic approaches by much of the mainstream. He accumulated awards and honours steadily. But the transformative results — the results that would force the rest of the field to take neural networks seriously — were still years away.

The breakthrough came from a problem in learning that Hinton had been working on for years: how to train deep networks — networks with many layers — when backpropagation became computationally intractable for large architectures. In 2006, he published, with Simon Osindero and Yee-Whye Teh, a paper introducing Deep Belief Networks — a method for pre-training deep networks layer by layer using restricted Boltzmann machines, before fine-tuning with backpropagation. The paper showed that deep networks, trained this way, could learn hierarchical representations of data that were dramatically more powerful than anything achievable with shallow architectures.

The 2006 paper was the beginning of the end of the long neural network winter. Hinton, Yoshua Bengio at the Universite de Montreal, and Yann LeCun at New York University — who had been working on convolutional neural networks for image recognition — were now producing results that the rest of the field could not ignore. They collectively established the research programme that would come to be called deep learning, and they collectively became known as its godfathers.

***

## ImageNet and the Moment Everything Changed

The results that forced the broader AI and technology communities to take deep learning seriously came in September 2012, at a competition held annually to benchmark progress in image recognition. The ImageNet Large Scale Visual Recognition Challenge presented a test that had been considered one of the hardest problems in computer vision: classify a million photographs into a thousand categories, with accuracy measured against human labelling.

Hinton's graduate students, Alex Krizhevsky and Ilya Sutskever, built a deep convolutional neural network — AlexNet — and entered it in the competition. The results were not merely better than the competition. They were categorically better. AlexNet's error rate was roughly half that of the next best system. The gap was so large that it was initially difficult to believe. It was, for many researchers, the moment they understood that something fundamental had changed.

AlexNet's architecture incorporated several innovations that Hinton's group had been developing: rectified linear units, which trained faster than the sigmoid functions used in earlier networks; dropout, a regularisation technique that prevented overfitting by randomly deactivating units during training; and training on graphics processing units, which made the computation fast enough to be practical on the scale required. These were not individually new ideas, but their combination, applied to a large dataset with sufficient compute, produced results that the previous generation of methods could not approach.

Hinton, Krizhevsky, and Sutskever founded a company, DNNresearch, to commercialise the technology. In 2013, Google acquired it for approximately 44 million dollars — not for a product but for the people and the research programme. Hinton joined Google Brain, the company's AI research division, and began a decade of dividing his time between Toronto and Google.

The ImageNet result, and the acquisition that followed, triggered the deep learning arms race. Within two years, every major technology company had a deep learning research group. Within five years, deep learning had transformed speech recognition, machine translation, image classification, and the early stages of language modelling. The systems that would eventually produce large language models, image generation, and protein structure prediction all descend from the research programme that Hinton had maintained through two long winters and whose first major vindication had come in a competition in 2012.

***

## Google and the Questions That Would Not Go Away

Hinton's decade at Google was productive and, by the standards of AI research, relatively comfortable. He had access to large amounts of computing resources and talented collaborators. He continued publishing on neural network architectures, including work on capsule networks — an attempt to address limitations in convolutional networks handling of spatial relationships — and the Forward-Forward algorithm, a proposed alternative to backpropagation that he developed in 2022. He was named a Vice President and Engineering Fellow at Google.

But throughout this period, questions about the implications of the technology he had helped build were becoming harder to set aside. The systems being developed were becoming very powerful very quickly. They were demonstrating capabilities — in language, reasoning, and problem-solving — that had not been anticipated even by the researchers building them. Hinton found himself thinking, with increasing urgency, about questions he had not previously had to take seriously: whether the systems being built could eventually become more intelligent than humans, whether they could develop goals misaligned with human interests, and whether humanity had any reliable means of preventing either outcome.

These were not questions he had avoided out of complacency. He had simply, for most of his career, been focused on the scientific problem of making neural networks work. The safety questions felt like something for later, when the technology was more mature. By the early 2020s, he concluded that later had arrived — that the rate of progress meant that systems of potentially transformative capability were plausibly years, not decades, away, and that the absence of any serious technical or governance framework for managing that transition was alarming.

In May 2023, he resigned from Google. He was careful to say that his departure was not a criticism of Google specifically — the company had, in his assessment, acted responsibly relative to the broader competitive environment. His concern was structural: the competitive dynamics of the AI industry, combined with the pace of progress and the absence of adequate safety research, made dangerous outcomes more likely than they should be. He wanted to be able to say this without the conflict of interest that came from being an employee of one of the leading AI companies.

The resignation made global news. Hinton had spent fifty years building the technology he was now publicly warning about. His credibility was unquestioned. The questions he was raising were the questions that AI researchers had been told, for years, were speculative and premature. Coming from him, they were harder to dismiss.

***

## The Nature of the Warning

Hinton's post-Google public statements have been precise in ways that coverage of them has not always been. He has not predicted AI apocalypse as a certainty. He has estimated, as of 2024, that there is roughly a ten to twenty per cent chance that AI development leads to human extinction within thirty years. He regards this as an alarming probability for an outcome of that magnitude, not a confident prediction of catastrophe.

His specific concerns are several. He worries about misuse — that powerful AI systems will be used by bad actors for manipulation, disinformation, and surveillance at scales previously impossible. He worries about job displacement — that the economic disruption from AI-driven automation will be rapid enough to destabilise societies before adequate responses can be developed. And he worries about the longer-term alignment problem: that as AI systems become more capable, they may develop goals or instrumental strategies that are not aligned with human interests, and that by the time this becomes apparent it may be too late to correct.

He has been explicit that he does not believe current systems are conscious or that they have goals in any robust sense. His concern about misalignment is prospective — about systems more capable than current ones, developed under competitive pressures that discourage the pace of safety research the situation warrants. He has called for governments to require that AI companies spend a significant fraction of their compute budgets on safety research. He has called for international agreements on AI development analogous to the agreements governing nuclear weapons. He has acknowledged that he does not know how to solve the alignment problem, only that it needs to be solved before the systems that make it urgent are deployed.

The Nobel Prize committee, in awarding Hinton and John Hopfield the Nobel Prize in Physics in 2024, cited their foundational contributions to the machine learning methods that underpin modern AI. It was, by any conventional reckoning, a validation of a lifetime of work. Hinton accepted it. He also used the occasion to reiterate his warnings.

***

## The Legacy in Progress

Hinton's scientific legacy is still accumulating. He is in his late seventies, still publishing, still arguing for ideas that go against the current consensus — most recently for approaches to learning that are more biologically plausible than standard backpropagation. Whether these ideas will prove as important as the ones he developed in the 1980s and 2000s is impossible to know.

What is already clear is that his career constitutes one of the most remarkable examples of scientific persistence in the history of AI. He chose an unpopular research direction in the early 1970s and pursued it across fifty years and two periods in which the mainstream of the field had effectively declared it a dead end. He was right and the mainstream was wrong, and the consequences of his being right have transformed not just AI but the broader technological landscape within which everyone now lives.

He has described his current position — the position of warning about the technology he spent his life building — as uncomfortable. He has said he is not sure he made the right choices, that if he had known in 1970 what he knows now about where the technology would lead, he might have done something different. He has also said that even if he had known, he is not certain he would have chosen differently, because the scientific problem was genuinely compelling and because it is very difficult, in the middle of a research programme, to know what the end of it will look like.

This is the honest answer of a scientist who built something that worked, and who is now confronted with the question of what it means that it worked as well as it did.

***

## Key Works and Further Reading

**Primary sources:**

- Learning representations by back-propagating errors — David Rumelhart, Geoffrey Hinton, and Ronald Williams (1986). Nature, 323, 533-536.
- A fast learning algorithm for deep belief nets — Geoffrey Hinton, Simon Osindero, and Yee-Whye Teh (2006). Neural Computation, 18(7), 1527-1554.
- ImageNet classification with deep convolutional neural networks — Alex Krizhevsky, Ilya Sutskever, and Geoffrey Hinton (2012). NeurIPS 2012 proceedings.
- The Forward-Forward Algorithm: Some Preliminary Investigations — Geoffrey Hinton (2022).

**Recommended reading:**

- The Deep Learning Revolution — Terrence Sejnowski (2018).
- Genius Makers — Cade Metz (2021).
- Human Compatible — Stuart Russell (2019).
- The Alignment Problem — Brian Christian (2020).
