---
title: Fei-Fei Li
series: ai-history
type: profile
episode_number: 112
roman: XII
part: part-profiles-b
part_label: 'Profiles: Deep Learning Revolution'
tag: Profile
description: The creator of ImageNet, the dataset that sparked the deep learning revolution, and a leading voice for human-centered AI.
date: 2026-03-12
coming_soon: false
---

# Fei-Fei Li

## The Godmother of AI

_Born: 3 July 1976, Beijing, China_

***

When Fei-Fei Li arrived in the United States at the age of fifteen, she spoke almost no English. Her family had left Chengdu for Parsippany, New Jersey, where her parents — an engineer and a teacher in China — found themselves starting over. Her father worked odd jobs. Her mother eventually ran a dry-cleaning business. Li attended public high school, learned the language, and worked part-time shifts at a Chinese restaurant to supplement the family income. None of this appeared, to an outside observer, to be the beginning of a scientific career that would reshape artificial intelligence.

But Li had arrived with something that circumstances could not easily take away: a fascination with how the mind worked, an appetite for hard problems, and the conviction, absorbed from her parents, that education was the way through. She applied to Princeton and was admitted. She studied physics. She graduated with high honours in 1999.

The path from immigrant teenager in New Jersey to the person who created the dataset that triggered the deep learning revolution took roughly a decade. It required a particular kind of intellectual stubbornness — the kind that commits to a direction that looks unpromising, tolerates years of apparent failure, and keeps going anyway. It also required a recognition, which Li arrived at early in her graduate training, that the way the field of computer vision was approaching its central problem was fundamentally wrong, and that getting it right would require not a better algorithm but a better understanding of what learning actually needs.

***

## Physics, Caltech, and the Problem of Seeing

Li enrolled as a graduate student at the California Institute of Technology in 1999, working toward a doctorate in electrical engineering. Her supervisor was Pietro Perona, a computer vision researcher whose interests ran, like Li's, in the direction of how biological visual systems worked and what that implied for machine vision. The combination of physics training and neuroscience-inflected computer vision gave Li an unusual vantage point on a field that was, at the time, generating increasingly sophisticated algorithms against increasingly inadequate benchmarks.

The problem with computer vision in the early 2000s was not, she came to believe, primarily algorithmic. It was the data. The field's standard practice was to train recognition systems on small, carefully curated datasets — a few hundred or a few thousand images, assembled by researchers, representing a narrow slice of the visual world. The algorithms that emerged from this practice were fragile in a specific and telling way: they worked on the categories they had been trained on and broke down almost immediately when exposed to the variability of real visual experience. This was not a surprise. Human visual recognition does not work by mastering a curated set of examples. It works by exposure to an enormous, varied, messy sample of the world.

Li completed her PhD in 2005 and spent a year as a faculty member at the University of Illinois at Urbana-Champaign before joining Princeton's computer science department in 2007. It was at Princeton, in the same year she arrived, that she began the project that would become ImageNet.

***

## ImageNet: The Dataset That Changed Everything

The idea was simple enough to state and formidable enough to undertake: build a dataset of images at the scale and diversity of the visual world itself. Not thousands of images but millions. Not dozens of categories but thousands. If machine learning systems needed data to learn, and if the data they had been given was inadequate to the task, the solution was not a better algorithm. The solution was more and better data.

Li brought this idea to colleagues at Princeton, where she found a critical early ally in Kai Li, a professor who saw the potential in the direction and gave her resources — including a graduate student, Jia Deng, who would become the project's most important collaborator. The conceptual framework for the database came from WordNet, a hierarchical lexical database developed by George Miller at Princeton, which organised concepts into synonym sets — synsets — arranged in taxonomic relationships. Li's plan was to populate WordNet's noun hierarchy with images: to find representative photographs for each of the roughly 80,000 noun concepts in the database, creating a visual ontology of the world as human beings categorise it.

The labelling problem was acute. Finding and annotating millions of images by hand was not feasible for any research group. The solution came from a then-new platform: Amazon Mechanical Turk, a crowdsourcing marketplace that allowed tasks to be distributed to workers around the world at low cost. By 2009, Li's team had assembled and annotated more than 3.2 million images across roughly 22,000 categories — a scale that had no precedent in the field. They published the dataset at the Conference on Computer Vision and Pattern Recognition that year. They also made it freely available to any researcher who wanted to use it.

The initial reception was polite but not immediately transformative. Dataset papers were not the prestige currency of computer vision research. Li knew this. She also knew that a dataset is only as valuable as the use people make of it, and she began planning for a competition.

***

## The Challenge and the Moment It Produced

The ImageNet Large Scale Visual Recognition Challenge — ILSVRC — began in 2010. Teams from around the world submitted algorithms to be evaluated on the same task: correctly classify images from a subset of ImageNet into a thousand categories, with performance measured against human-assigned labels. The error rates in the first two years improved incrementally, driven by better implementations of the dominant approaches — support vector machines and engineered visual features — that the field had been developing for years.

Then came 2012.

The team that entered the competition that year came from Geoffrey Hinton's group at the University of Toronto. Alex Krizhevsky and Ilya Sutskever had built a deep convolutional neural network — AlexNet — trained on two graphics processing units over the course of several days. Their error rate was 15.3 percent. The next-best entry, using conventional methods, achieved 26.2 percent. The gap was not a marginal improvement. It was a rupture.

Li had not anticipated this specific result, though she had anticipated that the competition would eventually produce the evidence the field needed. What ImageNet provided was not just training data but a shared, credible, large-scale test of what a recognition system could actually do. The competition made comparison honest. It made progress visible. And in 2012, it made it impossible for anyone paying attention to ignore what deep learning, given sufficient data and sufficient compute, could accomplish. The result was reported in the technology press and the scientific literature as a discontinuity. For many researchers, it was precisely that.

The arms race that followed — every major technology company building deep learning research groups, recruiting neural network researchers at extraordinary salaries, reorienting their product development around the new capabilities — can be traced to that moment. Li had not built AlexNet. But she had built the arena in which AlexNet's significance became undeniable.

***

## Stanford, Google, and the Scope of the Mission

Li joined the Stanford faculty in 2009 and became director of the Stanford Artificial Intelligence Laboratory in 2013. At Stanford she continued her research in computer vision, expanding its scope into cognitive neuroscience — probing the relationship between biological and machine visual processing — and into applications. One strand of her applied work explored how computer vision could be deployed in healthcare settings: ambient intelligence systems that could monitor hospital rooms and detect early indicators of patient deterioration, or track hand hygiene compliance among clinical staff, reducing hospital-acquired infections. The work was technically demanding and socially motivated in a way that was characteristic of how Li thought about the purpose of her research.

She took a sabbatical from Stanford in January 2017 to join Google as Vice President and Chief Scientist of AI/ML at Google Cloud. The role was not primarily a research position. It was about democratisation — reducing the technical barriers that prevented organisations without large AI teams from accessing and deploying machine learning capabilities. AutoML, a system that allowed non-specialists to build custom machine learning models, was developed by her team during this period. The work was less visible than frontier research but, in aggregate, touched more people and more institutions than any single academic paper.

She returned to Stanford in 2018. The same year, she was promoted to full professor and became the inaugural Sequoia Capital Professor in Computer Science. She also co-founded the Stanford Institute for Human-Centered Artificial Intelligence — HAI — with former provost John Etchemendy. HAI was the institutional expression of a conviction Li had been developing throughout her career: that the most important questions in AI were not purely technical, and that technical people working alone were not equipped to answer them.

***

## Human-Centered AI and the Argument Behind It

The phrase "human-centered AI" can sound like a slogan, and Li is aware that it has sometimes been received as one. What she means by it is more specific. She means that the design of AI systems should take seriously what is known about human cognition, human values, and human social organisation — not as afterthoughts or constraints added to systems whose goals are defined by technical performance metrics, but as constitutive elements of what the systems are trying to do.

This argument emerged from her experience with ImageNet. The dataset had been built using human annotators and human categorical judgements. It encoded, therefore, human perspectives — and human biases. When researchers began examining the dataset carefully in the late 2010s, they found categories that reflected cultural assumptions, labels that carried derogatory connotations, and a distribution of images that over-represented some communities and under-represented others. Li's group undertook significant work to audit and revise the dataset. The exercise was, for her, an illustration of a broader principle: that AI systems learn from human-generated data, and that the humans generating the data, and the humans making decisions about what to collect and how to label it, make choices that embed values whether or not they intend to.

HAI was designed to bring together AI researchers with social scientists, ethicists, lawyers, political scientists, and humanists — not to slow down AI development but to shape it. The institute produces research, convenes policymakers, trains students, and releases the annual AI Index, which tracks the state of AI development with a rigour and breadth that no previous effort had attempted. It has become one of the most cited sources for anyone trying to understand what is actually happening in the field as opposed to what is being claimed about it.

Li has also been a persistent advocate for diversity in AI — in who does the research, who designs the systems, and who benefits from them. In 2017 she co-founded AI4ALL, a nonprofit organisation that runs programmes for high school students, with particular focus on recruiting young women and students from underrepresented communities into AI education. The premise of AI4ALL is not charity but correction: that a field built by a narrow demographic will encode the assumptions and blind spots of that demographic, and that broadening who participates in AI is a precondition for building AI that works for everyone.

***

## The Ongoing Work

In 2024, Li co-founded World Labs, a startup focused on spatial intelligence — the capacity of AI systems to understand and reason about three-dimensional space. The motivation is both scientific and practical. Current AI systems are, in her framing, essentially flat: they process images and text, which are two-dimensional representations, without a genuine model of the physical world those representations depict. Spatial intelligence, she argues, is the next frontier, with implications for robotics, augmented reality, and any application that requires AI to act in physical environments rather than merely process digital ones.

The founding of World Labs represented a decision to move, for the first time, from academic research and institutional work into the building of a company. It was a substantial commitment, and it was watched carefully by a field that regards Li as one of its most significant figures. Whether World Labs produces the breakthrough she is aiming for is unknown. That she is aiming at a genuine scientific problem — one that the field has not yet solved — is not in dispute.

Li was named one of Time Magazine's Persons of the Year for 2025, a recognition that reflected not just her scientific contributions but her broader role as a public intellectual on AI — someone who speaks clearly, thinks carefully, and is willing to engage with the hard questions about what AI is doing to the world rather than simply promoting what it can do.

She has testified before the United States Senate and Congress on AI policy. She served on the National AI Research Resource Task Force. She was appointed to the United Nations Secretary-General's Scientific Advisory Board. These are not the activities of a person who regards the technical work as separable from its consequences. They are the activities of a person who built something significant and feels the weight of that.

***

## What ImageNet Made Possible

It is worth being precise about the nature of Li's contribution, because it is easy to mischaracterise. She did not invent deep learning. She did not develop the algorithms that AlexNet used. What she did was construct the conditions under which those algorithms could demonstrate what they were capable of.

This is not a minor achievement. Science depends on infrastructure — on shared datasets, shared benchmarks, shared experimental frameworks that allow results to be compared and reproduced and built upon. For decades, computer vision lacked this infrastructure at the scale the problem required. ImageNet provided it. The challenge operationalised it into a competition that made progress measurable and motivated. Without both, the 2012 AlexNet result might have been achieved and then sat in a research paper, read by specialists and cited slowly, rather than recognised immediately as the rupture it was.

The deep learning revolution — the transformation of speech recognition, machine translation, image generation, protein structure prediction, and language modelling — would have happened without Fei-Fei Li. The algorithms were ready. The compute was available. But it might have taken longer to become undeniable, longer to attract the investment, longer to recruit the talent, longer to become the organising framework for a generation of AI research. The benchmark she created accelerated the timeline and, in doing so, shaped the particular form the revolution took.

She was born in Beijing in 1976, came to the United States at fifteen with her family and very little else, worked in a restaurant while studying for college, studied physics at Princeton, trained in computer vision at Caltech, and spent the following decades building both a dataset that changed the world and an argument for why the world that dataset helped create needed to be built differently. The combination is unusual. The consequences are still unfolding.

***

## Key Works and Further Reading

**Primary sources:**

- ImageNet: A Large-Scale Hierarchical Image Database — Jia Deng, Wei Dong, Richard Socher, Li-Jia Li, Kai Li, and Fei-Fei Li (2009). CVPR 2009 proceedings.
- ImageNet Large Scale Visual Recognition Challenge — Olga Russakovsky, Jia Deng, Hao Su, Jonathan Krause, Sanjeev Satheesh, Sean Ma, Zhiheng Huang, Andrej Karpathy, Aditya Khosla, Michael Bernstein, Alexander C. Berg, and Fei-Fei Li (2015). International Journal of Computer Vision, 115(3), 211-252.
- Deep Visual-Semantic Alignments for Image Captioning — Andrej Karpathy and Fei-Fei Li (2015). CVPR 2015 proceedings.
- The Worlds I See: Curiosity, Exploration, and Discovery at the Dawn of AI — Fei-Fei Li (2023). Flatiron Books.

**Recommended reading:**

- The Deep Learning Revolution — Terrence Sejnowski (2018).
- Genius Makers — Cade Metz (2021).
- Architects of Intelligence — Martin Ford (2018). [Interview with Li at pp. 145-162.]
- Human Compatible — Stuart Russell (2019).
