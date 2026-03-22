---
title: "Andrej Karpathy"
series: "ai-history"
type: "profile"
episode_number: 116
roman: "XVI"
part: "part-profiles-c"
part_label: "Profiles: The Builders"
tag: "Profile"
description: "The educator-engineer who made deep learning accessible to millions, built Tesla's Autopilot vision system, and became one of AI's most influential communicators."
date: 2026-03-12
read_time: 9

---

# Andrej Karpathy
## The Teacher Who Builds

*Born: 23 October 1985, Bratislava, Czechoslovakia*

---

Andrej Karpathy has done something that very few people in the history of any technical field have managed: he has worked at the absolute frontier of his discipline and simultaneously made its ideas accessible to people who are just beginning. Most scientists who work at the frontier have neither the time nor the inclination to look back and explain what they have learned. Most teachers who explain clearly are not working at the frontier. Karpathy does both, and has been doing both, with evident pleasure, since he was a graduate student.

The results of this combination are visible everywhere in contemporary AI. His Stanford course on convolutional neural networks, his blog posts on recurrent neural networks and the unreasonable effectiveness of character-level language models, his GitHub repositories, his YouTube lectures — all of these have trained a generation of practitioners who might otherwise have found the mathematics impenetrable or the literature inaccessible. At the same time, the systems he built at Tesla, deploying vision-based machine learning to millions of production vehicles, constitute one of the largest and most demanding real-world applications of deep learning ever attempted.

He is also, among the leading figures in AI, one of the most careful observers of his own field — someone who notices not just what the systems can do but what they do in interesting ways, who pays attention to failure modes and edge cases and surprising successes with the curiosity of someone who is still, after years at the frontier, genuinely surprised by what he finds.

---

## Slovakia, Canada, and Stanford

Karpathy was born in Bratislava in 1985, in what was then Czechoslovakia, and emigrated with his family to Canada when he was fifteen. He attended the University of Toronto for his undergraduate degree, studying computer science and physics — the same institution that had produced Hinton's group and, a few years earlier, Sutskever. He completed his master's degree at the University of British Columbia before going to Stanford for his doctorate.

At Stanford, working with Li Fei-Fei, Karpathy's research focused on the intersection of computer vision and natural language — systems that could not only classify images but describe them, systems that could answer questions about visual content, systems that could align visual and linguistic representations in ways that made both more useful. The work produced, among other things, a recurrent neural network approach to image captioning that was both technically innovative and exceptionally well-explained in the accompanying paper and blog post.

The blog post associated with this work, titled "The Unreasonable Effectiveness of Recurrent Neural Networks," published in 2015, became one of the most widely read pieces of technical writing in the history of AI. It introduced character-level language models through a series of worked examples — a network trained on Shakespearean texts, on Linux kernel source code, on mathematical papers — and demonstrated, through the generated outputs, something that was both funny and profound: that a simple model, trained on sequence data, would absorb the statistical structure of that data to a degree that produced recognisable approximations of its style, its vocabulary, its very feel, without any explicit representation of what that style was.

The post was widely shared because it was beautifully written, because the examples were delightful, and because it demonstrated something important about what neural networks were actually doing — not learning rules but absorbing distributions. For thousands of engineers and researchers who read it, it was the piece that made recurrent neural networks intuitive rather than mysterious.

---

## CS231n and the Teaching Project

While completing his doctorate, Karpathy co-developed and taught CS231n at Stanford — Convolutional Neural Networks for Visual Recognition. The course, which he taught with Li Fei-Fei and Justin Johnson, became one of the most influential technical courses in the history of machine learning education. Its lecture videos, freely available on YouTube, have been watched tens of millions of times. Its notes have been read by people on every continent. Its problem sets have been completed by students at universities that had no formal AI programme of their own.

What made CS231n exceptional was not the content alone, which covered the standard material on convolutional networks, but the way the content was organised and explained. Karpathy's sections, in particular, demonstrated a gift for analogies and visualisations that made abstract mathematical operations feel intuitive. He explained backpropagation through a series of computational graph examples that were clearer than anything in the standard textbooks. He explained the intuition behind batch normalisation, dropout, and transfer learning in ways that gave practitioners not just recipes but understanding.

The teaching project extended after Stanford. His neural networks series on YouTube, launched in 2022, took viewers from first principles through the implementation of increasingly sophisticated language models, including a complete implementation of GPT from scratch. The series attracted hundreds of thousands of subscribers and became the standard recommendation for engineers who wanted to understand language models from the ground up rather than from the documentation of existing frameworks.

Karpathy has been explicit about why he invests in teaching. He believes that the diffusion of AI knowledge is important not just instrumentally but intrinsically — that a world in which AI is understood only by a small technical elite is more dangerous than one in which it is broadly understood, and that the work of making it understood is therefore among the most important things a technically capable person can do.

---

## Tesla Autopilot and the Production Challenge

In 2017, Karpathy joined Tesla as Director of AI and Autopilot Vision. The role was a significant departure from academic research. Autopilot was not a research project but a production system, running on millions of vehicles, making real-time decisions with consequences that were immediate and sometimes severe. The constraints were not the constraints of academic benchmarks but the constraints of physics, regulation, liability, and the extraordinary diversity of real-world road conditions.

The core technical challenge Karpathy took on was replacing the radar and ultrasonic sensors in Tesla's sensor suite with a purely vision-based approach. The argument was that human drivers navigate using vision, that the world is designed for visual navigation, and that a system capable of human-level visual understanding would therefore be capable of human-level driving. This argument was controversial — many researchers and engineers believed that cameras alone were insufficient, that LIDAR and radar provided essential information that vision could not replicate — and the controversy has not been fully resolved.

What Tesla achieved under Karpathy's technical leadership was a system of considerable sophistication. The neural network architecture, which Karpathy described in detail at Tesla's AI Day in 2021, was a transformer-based system that took video input from eight cameras surrounding the vehicle and produced a three-dimensional representation of the environment, including the positions and velocities of other vehicles, pedestrians, and road features. The system was trained on a dataset of hundreds of millions of clips from real-world Tesla vehicles, annotated partly by humans and partly by the neural network itself.

The production scale of the system — running inference on millions of vehicles simultaneously, updating models through over-the-air software updates, using the global fleet as a distributed data collection system — was unlike anything in academic machine learning. Managing that scale, maintaining safety while deploying incrementally more capable systems, and navigating the regulatory and public relations dimensions of a technology that occasionally failed in ways that were visible and sometimes fatal — all of this gave Karpathy an operational experience that no amount of academic research could provide.

He left Tesla in 2022, citing a desire to return to his technical and educational interests. His departure was followed by a period as a visiting researcher at OpenAI and then the YouTube teaching series that brought his work to a new audience.

---

## Vibe Coding and the Changing Practice of AI

In 2025, Karpathy coined the term "vibe coding" to describe a practice that had become widespread: using large language models to write code by describing, in natural language, what you wanted the code to do, without necessarily understanding the code the model produced. The term was coined somewhat tongue-in-cheek, in a post that was partly a description and partly a self-deprecating confession — Karpathy admitted to doing this himself for personal projects, noting the peculiar experience of writing software by vibing with a language model rather than by understanding the implementation.

The term immediately entered the vocabulary of the AI community, attracting both enthusiasm and criticism. Critics argued that vibe coding was intellectually irresponsible, that it produced systems whose developers did not understand them, that it was a shortcut that would ultimately produce more problems than it solved. Enthusiasts argued that it democratised software development, that the relevant skill was not writing code but specifying requirements, and that the ability to build functional software without formal programming training was straightforwardly good.

The debate was a small illustration of a larger question that Karpathy has been circling for years: what happens to human skill and human understanding in a world where AI can produce competent outputs in domains that previously required years of training? His answer has not been dismissive of the concern, but it has been generally optimistic. The comparison he returns to is the automobile: we do not think less of people who drive cars rather than walk, even though driving requires much less physical effort than walking. The question is not whether to use the tool but how to use it well.

---

## The Observer and the Field

What distinguishes Karpathy among the leading figures in AI is not merely his technical accomplishment or his teaching ability but the quality of his attention. He notices things. His Twitter and social media posts are frequently cited not because they are provocative but because they identify something real — a pattern in how language models fail, an unexpected capability that emerged from a particular training configuration, a conceptual framing that clarifies something previously murky.

This quality of attention is, in part, a consequence of his particular combination of roles. Having built production systems, he understands the ways in which systems that look impressive on benchmarks fail in deployment. Having taught thousands of students, he understands the ways in which concepts that seem clear to experts are opaque to beginners. Having worked at both academic and industrial scales, he understands the different pressures that shape research in each context. The combination makes him an unusually reliable observer of a field that is moving faster than anyone can fully track.

---

## Key Works & Further Reading

**Primary sources:**
- "The Unreasonable Effectiveness of Recurrent Neural Networks" — Andrej Karpathy (blog post, 2015). The piece that introduced character-level language models to a general technical audience.
- CS231n lecture videos (Stanford, 2016–2017). Available on YouTube; the most widely watched deep learning course in history.
- "Neural Networks: Zero to Hero" — YouTube series (2022–2023). A complete from-scratch implementation of neural networks and language models.
- Tesla AI Day presentation (2021). The most detailed public description of Tesla's vision-based Autopilot architecture.

**Recommended reading:**
- *Deep Learning* — Goodfellow, Bengio, Courville (2016). The standard textbook; Karpathy's courses are the most accessible complement to it.
- *Vehicles: Experiments in Synthetic Psychology* — Valentino Braitenberg (1984). A small classic on how complex behaviour can emerge from simple mechanisms; illuminating context for thinking about what Autopilot is doing.
- *The Information* — James Gleick (2011). Background on the information-theoretic foundations that underlie modern language models.
- *Hackers: Heroes of the Computer Revolution* — Steven Levy (1984). The cultural history of the programming tradition that Karpathy's vibe coding is, in various ways, departing from.
