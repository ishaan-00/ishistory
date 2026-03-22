---
title: "Ilya Sutskever"
series: "ai-history"
type: "profile"
episode_number: 115
roman: "XV"
part: "part-profiles-c"
part_label: "Profiles: The Builders"
tag: "Profile"
description: "The quiet genius behind GPT — co-founder of OpenAI, architect of some of its most important research, and a pivotal figure in the dramatic boardroom crisis of 2023."
date: 2026-03-12
read_time: 9

---

# Ilya Sutskever
## The True Believer

*Born: 1986, Nizhny Novgorod, Russia*

---

There is a photograph taken at the University of Toronto in 2012 that captures, in a single image, the moment when artificial intelligence changed direction. Geoff Hinton stands in the centre, flanked by two of his graduate students. To his left is Alex Krizhevsky, who wrote most of the code for the convolutional neural network that would win the ImageNet competition that year by a margin so large it seemed like a mistake. To his right is Ilya Sutskever, who contributed key ideas to the architecture and whose deeper conviction about what they had built would carry him further and further into territory where almost no one else was prepared to follow.

Sutskever left that photograph and went on to co-found OpenAI, lead its research team through the development of GPT-2, GPT-3, GPT-4, and DALL-E, and play a central role in making OpenAI the most consequential AI organisation of its era. He voted to fire Sam Altman in November 2023 and then, within days, signed the letter calling for his reinstatement, an act of reversal so swift and public that it exposed, more clearly than anything else, the extraordinary internal tensions of an organisation trying to build technology it genuinely believed might be the most dangerous in human history while simultaneously racing as fast as possible to build it.

He left OpenAI in 2024 to found Safe Superintelligence, a company with a single stated objective: building safe superintelligent AI. No products. No short-term revenue. Just the problem, approached with complete seriousness.

Sutskever is, among the leading figures in AI, the one who most fully inhabits the peculiar combination of excitement and terror that the field's own discoveries have generated. He does not think AI safety is a secondary concern or a long-term problem. He thinks it is the most important problem there is, and he has organised his life around solving it with an intensity that his colleagues describe, depending on their own views, as admirable or alarming.

---

## From Nizhny Novgorod to Jerusalem to Toronto

Sutskever was born in 1986 in Nizhny Novgorod, a large industrial city on the Volga. His family emigrated when he was five, first to Israel, where he spent his childhood and adolescence, and then, when he was going to university, to Canada. He studied at the University of Toronto, drawn there in part because of Hinton's presence, and joined Hinton's group as a graduate student in the mid-2000s.

The Toronto machine learning group was, at that moment, one of the most intellectually productive environments in AI research. Hinton had spent twenty years working on neural networks during a period when the field was largely dismissed, and he had attracted around him a collection of students and postdocs who shared both his technical convictions and his willingness to work on problems that most of the community regarded as unpromising. Sutskever absorbed both qualities. He was intensely serious about the mathematics, staying up through nights to work through problems, and he was also — unusually, for a technical researcher — intensely serious about the big-picture question of what it would mean if the systems he was building actually worked.

His doctoral thesis, completed in 2013 under Hinton's supervision, contributed to several of the ideas that defined the deep learning revolution. He co-authored the AlexNet paper with Krizhevsky and Hinton. He developed early ideas about training recurrent neural networks that influenced the subsequent development of sequence models. And he began, during this period, to think seriously about a question that would define the next decade of his work: what would you need to do, technically and organisationally, to build systems that were not merely better than existing AI but qualitatively different — systems capable of the kind of open-ended reasoning and learning that characterised human intelligence?

---

## Google Brain and the Sequence-to-Sequence Breakthrough

After completing his doctorate, Sutskever joined Google Brain, where he worked alongside Jeff Dean, Samy Bengio, Quoc Le, and others on the problem of applying deep learning to sequence data — language, speech, and other inputs where the relevant structure was temporal rather than spatial.

The work produced, in 2014, one of the most influential papers in the history of deep learning: "Sequence to Sequence Learning with Neural Networks," co-authored with Oriol Vinyals and Quoc Le. The paper introduced the encoder-decoder architecture that became the basis for neural machine translation, for summarisation, for question answering, and ultimately for the large language models that would define the next decade of AI.

The idea was elegant in retrospect but not obvious in advance. Train one neural network to compress a variable-length input sequence — a sentence in English, say — into a fixed-length vector representation. Train another network to expand that vector into a variable-length output sequence — a sentence in French. Train both networks together, end to end, using examples of correct translations, and let the networks figure out, through gradient descent, what the intermediate representation should be.

The system worked better than anyone expected. It achieved state-of-the-art results on English-French translation, a benchmark that had resisted improvement for years, and it did so with a single, simple, end-to-end architecture that required no hand-engineered features or language-specific knowledge. More importantly, the architecture was general. The same approach could be applied to any problem that involved transforming one sequence into another, and the field immediately recognised this and began exploring the space of applications.

Attention mechanisms, introduced in subsequent work by Bahdanau and others, extended the architecture further, allowing the decoder to selectively focus on different parts of the input when generating each part of the output. The transformer architecture, introduced in 2017, replaced the recurrent networks in the original encoder-decoder with attention mechanisms throughout, producing a more parallelisable and ultimately more powerful architecture. GPT, BERT, and their successors all trace their lineage to the sequence-to-sequence insight that Sutskever and his collaborators had the clarity to articulate in 2014.

---

## OpenAI and the Scaling Bet

In 2015, Sutskever left Google to co-found OpenAI with Sam Altman, Greg Brockman, Elon Musk, and others. The organisation was established as a non-profit with a stated mission of ensuring that artificial general intelligence would benefit all of humanity. The non-profit structure was intended to insulate research decisions from commercial pressures. The mission statement was intended to signal seriousness about safety rather than mere capability.

Whether these structural choices served their intended purposes is debatable. What is not debatable is that OpenAI, under Sutskever's technical leadership, became the most productive AI research organisation of the late 2010s and early 2020s. The research direction he chose — the scaling hypothesis, the bet that larger models trained on more data with more compute would produce qualitatively better capabilities — turned out to be correct in ways and to an extent that surprised even its proponents.

GPT, released in 2018, was a language model trained on a large corpus of internet text using the transformer architecture. It could generate coherent prose, complete sentences, and perform simple language tasks. GPT-2, released in 2019, was ten times larger and produced text that was, in many cases, indistinguishable from human writing. OpenAI initially withheld the full model from public release, citing concern about misuse — a decision that attracted both praise for its caution and criticism for its paternalism.

GPT-3, released in 2020, was a hundred times larger than GPT-2, and it crossed a threshold that changed the conversation about AI. It could write essays, code programs, answer questions, summarise documents, and perform tasks that required apparent reasoning, all from a brief natural language description of what was wanted. It was not a general intelligence, but it was something that had not existed before: a system that could, with minimal prompting, do a remarkably wide range of cognitively demanding tasks.

Sutskever's role in these developments was not purely technical. He was also the person at OpenAI who most consistently pushed the organisation to take seriously the possibility that what they were building was genuinely dangerous — that systems capable of the kind of capabilities GPT-3 demonstrated might, at sufficient scale, pose risks that required careful management. He championed the development of OpenAI's safety team, pushed for alignment research to be treated as central rather than peripheral, and argued internally for caution in ways that sometimes created friction with the commercial imperatives that increasingly drove the organisation.

---

## The November Crisis

In November 2023, the board of OpenAI fired Sam Altman, the CEO, citing a loss of confidence in his candour. The exact reasons for the firing were not publicly disclosed, and multiple accounts of what happened have since emerged, none of them entirely consistent. What is known is that Sutskever, as a board member, voted for the firing.

What followed was one of the most dramatic corporate crises in the history of technology. Microsoft, which had invested thirteen billion dollars in OpenAI and whose products depended on access to OpenAI's technology, immediately announced that Altman and Brockman would be joining Microsoft. The vast majority of OpenAI's employees signed a letter threatening to resign and follow Altman unless the board reversed its decision. Sutskever, within days, signed the letter.

Altman was reinstated after five days. The board members who had voted to fire him resigned. Sutskever announced, in a post notable for its lack of explanation, that he would not be returning to his role as Chief Scientist. He left OpenAI in May 2024.

The episode was interpreted in many ways. Some saw it as evidence of a genuine disagreement about safety — that Sutskever had voted to fire Altman because he believed the pace of development was reckless, and that his subsequent reversal reflected a recognition that the firing had not achieved its goal. Others saw it as a failure of governance, an object lesson in the difficulties of running a non-profit organisation with a commercial arm and a board that lacked the expertise or the unity to make difficult decisions stick. What it revealed most clearly was the internal contradictions of an organisation that was simultaneously committed to beneficial AI and to competitive dominance in its development.

---

## Safe Superintelligence

Sutskever founded Safe Superintelligence in June 2024 with Daniel Gross and Daniel Levy. The company's stated mission was to build safe superintelligence as its first and only product. No commercial products. No distractions from the core objective. Just the problem.

The framing was unusual in its directness. Most AI organisations acknowledge safety as a goal while pursuing capabilities. Safe Superintelligence proposed to make safety and capability a single joint objective, arguing that the two are not in tension but that achieving safety is a prerequisite for achieving superintelligence of any lasting value.

Whether the approach will succeed is impossible to know at this stage of the organisation's existence. What is clear is that Sutskever's departure from OpenAI and the founding of Safe Superintelligence represent a genuine attempt to act on convictions about AI risk that he has held, and publicly articulated, for years. He has said that he believes superintelligent AI is coming, that it will be transformative beyond anything we can currently imagine, and that the question of whether it is safe is the most important question humanity has ever faced. He has organised his career, and now his company, around that conviction.

In the history of AI, figures of Sutskever's technical accomplishment who are also genuinely, consistently serious about the risks of their own work are rare. That combination — builder and worrier in the same person — may be exactly what is needed for the problems ahead.

---

## Key Works & Further Reading

**Primary sources:**
- "ImageNet Classification with Deep Convolutional Neural Networks" — Krizhevsky, Sutskever, Hinton (2012). AlexNet; the paper that started the deep learning revolution in computer vision.
- "Sequence to Sequence Learning with Neural Networks" — Sutskever, Vinyals, Le (2014). The paper that introduced the encoder-decoder architecture.
- "Language Models are Few-Shot Learners" — Brown et al., OpenAI (2020). The GPT-3 paper; Sutskever was among the key contributors.
- "Improving Language Understanding by Generative Pre-Training" — Radford et al., OpenAI (2018). The original GPT paper.

**Recommended reading:**
- *The Alignment Problem* — Brian Christian (2020). The most thorough account of the problem Sutskever has dedicated his post-OpenAI career to solving.
- *Superintelligence* — Nick Bostrom (2014). The book that gave shape to many of the safety concerns that animate Sutskever's work.
- *The Coming Wave* — Mustafa Suleyman (2023). A perspective on AI risk from a fellow co-founder of a major AI lab; illuminating in comparison.
- *Attention Is All You Need* — Vaswani et al. (2017). The transformer paper that built on the sequence-to-sequence work and enabled everything that followed.
