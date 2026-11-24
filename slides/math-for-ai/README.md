# Mathematics for AI: a 15-day lecture program

PowerPoint decks for Shikhar Dubey's Leapverse course. It starts from the notation of AI papers and ends with the math needed to read, run and publish research. Each day is one deck of about 18 slides, built so the lecture can be taught from the slides alone:

- intuition next to the formal definition on every concept slide
- equations typeset with KaTeX (LaTeX quality), architecture and flow diagrams, and plots
- worked examples with real numbers, step by step
- a NumPy/PyTorch slide, a "how it looks in a research paper" slide, six practice problems and a recap
- speaker notes on every slide, including answers to the practice problems

Open the decks in `decks/`. Press the notes view in PowerPoint to see what to say on each slide.

## Syllabus

| Day | Deck | Topics |
|---|---|---|
| 1 | The language of AI math | notation, sets, functions, Σ/Π, exp and log, sigmoid, models as functions |
| 2 | Vectors and the geometry of data | vectors, dot product, norms, cosine similarity, embeddings, projection |
| 3 | Matrices, transformations and layers | linear maps, matrix multiply, shapes, dense layers, determinant, inverse, rank |
| 4 | Eigenvalues, SVD and PCA | eigenvectors, spectral theorem, SVD, low rank, PCA, LoRA |
| 5 | Calculus I: derivatives and gradients | derivatives, rules, chain rule, partials, gradient, gradient check |
| 6 | Calculus II: Jacobians and backpropagation | multivariable chain rule, Jacobian, Hessian, Taylor, computational graphs, autodiff |
| 7 | Probability I | random variables, distributions, expectation, variance, conditional probability, Bayes |
| 8 | Probability II and statistics | Gaussians, covariance, LLN/CLT, MLE, MAP, bias–variance |
| 9 | Information theory | entropy, cross-entropy, KL divergence, mutual information, softmax, perplexity |
| 10 | Optimization | convexity, GD/SGD, momentum, Adam, schedules, regularization, Lagrange multipliers |
| 11 | The math of neural networks | MLPs, activations, losses, full backprop, initialization, normalization, residuals |
| 12 | Attention and transformers | convolution, attention, scaling by √d, multi-head, positional encodings, the transformer block |
| 13 | Generative models | autoencoders, VAE and ELBO, GANs, diffusion, normalizing flows, sampling |
| 14 | Reinforcement learning | MDPs, returns, Bellman equations, Q-learning, policy gradients, PPO, RLHF and DPO |
| 15 | Research math: experiments and evaluation | metrics, confidence intervals, significance tests, ablations, scaling laws, writing math |

## Rebuilding the decks

The decks are generated, so edit the sources and rebuild rather than editing the .pptx by hand.

```bash
cd slides/math-for-ai/build
npm install                      # pptxgenjs, katex, sharp, react-icons
pip install matplotlib numpy     # for the plots
python3 figures.py               # plots -> build/fig/
node build.js                    # all decks -> decks/   (or: node build.js 3 to rebuild Day 3)
```

Equation and diagram rendering needs Playwright with Chromium (`npm install playwright && npx playwright install chromium` if it is not already on the machine).

| File | What it holds |
|---|---|
| `build/days/dayNN.js` | the content of each day: slide text, LaTeX, diagrams, speaker notes |
| `build/lib.js` | the design system: Leapverse colours, slide layouts and slide components |
| `build/diagrams.js` | helpers for flow diagrams, neural-network drawings and matrix grids |
| `build/render.js` | turns LaTeX and diagrams into crisp transparent PNGs (KaTeX in headless Chromium) |
| `build/figures.py` | matplotlib plots in the brand palette |
| `build/qa.sh` | renders a deck to contact sheets for a visual check |
