// Day 8 — Probability II and statistics: from data to parameters
module.exports = {
  day: 8,
  short: "Statistics, MLE and MAP",
  file: "Day-08-Probability-II-Statistics-MLE-and-MAP",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Probability II: Statistics, MLE and MAP",
      subtitle: "How data pins down parameters, why averages are trustworthy, and where every loss function comes from",
      topics: ["Covariance", "Gaussians", "CLT", "MLE", "MAP", "Bias–variance"],
      eq: String.raw`\hat\theta_{\text{MLE}}=\arg\max_\theta\sum_{i}\log p_\theta(\mathbf{x}^{(i)})`,
      notes: "Yesterday we had distributions with known parameters. Today we flip the question: given data, which parameters are most plausible? That is statistics. The answer, maximum likelihood, explains where mean squared error and cross-entropy come from. We also learn why averaging works (law of large numbers and central limit theorem) and the bias-variance trade-off behind overfitting.",
    });
    d.objectives({
      goals: [
        "Compute **covariance and correlation** and read a covariance matrix",
        "Interpret the **multivariate Gaussian** and its ellipses",
        "State the **law of large numbers** and **central limit theorem**, and compute a standard error",
        "Derive **maximum-likelihood** estimates and show MSE and cross-entropy are MLE",
        "Explain **MAP** as regularisation and the **bias–variance** trade-off",
      ],
      why: "Maximum likelihood is ==the principle behind nearly every loss in deep learning==. The CLT is why we can trust a validation score, and bias–variance explains overfitting.",
      prereq: "Day 7: expectation, variance, Bayes. Day 4: eigenvectors (for covariance).",
      notes: "Tell students this is the day where loss functions stop being arbitrary formulas and become consequences of a single principle.",
    });

    d.section("Covariance and the Gaussian");
    d.concept({
      title: "Covariance and correlation: do two variables move together?",
      intuition: [
        "**Covariance** > 0: when X is above its mean, Y tends to be too",
        "Covariance depends on units; **correlation** ρ rescales it to [−1, 1]",
        "ρ = 0 means no **linear** relation, not necessarily independence",
        "The **covariance matrix** Σ collects all pairs; it is symmetric and PSD, so ==PCA (Day 4) diagonalises it==",
      ],
      def: String.raw`\begin{aligned}\mathrm{Cov}[X,Y]&=\mathbb{E}\big[(X-\mu_X)(Y-\mu_Y)\big]\\ \rho_{XY}&=\frac{\mathrm{Cov}[X,Y]}{\sigma_X\sigma_Y}\in[-1,1]\\ \Sigma&=\mathbb{E}\big[(\mathbf{x}-\boldsymbol\mu)(\mathbf{x}-\boldsymbol\mu)^{\top}\big]\end{aligned}`,
      defNote: "Diagonal of Σ = variances. Off-diagonal = covariances. Example: Y = X² with X symmetric around 0 has ρ = 0 yet Y is fully determined by X.",
      notes: "The Y = X squared example is the classic warning that zero correlation does not imply independence. The covariance matrix is the outer product of the centred vector with itself, averaged. Because it is symmetric and positive semi-definite, its eigenvectors are the principal components we met on Day 4.",
    });
    d.equation({
      title: "The multivariate Gaussian",
      eq: String.raw`\mathcal{N}(\mathbf{x}\mid\boldsymbol\mu,\Sigma)=\frac{1}{\sqrt{(2\pi)^d\det\Sigma}}\exp\!\Big(-\tfrac12(\mathbf{x}-\boldsymbol\mu)^{\top}\Sigma^{-1}(\mathbf{x}-\boldsymbol\mu)\Big)`,
      legend: [
        [String.raw`\boldsymbol\mu\in\mathbb{R}^d`, "centre of the cloud"],
        [String.raw`\Sigma\in\mathbb{R}^{d\times d}`, "shape and orientation (covariance)"],
        [String.raw`(\mathbf{x}-\boldsymbol\mu)^{\top}\Sigma^{-1}(\mathbf{x}-\boldsymbol\mu)`, "squared Mahalanobis distance"],
        [String.raw`\det\Sigma`, "volume of the cloud (normaliser)"],
      ],
      foot: "Linear algebra + probability in one formula: ==Σ's eigenvectors are the ellipse axes, √λ their lengths==.",
      eqSize: 28,
      notes: "Break the formula into pieces. The exponent is a quadratic form, a distance that accounts for spread and correlation: the Mahalanobis distance. The front factor just makes the total probability 1. With Sigma equal to sigma squared times the identity, the exponent becomes the squared Euclidean distance divided by 2 sigma squared, which is the link between Gaussians and squared error.",
    });
    d.figure({
      title: "What Σ does to the shape of the data",
      fig: F("d08_gauss2d"),
      wide: true,
      caption: "Red ellipses: 1σ and 2σ contours. Left: identity covariance gives circles. Middle: different variances stretch the axes. Right: correlation tilts the ellipse along an eigenvector of Σ.",
      notes: "Point out the eigenvector picture from Day 4: the ellipse axes are the eigenvectors of Sigma and their half-lengths are proportional to the square roots of the eigenvalues. Diffusion models and VAEs mostly use diagonal covariances for efficiency, which corresponds to the middle panel.",
    });

    d.section("Why averages work");
    d.figure({
      title: "Central limit theorem: averages become Gaussian",
      fig: F("d08_clt"),
      wide: true,
      caption: "Draw from a very skewed (exponential) distribution and average n samples. As n grows the average becomes bell-shaped (red) and narrower, with spread σ/√n.",
      notes: "Start with a heavily skewed distribution. The mean of 2 samples is still skewed, the mean of 5 is close to Gaussian, and the mean of 30 is very close and much narrower. The law of large numbers says the average converges to the true mean; the central limit theorem says how: approximately Gaussian with standard deviation sigma over root n. This is why minibatch gradients are well behaved and why we can put error bars on test accuracy.",
    });
    d.equation({
      title: "LLN, CLT and the standard error",
      eq: String.raw`\bar X_n=\frac1n\sum_{i=1}^nX_i\ \xrightarrow{\ n\to\infty\ }\ \mu,\qquad \bar X_n\ \approx\ \mathcal{N}\!\Big(\mu,\ \frac{\sigma^2}{n}\Big)`,
      legend: [
        [String.raw`\bar X_n`, "sample mean of n i.i.d. draws"],
        [String.raw`\sigma/\sqrt{n}`, "standard error: uncertainty of the mean"],
        [String.raw`\pm1.96\,\sigma/\sqrt n`, "95% confidence interval for μ"],
        [String.raw`4\times n`, "needed to halve the error (√n law)"],
      ],
      foot: "Accuracy 85% on 1,000 test items: SE = √(0.85·0.15/1000) ≈ 1.1%, so the 95% CI is ==85% ± 2.2%==.",
      notes: "The square-root law is sobering: to halve your uncertainty, you need four times as much data. Apply it to model evaluation: on a 1,000-item test set, a 1 percent improvement is within noise. Day 15 builds on this with significance tests and bootstrapping.",
    });

    d.section("Maximum likelihood");
    d.concept({
      title: "Maximum likelihood: choose parameters that make the data least surprising",
      intuition: [
        "The **likelihood** L(θ) = p(data | θ) scores how well θ explains what we saw",
        "With i.i.d. data the likelihood is a **product** over examples",
        "Take **logs** (Day 1): product becomes sum, and the maximiser is unchanged",
        "Maximising log-likelihood = ==minimising negative log-likelihood (NLL)==, our loss",
      ],
      def: String.raw`\begin{aligned}L(\theta)&=\prod_{i=1}^{N}p_\theta(\mathbf{x}^{(i)})\\ \hat\theta_{\text{MLE}}&=\arg\max_\theta\ \sum_{i=1}^{N}\log p_\theta(\mathbf{x}^{(i)})\\&=\arg\min_\theta\ -\tfrac1N\textstyle\sum_i\log p_\theta(\mathbf{x}^{(i)})\end{aligned}`,
      defNote: "Likelihood is a function of θ with the data fixed. It is **not** a probability distribution over θ.",
      notes: "Emphasise the change of viewpoint: p(x given theta) as a function of x is a distribution; as a function of theta with x fixed it is the likelihood. Dividing by N does not change the argmax but makes the loss an average, comparable across dataset sizes. Every time you train with negative log-likelihood or cross-entropy, you are doing maximum likelihood.",
    });
    d.figure({
      title: "MLE for a coin: 7 heads in 10 flips",
      fig: F("d08_mle"),
      points: [
        { icon: "target", text: "Likelihood peaks at **p̂ = 0.7** = 7/10" },
        { icon: "chart", text: "Log-likelihood has the **same peak**, with friendlier numbers" },
        { icon: "calc", text: "Set derivative to 0: 7/p − 3/(1−p) = 0 → p = 0.7" },
      ],
      notes: "The likelihood values are tiny, around 0.002, and with thousands of flips they would underflow; the log-likelihood stays in a sensible range. The derivative of 7 log p + 3 log (1 - p) is 7 over p minus 3 over 1 - p; setting it to zero gives p = 0.7. The MLE of a Bernoulli parameter is simply the observed frequency, which matches intuition.",
    });
    d.example({
      title: "Worked example: MLE of a Gaussian's mean and variance",
      problem: "Data: 2, 4, 4, 5, 5. Assume xᵢ ~ 𝒩(μ, σ²) i.i.d. Find the maximum-likelihood estimates of μ and σ².",
      problemEq: String.raw`\log L=-\tfrac N2\log(2\pi\sigma^2)-\tfrac{1}{2\sigma^2}\textstyle\sum_i(x_i-\mu)^2`,
      steps: [
        { eq: String.raw`\tfrac{\partial\log L}{\partial\mu}=\tfrac{1}{\sigma^2}\textstyle\sum_i(x_i-\mu)=0\Rightarrow\hat\mu=\bar x`, note: "MLE mean = sample mean" },
        { eq: String.raw`\hat\mu=\tfrac{2+4+4+5+5}{5}=4`, note: "numbers" },
        { eq: String.raw`\hat\sigma^2=\tfrac1N\textstyle\sum_i(x_i-\hat\mu)^2=\tfrac{4+0+0+1+1}{5}=1.2`, note: "MLE variance" },
        { eq: String.raw`\text{maximising over }\mu\ \Leftrightarrow\ \text{minimising }\textstyle\sum_i(x_i-\mu)^2`, note: "squared error appears!" },
      ],
      answer: "Estimates: mean 4, variance 1.2. ==Gaussian noise ⇒ MLE is least squares==. (Unbiased variance divides by N − 1: 1.5)",
      notes: "Point to the last step: the only part of the log-likelihood that depends on mu is minus the sum of squared errors. So assuming Gaussian noise and doing maximum likelihood is the same as minimising mean squared error. The MLE variance divides by N and is slightly biased low; dividing by N - 1 gives the unbiased estimate. This is a nice first example of bias.",
    });
    d.compare({
      title: "Two famous losses are maximum likelihood in disguise",
      cols: [
        { head: "Regression → MSE", icon: "chart", eq: String.raw`y\sim\mathcal{N}(f_\theta(\mathbf{x}),\sigma^2)\ \Rightarrow\ -\log p=\tfrac{(y-f_\theta(\mathbf{x}))^2}{2\sigma^2}+c`, eqH: 1.1, items: ["Assume Gaussian noise around the prediction", "NLL = squared error up to constants", "Laplace noise instead → **L1 (MAE)** loss, robust to outliers"] },
        { head: "Classification → cross-entropy", icon: "layers", eq: String.raw`y\sim\mathrm{Cat}(\mathrm{softmax}(f_\theta(\mathbf{x})))\ \Rightarrow\ -\log p=-\log\hat p_y`, eqH: 1.1, items: ["Assume a categorical distribution over classes", "NLL = −log of the probability given to the true class", "Same loss trains every LLM, one token at a time (Day 9)"] },
      ],
      foot: "Choosing a loss = choosing a ==noise model for your data==. Mismatched assumptions show up as poor calibration.",
      notes: "This is the key insight of the day. Losses are not arbitrary: they encode what you believe about the noise. Ask: if your data has outliers, which noise model is more appropriate? Laplace, with heavier tails, giving L1 loss. This viewpoint lets researchers design new losses, for example for count data use a Poisson likelihood.",
    });
    d.compare({
      title: "MAP: add a prior, get regularisation",
      cols: [
        { head: "MLE", icon: "target", eq: String.raw`\arg\max_\theta\ \log p(\mathcal{D}\mid\theta)`, items: ["Uses only the data", "Can **overfit** with little data or many parameters"] },
        { head: "MAP", icon: "balance", eq: String.raw`\arg\max_\theta\ \log p(\mathcal{D}\mid\theta)+\log p(\theta)`, items: ["Bayes: posterior ∝ likelihood × prior", "Prior encodes a preference, e.g. small weights"] },
        { head: "Priors = penalties", icon: "filter", eq: String.raw`\theta\sim\mathcal{N}(0,\tau^2)\Rightarrow\lambda\|\theta\|_2^2`, items: ["Gaussian prior → **L2 / weight decay**", "Laplace prior → **L1 / sparsity**", "λ = strength of belief (≈ σ²/τ²)"] },
      ],
      notes: "Write the derivation briefly: log of a Gaussian prior on theta is minus norm of theta squared over 2 tau squared plus a constant. Adding it to the log-likelihood and flipping the sign gives the familiar loss plus lambda times the squared L2 norm. So weight decay is a Gaussian prior, and L1 regularisation is a Laplace prior. Full Bayesian methods go further and keep the whole posterior rather than its peak.",
    });

    d.section("Bias and variance");
    d.figure({
      title: "Bias–variance: too simple, just right, too flexible",
      fig: F("d08_biasvar"),
      wide: true,
      caption: "Dashed: the true function. Blue: 15 noisy samples. A straight line cannot bend (high bias); a degree-14 polynomial threads every noisy point and swings wildly between them (high variance).",
      notes: "The left model would make the same systematic error on any dataset: bias. The right model fits this particular noise and would look completely different on another sample of 15 points: variance. The middle model balances them. Modern deep networks are hugely overparameterised yet generalise, a phenomenon called double descent; regularisation, data size and the implicit bias of SGD all play a part.",
    });
    d.equation({
      title: "The bias–variance decomposition of squared error",
      eq: String.raw`\mathbb{E}\big[(y-\hat f(\mathbf{x}))^2\big]=\underbrace{\big(f(\mathbf{x})-\mathbb{E}\hat f(\mathbf{x})\big)^2}_{\text{bias}^2}+\underbrace{\mathrm{Var}\big[\hat f(\mathbf{x})\big]}_{\text{variance}}+\underbrace{\sigma^2}_{\text{noise}}`,
      legend: [
        [String.raw`\text{bias}^2`, "error of the average model: too simple"],
        [String.raw`\text{variance}`, "how much the model changes with the training set"],
        [String.raw`\sigma^2`, "irreducible noise in the labels"],
        [String.raw`\mathbb{E}`, "over random training sets and noise"],
      ],
      foot: "More data cuts variance; more capacity cuts bias; regularisation and ensembling ==trade one for the other==.",
      eqSize: 26,
      notes: "The expectation is over many hypothetical training sets. Bias measures how far the average fitted model is from the truth; variance measures how much individual fits scatter around that average. Ensembles reduce variance by averaging (the CLT again). In research, this decomposition guides whether to collect more data, enlarge the model or regularise.",
    });
    d.code({
      title: "Estimation in code: MLE, standard errors and bootstrap",
      code: `import numpy as np
rng = np.random.default_rng(0)

x = np.array([2, 4, 4, 5, 5.])
mu_hat = x.mean()                 # 4.0
var_mle = x.var()                 # 1.2  (divide by N)
var_unb = x.var(ddof=1)           # 1.5  (divide by N-1)

# standard error of a test accuracy
correct = rng.random(1000) < 0.85
acc = correct.mean()
se = np.sqrt(acc * (1 - acc) / len(correct))
print(f"{acc:.3f} +/- {1.96*se:.3f}")

# bootstrap: resample the test set with replacement
boot = [rng.choice(correct, len(correct)).mean()
        for _ in range(2000)]
print(np.percentile(boot, [2.5, 97.5]))

# MSE is Gaussian NLL up to a constant
y, f = rng.normal(size=100), rng.normal(size=100)
nll = 0.5*np.log(2*np.pi) + 0.5*(y - f)**2
print(nll.mean() - 0.5*np.mean((y-f)**2))  # constant`,
      points: [
        "ddof=1 gives the **unbiased** variance; NumPy defaults to the MLE",
        "Always report accuracy **with an interval**, e.g. 0.85 ± 0.02",
        "The **bootstrap** gets intervals for any metric without formulas",
        "The last line confirms MSE and Gaussian NLL differ by a ==constant==",
      ],
      fontSize: 12,
      notes: "The bootstrap deserves emphasis because it works for metrics like F1 or BLEU where no simple formula exists: resample the test set with replacement many times and look at the spread of the metric. We will use it again on Day 15.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathcal{L}_{\text{NLL}}(\theta)=-\frac1N\sum_{i=1}^N\log p_\theta\big(y^{(i)}\mid\mathbf{x}^{(i)}\big)`, read: "Train by **maximum likelihood**: minimise the average negative log-probability of the correct labels." },
        { eq: String.raw`\hat\theta_{\text{MAP}}=\arg\max_\theta\ \log p(\mathcal{D}\mid\theta)+\log p(\theta)`, read: "MAP adds a **prior**; with a Gaussian prior this is weight decay." },
        { eq: String.raw`\text{Acc}=84.3\pm0.4\ \ (\text{mean}\pm\text{std over 5 seeds})`, read: "Results report **variability** across random seeds; compare differences against it." },
        { eq: String.raw`\boldsymbol\epsilon\sim\mathcal{N}(\mathbf{0},I),\ \ \mathbf{x}=\boldsymbol\mu+\sigma\boldsymbol\epsilon`, read: "Sample a Gaussian by **scaling and shifting standard noise**: used in VAEs and diffusion (Day 13)." },
      ],
      notes: "Row 3 is a reading skill: a 0.3-point gain with a standard deviation of 0.4 across seeds is not convincing. Row 4 is the reparameterisation trick in miniature, which makes sampling differentiable; it is central to Day 13.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "For pairs (1, 2), (2, 4), (3, 7), compute Cov[X, Y] and ρ." },
        { lvl: "Warm-up", text: "A test set of 400 items gives 90% accuracy. Compute the standard error and a 95% interval." },
        { lvl: "Core", text: "Derive the MLE of λ for Poisson data k₁, …, kₙ. (Hint: log p = k log λ − λ − log k!)" },
        { lvl: "Core", text: "Show that a Laplace prior p(θ) ∝ exp(−|θ|/b) turns MAP into L1-regularised loss. What is λ?" },
        { lvl: "Code", text: "Fit polynomials of degree 1 to 15 to 20 noisy points of sin(2πx). Plot train vs validation MSE and identify under- and over-fitting." },
        { lvl: "Research", text: "Find a paper reporting a 0.5% gain. Did they report seeds or confidence intervals? Is the gain significant?" },
      ],
      notes: "Answers: 1) means 2 and 4.33; population covariance = (2.33 + 0 + 2.67)/3 = 1.67; rho is about 0.99. 2) SE = sqrt(0.9 times 0.1 / 400) = 0.015, interval 90 plus or minus 2.9 percent. 3) lambda-hat = mean of the k's. 4) negative log prior = |theta| / b, so lambda = 1 / b per parameter. 5) validation error is U-shaped. 6) open discussion.",
    });
    d.recap({
      points: [
        "Covariance matrix Σ: symmetric, PSD; ellipse axes = its eigenvectors",
        "**LLN** + **CLT**: sample means converge, with standard error σ/√n",
        "**MLE** = minimise NLL; Gaussian noise → MSE, categorical → ==cross-entropy==",
        "**MAP** = MLE + log prior: Gaussian prior → L2, Laplace prior → L1",
        "Test error = bias² + variance + noise; capacity and data trade them off",
      ],
      next: "Information theory",
      nextTopics: ["Entropy and surprise", "Cross-entropy and KL divergence", "Softmax and temperature", "Mutual information and perplexity"],
      notes: "Tomorrow we see the same cross-entropy loss from a completely different angle, information theory, and learn KL divergence, the distance-like measure behind VAEs, distillation and RLHF.",
    });
  },
};
