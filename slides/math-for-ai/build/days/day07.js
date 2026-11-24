// Day 7 — Probability I: reasoning under uncertainty
module.exports = {
  day: 7,
  short: "Probability and Bayes",
  file: "Day-07-Probability-I-Uncertainty-and-Bayes",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Probability I: Reasoning Under Uncertainty",
      subtitle: "Random variables, distributions, expectation, conditioning and Bayes' theorem: the language models use to say how sure they are",
      topics: ["Random variables", "Distributions", "Expectation", "Conditioning", "Bayes"],
      eq: String.raw`p(\theta\mid\mathcal{D})=\frac{p(\mathcal{D}\mid\theta)\,p(\theta)}{p(\mathcal{D})}`,
      notes: "We start the uncertainty block. A classifier does not say this is a cat; it says 92 percent cat. A language model outputs a probability for every possible next token. Data is noisy, labels are wrong sometimes, and we never see the whole population. Probability is the language for all of this. The equation of the day, Bayes' theorem, tells us how to update beliefs when we see data.",
    });
    d.objectives({
      goals: [
        "Define **random variables** and distinguish PMFs from PDFs",
        "Recognise the core **distributions**: Bernoulli, categorical, binomial, uniform, Gaussian",
        "Compute **expectation and variance** and use their rules",
        "Work with **joint, marginal and conditional** probabilities",
        "Apply **Bayes' theorem** and explain why base rates matter",
      ],
      why: "A neural classifier outputs a ==categorical distribution==, a language model a distribution over the next token, a diffusion model a way to sample images. Training losses are derived from probability (Days 8-9).",
      prereq: "Day 1: sums, exp and log. Comfort with fractions.",
      notes: "Ask students where they already use probability: weather forecasts, cricket win predictors, exam guessing. Today formalises those intuitions.",
    });

    d.section("Random variables and distributions");
    d.concept({
      title: "Random variables: numbers produced by chance",
      intuition: [
        "A **random variable** X is a quantity whose value is uncertain until observed",
        "**Discrete**: countable values (coin flip, next token, class label)",
        "**Continuous**: any real value (height, pixel noise, a weight at initialisation)",
        "Its **distribution** says how likely each value is; all probabilities ==sum (or integrate) to 1==",
      ],
      def: String.raw`\begin{aligned}\text{PMF: }&\ p(x)=P(X=x),\quad \textstyle\sum_x p(x)=1\\[4pt]\text{PDF: }&\ P(a\le X\le b)=\int_a^b p(x)\,dx,\quad \int p(x)\,dx=1\end{aligned}`,
      defNote: "A PDF value is a **density**, not a probability: it can exceed 1. Only areas under it are probabilities.",
      notes: "The difference between mass and density confuses many students. For a continuous variable, the probability of any exact value is zero; only intervals have probability. A narrow Gaussian with sigma 0.1 has a peak density of about 4, which is fine because the area is still 1. Write X capital for the random variable and x lower-case for a particular value.",
    });
    d.figure({
      title: "The distributions you will meet most often",
      fig: F("d07_dists"),
      wide: true,
      caption: "Bernoulli: one yes/no.  Categorical: one of K classes (the output of softmax).  Binomial: number of successes in n trials.  Gaussian: the bell curve of noise and initialisation.",
      notes: "Bernoulli is the distribution behind binary classification. Categorical is what every softmax classifier and language model outputs. Binomial counts successes, useful when evaluating accuracy on n test examples. Gaussian is everywhere: weight initialisation, noise in diffusion models, measurement error. Point out how mu shifts the Gaussian and sigma widens it.",
    });
    d.table({
      title: "Distribution cheat sheet",
      head: ["Distribution", "Probability", "Mean", "Variance", "Used in AI for"],
      colW: [2.0, 3.4, 1.3, 1.9, 3.53],
      rows: [
        ["Bernoulli(p)", "p^x (1−p)^(1−x),  x ∈ {0,1}", "p", "p(1−p)", "binary labels, dropout masks"],
        ["Categorical(π)", "P(X = k) = πₖ", "–", "–", "class labels, next-token prediction"],
        ["Binomial(n, p)", "C(n,k) pᵏ(1−p)ⁿ⁻ᵏ", "np", "np(1−p)", "number correct on a test set"],
        ["Uniform(a, b)", "1/(b − a) on [a, b]", "(a+b)/2", "(b−a)²/12", "random init, data augmentation"],
        ["Gaussian(μ, σ²)", "exp(−(x−μ)²/2σ²) / √(2πσ²)", "μ", "σ²", "noise, init, VAEs, diffusion"],
        ["Poisson(λ)", "λᵏe^(−λ)/k!", "λ", "λ", "counts per time unit"],
      ],
      fontSize: 13.5,
      notes: "This is a reference slide. Students should be able to state the mean and variance of Bernoulli and Gaussian from memory. Note that the Bernoulli variance p(1 - p) is largest at p = 0.5, the most uncertain coin. The categorical distribution has no single mean because classes are not numbers.",
    });

    d.section("Expectation and variance");
    d.equation({
      title: "Expectation and variance: centre and spread",
      eq: String.raw`\mathbb{E}[X]=\sum_x x\,p(x)\qquad \mathrm{Var}[X]=\mathbb{E}\big[(X-\mathbb{E}X)^2\big]=\mathbb{E}[X^2]-(\mathbb{E}X)^2`,
      legend: [
        [String.raw`\mathbb{E}[X]`, "probability-weighted average (∫ x p(x) dx if continuous)"],
        [String.raw`\mathbb{E}[aX+b]`, "= a𝔼[X] + b: expectation is linear"],
        [String.raw`\mathbb{E}[X+Y]`, "= 𝔼[X] + 𝔼[Y], always, even if dependent"],
        [String.raw`\mathrm{Var}[aX]`, "= a²Var[X]: scaling squares the spread"],
        [String.raw`\sigma=\sqrt{\mathrm{Var}}`, "standard deviation, same units as X"],
        [String.raw`\mathbb{E}_{x\sim p}[f(x)]`, "average of f when x is drawn from p"],
      ],
      foot: "Every training loss is an expectation: ==𝔼₍ₓ,ᵧ₎~data[ℓ(f(x), y)]==, estimated by averaging over a minibatch.",
      eqSize: 28,
      notes: "The notation E with x drawn from p in the subscript appears in nearly every ML paper. Reading it aloud: the expected value of f(x) when x is sampled from p. Since we cannot compute the true expectation over all possible data, we estimate it with an average over samples, which is exactly what a minibatch loss does. That is why SGD works: the minibatch gradient is an unbiased estimate of the full gradient.",
    });
    d.example({
      title: "Worked example: expected reward of a recommendation",
      problem: "A recommender shows a video. The user skips (reward 0) with probability 0.5, watches part (reward 1) with probability 0.3, watches fully (reward 5) with probability 0.2. Find the mean and variance of the reward R.",
      steps: [
        { eq: String.raw`\mathbb{E}[R]=0(0.5)+1(0.3)+5(0.2)=1.3`, note: "weighted average" },
        { eq: String.raw`\mathbb{E}[R^2]=0+1(0.3)+25(0.2)=5.3`, note: "second moment" },
        { eq: String.raw`\mathrm{Var}[R]=5.3-1.3^2=3.61`, note: "𝔼[X²] − (𝔼X)²" },
        { eq: String.raw`\sigma_R=\sqrt{3.61}=1.9`, note: "spread" },
      ],
      answer: "Mean reward 1.3, std 1.9: a ==noisy signal==. RL (Day 14) maximises exactly such expectations",
      notes: "The standard deviation is larger than the mean, so individual rewards vary a lot. This is why reinforcement learning needs many samples and variance-reduction tricks such as baselines. Ask: if full watches gave reward 10, how would the mean change? To 2.3, by linearity.",
    });

    d.section("Joint, marginal and conditional");
    d.figure({
      title: "Joint, marginal and conditional distributions",
      fig: F("d07_joint"),
      points: [
        { icon: "layers", text: "**Joint** p(x, y): how likely each pair is (the 2-D cloud)" },
        { icon: "filter", text: "**Marginal** p(x) = Σᵧ p(x, y): squash out y (the histograms)" },
        { icon: "search", text: "**Conditional** p(y | x): slice the cloud at one x and renormalise (the red line)" },
      ],
      notes: "The cloud shows height and weight style correlated data. The green histogram on top is the marginal of x, obtained by summing over all y. Conditioning on x = 1 means looking only along the red line: there, y tends to be positive. Supervised learning is exactly learning p(y | x): given the input, what is the distribution of the label?",
    });
    d.compare({
      title: "Three rules that do all the work",
      cols: [
        { head: "Sum rule", icon: "calc", eq: String.raw`p(x)=\textstyle\sum_y p(x,y)`, items: ["Marginalise: remove a variable by summing it out", "Latent-variable models sum over hidden z (Day 13)"] },
        { head: "Product rule", icon: "link", eq: String.raw`p(x,y)=p(y\mid x)\,p(x)`, items: ["Joint = conditional × marginal", "Chain it: p(w₁…wₙ) = Πₜ p(wₜ | w<ₜ), the ==language-model factorisation=="] },
        { head: "Independence", icon: "random", eq: String.raw`p(x,y)=p(x)\,p(y)`, items: ["Knowing x tells nothing about y", "i.i.d. data: examples independent and identically distributed"] },
      ],
      foot: "Conditional probability: ==p(y | x) = p(x, y) / p(x)==. Read the bar '|' as 'given'.",
      notes: "Everything in probabilistic machine learning follows from the sum and product rules. The chain-rule factorisation of a sentence probability is the foundation of autoregressive language models like GPT: predict each token given all previous ones. The i.i.d. assumption lets us write the likelihood of a dataset as a product, which we will use tomorrow for maximum likelihood.",
    });

    d.section("Bayes' theorem");
    d.equation({
      title: "Bayes' theorem: reversing a conditional",
      eq: String.raw`\underbrace{p(H\mid E)}_{\text{posterior}}=\frac{\overbrace{p(E\mid H)}^{\text{likelihood}}\ \overbrace{p(H)}^{\text{prior}}}{\underbrace{p(E)}_{\text{evidence}}},\qquad p(E)=\sum_{H'}p(E\mid H')\,p(H')`,
      legend: [
        [String.raw`p(H)`, "prior: belief before seeing evidence"],
        [String.raw`p(E\mid H)`, "likelihood: how well H explains E"],
        [String.raw`p(H\mid E)`, "posterior: updated belief"],
        [String.raw`p(E)`, "normaliser: makes posteriors sum to 1"],
      ],
      foot: "Posterior ∝ likelihood × prior. Today's posterior is ==tomorrow's prior==: learning is repeated updating.",
      eqSize: 28,
      notes: "Bayes' theorem is just the product rule written two ways and divided. Its power is in reversing a conditional: tests tell us p(positive | disease), but patients want p(disease | positive). In ML, Bayesian inference treats parameters theta as the hypothesis and the dataset as evidence; MAP estimation (Day 8) and Bayesian neural networks start here.",
    });
    const tree = D.graph({
      W: 1240, H: 420,
      nodes: [
        { id: "r", x: 90, y: 210, w: 140, h: 64, label: "10,000 people", fill: P.soft.navy, stroke: "navy", fs: 19 },
        { id: "d", x: 420, y: 100, w: 190, h: 64, label: "100 have disease", sub: "prior 1%", fill: P.soft.coral, stroke: "coral" },
        { id: "h", x: 420, y: 320, w: 190, h: 64, label: "9,900 healthy", sub: "99%", fill: P.soft.green, stroke: "green" },
        { id: "tp", x: 790, y: 50, w: 210, h: 58, label: "99 test positive", sub: "sensitivity 99%", fill: P.soft.coral, stroke: "coral", fs: 19 },
        { id: "fn", x: 790, y: 150, w: 210, h: 50, label: "1 test negative", fill: "white", stroke: "line", fs: 17 },
        { id: "fp", x: 790, y: 270, w: 210, h: 58, label: "495 test positive", sub: "false-positive rate 5%", fill: P.soft.gold, stroke: "gold", fs: 19 },
        { id: "tn", x: 790, y: 370, w: 210, h: 50, label: "9,405 test negative", fill: "white", stroke: "line", fs: 17 },
      ],
      edges: [
        { a: "r", b: "d", color: "coral" }, { a: "r", b: "h", color: "green" },
        { a: "d", b: "tp", color: "coral" }, { a: "d", b: "fn", color: "line" }, { a: "h", b: "fp", color: "gold" }, { a: "h", b: "tn", color: "line" },
      ],
      extraHtml: `<div style="position:absolute;left:1010px;top:120px;width:165px;font-size:19px;color:${P.navy};background:${P.soft.violet};border:2px solid ${P.violet};border-radius:12px;padding:10px 12px;line-height:1.5">Of 594 positives, only <b>99</b> are sick:<br>$\\frac{99}{594}\\approx 16.7\\%$</div>`,
    });
    d.diagram({
      title: "Why base rates matter: a positive test is not 99% bad news",
      diag: tree,
      chips: [
        ["The trap", "Confusing p(positive | disease) = 99% with p(disease | positive)."],
        ["The fix", "Count natural frequencies: the healthy group is so large that its 5% false alarms dominate."],
        ["In AI", "Rare-event detectors (fraud, defects) face the same problem: report precision, not just accuracy."],
      ],
      notes: "Walk the tree with natural frequencies, which make Bayes intuitive. Of 10,000 people, 100 are sick and 99 of them test positive. Of 9,900 healthy people, 5 percent, that is 495, also test positive. So among 594 positives, just 99 are actually sick: 16.7 percent. Doctors and judges routinely get this wrong. In ML evaluation it is the reason we report precision and recall for imbalanced data (Day 15).",
    });
    d.example({
      title: "Worked example: the same answer with Bayes' formula",
      problem: "P(D) = 0.01. P(+ | D) = 0.99. P(+ | not D) = 0.05. Find P(D | +).",
      problemEq: String.raw`P(D\mid +)=\frac{P(+\mid D)P(D)}{P(+)}`,
      steps: [
        { eq: String.raw`P(+\mid D)P(D)=0.99\times0.01=0.0099`, note: "sick and positive" },
        { eq: String.raw`P(+\mid\neg D)P(\neg D)=0.05\times0.99=0.0495`, note: "healthy and positive" },
        { eq: String.raw`P(+)=0.0099+0.0495=0.0594`, note: "sum rule" },
        { eq: String.raw`P(D\mid +)=0.0099/0.0594\approx0.167`, note: "posterior" },
      ],
      answer: "16.7%. A second independent positive test raises it to ==≈ 80%==: the posterior becomes the new prior",
      notes: "For the second test, use prior 0.167: numerator 0.99 times 0.167 = 0.165; healthy branch 0.05 times 0.833 = 0.042; posterior 0.165 / 0.207 = about 0.80. This sequential updating is the essence of Bayesian learning and of filters such as the Kalman filter.",
    });
    d.concept({
      title: "Naive Bayes: a classifier built from Bayes' theorem",
      intuition: [
        "Classify an email as spam using the words it contains",
        "**Naive** assumption: words are independent **given** the class",
        "Then p(words | spam) is a **product** of per-word probabilities",
        "Work in **logs** (Day 1) so the product of many small numbers does not underflow",
      ],
      def: String.raw`\hat y=\arg\max_{c}\Big[\log p(c)+\sum_{i=1}^{n}\log p(w_i\mid c)\Big]`,
      defNote: "Example: p(spam) = 0.4. 'free' appears in 30% of spam vs 2% of ham. The word 'free' alone multiplies the odds of spam by 0.30 / 0.02 = **15×**.",
      notes: "Naive Bayes is a great first model: fast, interpretable, and surprisingly strong on text. Its independence assumption is false, yet it works because ranking classes needs only the relative scores. It also illustrates conditional independence, a key idea in graphical models and in the design of probabilistic models generally.",
    });
    d.code({
      title: "Probability by simulation: let the computer check your math",
      code: `import numpy as np
rng = np.random.default_rng(0)

# expectation by sampling (Monte Carlo)
r = rng.choice([0, 1, 5], size=1_000_000, p=[.5, .3, .2])
print(r.mean(), r.var())          # ~1.30, ~3.61

# Bayes' theorem by simulation
n = 1_000_000
sick = rng.random(n) < 0.01
pos = np.where(sick, rng.random(n) < 0.99,
                     rng.random(n) < 0.05)
print(sick[pos].mean())           # ~0.167

# sampling the distributions of the day
rng.binomial(10, 0.3, size=5)
rng.normal(loc=0, scale=1, size=(3, 4))  # Gaussian init
logits = np.array([2.0, 1.0, 0.1])
p = np.exp(logits) / np.exp(logits).sum()
rng.choice(3, p=p)                # sample a class/token`,
      points: [
        "**Monte Carlo**: estimate an expectation by averaging many samples",
        "Simulating the medical test reproduces Bayes' answer of 16.7%",
        "Sampling a token from softmax probabilities is how **LLMs generate text**",
        "When a derivation surprises you, ==simulate it== before arguing",
      ],
      fontSize: 12.5,
      notes: "Monte Carlo estimation is one of the most useful research tools: if you are unsure of a probability calculation, simulate it. The final lines preview Day 9 and Day 13: language models turn logits into probabilities with softmax and then sample.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathcal{L}(\theta)=\mathbb{E}_{(\mathbf{x},y)\sim p_{\text{data}}}\big[\ell(f_\theta(\mathbf{x}),y)\big]`, read: "The loss is the **expected error** over the data distribution, estimated by a minibatch average." },
        { eq: String.raw`p_\theta(y\mid\mathbf{x})=\mathrm{softmax}(f_\theta(\mathbf{x}))_y`, read: "The network outputs a **categorical distribution** over classes given the input." },
        { eq: String.raw`p(\mathbf{x})=\int p(\mathbf{x}\mid\mathbf{z})\,p(\mathbf{z})\,d\mathbf{z}`, read: "Data is generated from a hidden **latent** z; sum (integrate) it out to get p(x). Basis of VAEs and diffusion." },
        { eq: String.raw`\mathbf{x}^{(i)}\overset{\text{i.i.d.}}{\sim}p_{\text{data}}`, read: "Each training example is drawn **independently** from the same distribution." },
      ],
      notes: "Row 3 is the sum rule for continuous variables and will be the starting point of Day 13 on generative models. Row 4 is an assumption worth questioning in research: real datasets often have duplicates, distribution shift and correlated samples.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "A fair die is rolled. Find 𝔼[X], 𝔼[X²] and Var[X]." },
        { lvl: "Warm-up", text: "P(rain) = 0.3, P(traffic | rain) = 0.8, P(traffic | no rain) = 0.2. Find P(traffic)." },
        { lvl: "Core", text: "Using problem 2, find P(rain | traffic) with Bayes' theorem." },
        { lvl: "Core", text: "A model gets each of 100 test items right independently with p = 0.9. What are the mean and std of the number correct? Why does this matter when comparing models?" },
        { lvl: "Code", text: "Simulate 10⁶ rolls of two dice. Estimate P(sum = 7) and P(first die = 6 | sum = 7). Compare with exact values." },
        { lvl: "Challenge", text: "Prove Var[X + Y] = Var[X] + Var[Y] + 2Cov[X, Y]. When does the variance of an average of n i.i.d. variables equal σ²/n?" },
      ],
      notes: "Answers: 1) 3.5, 91/6 = 15.17, 35/12 = 2.92. 2) 0.24 + 0.14 = 0.38. 3) 0.24 / 0.38 = 0.63. 4) binomial: mean 90, std sqrt(9) = 3; two models differing by 2 points on 100 items may not be truly different (Day 15). 5) 1/6 and 1/6. 6) expand the square; independence makes covariance zero, giving sigma squared over n, the reason averaging reduces noise.",
    });
    d.recap({
      points: [
        "Random variables have distributions: PMF for discrete, **PDF (density)** for continuous",
        "Know Bernoulli, categorical, binomial, uniform, **Gaussian**",
        "𝔼 is linear; Var[X] = 𝔼[X²] − (𝔼X)²; ==every loss is an expectation==",
        "Sum rule, product rule, independence; p(y | x) = p(x, y)/p(x)",
        "**Bayes**: posterior ∝ likelihood × prior; never ignore the base rate",
      ],
      next: "Probability II and statistics",
      nextTopics: ["Multivariate Gaussians and covariance", "Law of large numbers and CLT", "Maximum likelihood (MLE) and MAP", "Bias–variance trade-off"],
      notes: "Tomorrow we connect probability to learning: given data, how do we choose the parameters of a distribution? The answer, maximum likelihood, turns out to be the principle behind almost every loss function in deep learning.",
    });
  },
};
