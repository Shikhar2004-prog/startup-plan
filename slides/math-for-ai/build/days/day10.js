// Day 10 — Optimization
module.exports = {
  day: 10,
  short: "Optimization",
  file: "Day-10-Optimization-SGD-Momentum-Adam",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Optimization: How Models Actually Learn",
      subtitle: "Convexity, gradient descent, SGD, momentum, Adam, learning-rate schedules, regularisation and constraints",
      topics: ["Convexity", "Gradient descent", "SGD", "Momentum", "Adam", "Schedules"],
      eq: String.raw`\theta_{t+1}=\theta_t-\eta\,\frac{\hat{\mathbf{m}}_t}{\sqrt{\hat{\mathbf{v}}_t}+\epsilon}`,
      notes: "We have a model, a loss and gradients. Today we study the algorithms that use gradients to actually reduce the loss. The equation of the day is the Adam update, used to train almost every large model today. By the end of the session students should understand every symbol in it and the practical knobs: learning rate, batch size, warm-up and weight decay.",
    });
    d.objectives({
      goals: [
        "Formulate training as an **optimisation problem** and recognise **convexity**",
        "Explain the **learning rate** and the stability limit η < 2/λmax",
        "Contrast full-batch GD with **SGD** and minibatches",
        "Derive **momentum** and **Adam** and compute one Adam step by hand",
        "Use **schedules**, weight decay (AdamW) and **Lagrange multipliers**",
      ],
      why: "Choosing the optimiser and learning rate is often ==the difference between a model that trains and one that diverges==. Optimisation papers are among the most cited in ML (Adam has 200k+ citations).",
      prereq: "Day 5 (gradient), Day 6 (Hessian, Taylor), Day 8 (averages, CLT).",
      notes: "This is the most practical day so far: every idea maps to an argument of torch.optim. Keep linking to students' future experiments.",
    });

    d.section("The landscape");
    d.equation({
      title: "Training is an optimisation problem",
      eq: String.raw`\theta^{*}=\arg\min_{\theta\in\mathbb{R}^{P}}\ \underbrace{\frac1N\sum_{i=1}^N\ell\big(f_\theta(\mathbf{x}^{(i)}),y^{(i)}\big)}_{\text{empirical risk}}+\underbrace{\lambda\,R(\theta)}_{\text{regulariser}}`,
      legend: [
        [String.raw`P`, "number of parameters: millions to trillions"],
        [String.raw`\ell`, "per-example loss: MSE, cross-entropy (Days 8-9)"],
        [String.raw`R(\theta)`, "penalty such as ‖θ‖² (MAP prior, Day 8)"],
        [String.raw`\lambda`, "regularisation strength, a hyperparameter"],
      ],
      foot: "We minimise loss on training data but care about ==test== performance: optimisation and generalisation are different goals.",
      notes: "This is empirical risk minimisation. We cannot compute the expected loss over the true data distribution, so we minimise the average over the training set and hope it generalises. Students should recognise each part from earlier days. Emphasise the foot: a perfect optimiser that memorises noise is not what we want, which is why regularisation and early stopping exist.",
    });
    d.figure({
      title: "Convex vs non-convex: one valley or many",
      fig: F("d10_convex"),
      points: [
        { icon: "check", text: "**Convex**: any local minimum is the global minimum; GD provably finds it" },
        { icon: "mountain", text: "**Non-convex** (neural nets): many minima and saddles; no guarantees" },
        { icon: "bulb", text: "Yet in practice, wide nets reach ==good minima== reliably" },
      ],
      notes: "Linear regression, logistic regression and SVMs are convex, which is why they come with clean guarantees. Neural network losses are non-convex because of the products of weights across layers and the non-linear activations. Surprisingly, in very high dimensions most local minima found by SGD have similar, low loss; the hard parts are saddles and badly conditioned regions.",
    });
    d.concept({
      title: "Convexity: the formal definition and tests",
      intuition: [
        "The **chord** between any two points lies above the curve",
        "Equivalently the function lies **above its tangent** lines",
        "Twice differentiable: convex ⇔ Hessian **positive semi-definite** everywhere",
        "Sums of convex functions are convex: ==MSE + L2 is convex== for linear models",
      ],
      def: String.raw`f\big(\lambda\mathbf{x}+(1-\lambda)\mathbf{y}\big)\le\lambda f(\mathbf{x})+(1-\lambda)f(\mathbf{y}),\quad\lambda\in[0,1]`,
      defNote: "Examples: x², eˣ, −log x, ‖x‖, log-sum-exp are convex. sin x, x³ and almost every deep-network loss are not.",
      eqSize: 22,
      notes: "Connect to Day 6: the Hessian of least squares is 2 X transpose X, positive semi-definite, so least squares is convex. The cross-entropy loss of logistic regression is also convex in the weights. These facts are why classical ML has strong theory and deep learning relies more on experiments.",
    });

    d.section("Gradient descent and SGD");
    d.figure({
      title: "The learning rate: the most important hyperparameter",
      fig: F("d10_lr"),
      wide: true,
      caption: "Minimising f(x) = x² from x = 2.8. Too small: crawls. Well chosen: converges in a few steps. Too large (η > 1 here, since 2/λ = 2/2): overshoots further each step and diverges.",
      notes: "For f = x squared the update is x times (1 - 2 eta). If eta is 0.05 the factor is 0.9, slow. If eta is 0.3 the factor is 0.4, fast. If eta exceeds 1 the factor is below -1, so each step flips sign and grows: divergence. In general the limit is 2 over the largest Hessian eigenvalue, from Day 6. When your loss becomes NaN, the learning rate is the first suspect.",
    });
    d.compare({
      title: "Full-batch GD vs stochastic and minibatch gradient descent",
      cols: [
        { head: "Full-batch GD", icon: "layers", eq: String.raw`\mathbf{g}=\tfrac1N\textstyle\sum_{i=1}^N\nabla\ell_i`, items: ["Exact gradient, smooth path", "One step costs a pass over **all N** examples", "Impossible for web-scale data"] },
        { head: "Minibatch SGD", icon: "random", eq: String.raw`\hat{\mathbf{g}}=\tfrac1B\textstyle\sum_{i\in\mathcal{B}}\nabla\ell_i`, items: ["**Unbiased** estimate: 𝔼[ĝ] = g", "Noise std ∝ 1/√B (CLT, Day 8)", "Many cheap noisy steps beat few exact ones"] },
        { head: "Noise is a feature", icon: "bolt", items: ["Helps **escape saddles** and sharp minima", "Larger B → less noise; often scale η with B", "One **epoch** = one pass over the data"] },
      ],
      foot: "Batch size B and learning rate η interact: a common rule of thumb is ==linear scaling: double B, double η== (with warm-up).",
      notes: "The minibatch gradient is an average of B independent per-example gradients, so by the CLT its noise shrinks like one over root B. That noise is useful: it adds exploration and is linked to finding flatter minima that generalise better. The linear scaling rule comes from Goyal et al. 2017, who trained ImageNet in one hour with batch 8192.",
    });
    d.figure({
      title: "Three optimisers on the same ill-conditioned valley",
      fig: F("d10_optim"),
      points: [
        { icon: "warn", text: "**GD** zig-zags across the steep direction and crawls along the flat one" },
        { icon: "bolt", text: "**Momentum** builds speed along the valley floor, damping the zig-zag" },
        { icon: "compass", text: "**Adam** rescales each coordinate, taking a near-straight path" },
      ],
      notes: "The valley is 12 times steeper in y than in x, condition number 12. Plain gradient descent must use a learning rate small enough for the steep direction, so it is slow in the flat one. Momentum accumulates the consistent x component and cancels the alternating y component. Adam divides by a running estimate of each coordinate's gradient size, so both directions take similar-sized steps.",
    });
    d.equation({
      title: "Momentum: a heavy ball rolling downhill",
      eq: String.raw`\mathbf{v}_{t}=\beta\,\mathbf{v}_{t-1}+\nabla\mathcal{L}(\theta_t),\qquad \theta_{t+1}=\theta_t-\eta\,\mathbf{v}_t`,
      legend: [
        [String.raw`\mathbf{v}_t`, "velocity: running sum of past gradients"],
        [String.raw`\beta\approx0.9`, "friction: how much history is kept"],
        [String.raw`\tfrac{1}{1-\beta}`, "effective memory ≈ 10 steps when β = 0.9"],
        [String.raw`\text{consistent }\nabla`, "adds up: speeds up along valleys"],
        [String.raw`\text{alternating }\nabla`, "cancels: damps oscillations"],
        [String.raw`\text{Nesterov}`, "look-ahead variant: gradient at θ − ηβv"],
      ],
      foot: "In a steady direction, momentum multiplies the effective step by ==1/(1 − β) = 10×==.",
      notes: "Physical intuition: a ball with mass keeps rolling; friction beta decides how fast it forgets its old direction. If the gradient points the same way every step, v converges to g over 1 - beta, ten times larger. If the gradient alternates sign, successive contributions cancel. SGD with momentum 0.9 is still the standard for training CNNs on ImageNet.",
    });
    d.equation({
      title: "Adam: momentum plus per-parameter step sizes",
      eq: String.raw`\begin{aligned}\mathbf{m}_t&=\beta_1\mathbf{m}_{t-1}+(1-\beta_1)\mathbf{g}_t, & \hat{\mathbf{m}}_t&=\mathbf{m}_t/(1-\beta_1^t)\\ \mathbf{v}_t&=\beta_2\mathbf{v}_{t-1}+(1-\beta_2)\mathbf{g}_t^2, & \hat{\mathbf{v}}_t&=\mathbf{v}_t/(1-\beta_2^t)\\ \theta_{t+1}&=\theta_t-\eta\,\hat{\mathbf{m}}_t\big/\big(\sqrt{\hat{\mathbf{v}}_t}+\epsilon\big)\end{aligned}`,
      legend: [
        [String.raw`\mathbf{m}_t`, "1st moment: smoothed gradient (momentum)"],
        [String.raw`\mathbf{v}_t`, "2nd moment: smoothed squared gradient"],
        [String.raw`1-\beta^t`, "bias correction: m, v start at 0"],
        [String.raw`\beta_1,\beta_2,\epsilon`, "defaults 0.9, 0.999, 1e-8"],
      ],
      eqSize: 26,
      notes: "Go line by line. m is an exponential moving average of gradients, like momentum. v is an exponential moving average of squared gradients, a per-coordinate estimate of gradient magnitude. Dividing m by the square root of v normalises each coordinate's step. Because m and v start at zero they are biased toward zero early on; dividing by 1 - beta to the t fixes that. Squares, square roots and divisions are all element-wise.",
    });
    d.example({
      title: "Worked example: Adam's first step",
      problem: "Two parameters receive gradients g = (0.2, 20) at step t = 1. Use η = 0.001, β₁ = 0.9, β₂ = 0.999, m₀ = v₀ = 0, ignore ε. Compute each parameter's update.",
      steps: [
        { eq: String.raw`\mathbf{m}_1=0.1\,\mathbf{g}=(0.02,\ 2),\quad \hat{\mathbf{m}}_1=\mathbf{m}_1/0.1=(0.2,\ 20)`, note: "1st moment" },
        { eq: String.raw`\mathbf{v}_1=0.001\,\mathbf{g}^2=(4\!\times\!10^{-5},\ 0.4),\quad \hat{\mathbf{v}}_1=(0.04,\ 400)`, note: "2nd moment" },
        { eq: String.raw`\hat{\mathbf{m}}_1/\sqrt{\hat{\mathbf{v}}_1}=(0.2/0.2,\ 20/20)=(1,\ 1)`, note: "normalise" },
        { eq: String.raw`\Delta\theta=-0.001\times(1,1)=(-0.001,\ -0.001)`, note: "update" },
      ],
      answer: "A 100× difference in gradient size gives ==the same step==. Adam's step ≈ η per parameter, regardless of scale",
      notes: "This shows Adam's key property: scale invariance. Plain SGD would move the second parameter 100 times more than the first. With Adam, the learning rate is roughly the maximum change per parameter per step, which makes it much easier to tune across layers with very different gradient scales, such as embeddings versus output layers in transformers.",
    });

    d.section("Schedules and regularisation");
    d.figure({
      title: "Learning-rate schedules: warm up, then decay",
      fig: F("d10_sched"),
      points: [
        { icon: "rocket", text: "**Warm-up**: start small while Adam's statistics and the loss surface settle" },
        { icon: "chart", text: "**Cosine decay**: big steps to explore early, small steps to settle late" },
        { icon: "cog", text: "Other choices: step decay, linear decay, ==WSD== (warm-up, stable, decay)" },
      ],
      notes: "A schedule changes eta over training. Warm-up avoids early instability when gradients are large and Adam's second-moment estimates are noisy. Cosine decay smoothly lowers the learning rate to near zero. GPT-3, LLaMA and most transformer recipes use warm-up plus cosine. The warm-up-stable-decay schedule is popular in recent LLM training because it allows continuing training from checkpoints.",
    });
    d.compare({
      title: "Regularisation: preferring simpler solutions",
      cols: [
        { head: "Weight decay / L2", icon: "balance", eq: String.raw`\theta\leftarrow\theta-\eta(\nabla\mathcal{L}+\lambda\theta)`, items: ["Shrinks weights toward 0 every step", "Gaussian prior (MAP, Day 8)", "**AdamW**: apply decay separately from the adaptive step"] },
        { head: "Dropout", icon: "random", eq: String.raw`\mathbf{h}'=\frac{\mathbf{m}\odot\mathbf{h}}{1-p},\ m_i\sim\mathrm{Bern}(1-p)`, items: ["Randomly zero activations in training", "Dividing by 1 − p keeps 𝔼[h′] = h", "Acts like an ensemble of sub-networks"] },
        { head: "Early stopping & data", icon: "filter", items: ["Stop when **validation** loss rises", "Data augmentation encodes invariances", "More data is the best regulariser"] },
      ],
      notes: "AdamW from Loshchilov and Hutter 2019 is worth explaining: in Adam, adding lambda theta to the gradient gets rescaled by the adaptive denominator, so large-gradient weights are barely decayed. AdamW subtracts eta lambda theta directly, restoring proper weight decay. It is the default optimiser for transformers. The dropout scaling uses linearity of expectation from Day 7.",
    });
    d.figure({
      title: "Constrained optimisation: Lagrange multipliers",
      fig: F("d10_lagrange"),
      points: [
        { icon: "target", text: "At the optimum the contour of f **touches** the constraint curve" },
        { icon: "arrow", text: "So the gradients are parallel: **∇f = λ∇g**" },
        { icon: "calc", text: "xy with x + y = 3: (y, x) = λ(1, 1) ⇒ x = y = 1.5" },
        { icon: "book", text: "Used in SVMs, max-entropy models, ==constrained RL== and fairness constraints" },
      ],
      notes: "Walk along the red constraint line: the value of xy rises then falls, peaking where a contour is tangent to the line. Tangency means the gradients of f and g point the same way. Introducing the Lagrangian L = f - lambda (g - c) and setting its gradient to zero encodes this condition. The multiplier lambda measures how much the optimum would improve if the constraint were relaxed, a price.",
    });
    d.code({
      title: "The standard training loop, with every idea from today",
      code: `import torch
model = MyModel()
opt = torch.optim.AdamW(model.parameters(), lr=3e-4,
                        betas=(0.9, 0.999), weight_decay=0.1)
total, warm = 10_000, 500
sched = torch.optim.lr_scheduler.LambdaLR(opt,
    lambda s: min(1, s / warm) * 0.5 * (1 + math.cos(
        math.pi * min(1, max(0, s - warm) / (total - warm)))))

for step, (x, y) in enumerate(loader):      # minibatches
    loss = torch.nn.functional.cross_entropy(model(x), y)
    opt.zero_grad()
    loss.backward()                          # Day 6
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()                               # AdamW update
    sched.step()                             # warm-up + cosine
    if step % 500 == 0:
        val = evaluate(model)                # early stopping
        log(step, loss.item(), val, sched.get_last_lr())`,
      points: [
        "**AdamW** with weight decay, as in most transformer recipes",
        "LambdaLR implements **warm-up then cosine** decay",
        "Clip gradient norm to 1.0 to survive loss spikes",
        "Always log ==learning rate, train loss and validation metric==",
      ],
      fontSize: 11.5,
      notes: "This loop is the template for experiments in the rest of the course. Point out zero_grad: PyTorch accumulates gradients by default, the fan-in rule from Day 6. Logging the learning rate catches schedule bugs. When a run diverges, check in this order: learning rate, warm-up, gradient clipping, data.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\theta_{t}=\theta_{t-1}-\eta_t\Big(\frac{\hat{\mathbf{m}}_t}{\sqrt{\hat{\mathbf{v}}_t}+\epsilon}+\lambda\theta_{t-1}\Big)`, read: "**AdamW**: Adam step plus decoupled weight decay.", src: "Loshchilov & Hutter 2019" },
        { eq: String.raw`\eta_t=\eta_{\max}\cdot\tfrac12\big(1+\cos(\pi t/T)\big)`, read: "**Cosine schedule**: learning rate decays smoothly from its peak to 0 over T steps." },
        { eq: String.raw`\mathbb{E}\big[\mathcal{L}(\bar\theta_T)\big]-\mathcal{L}^*\le\mathcal{O}\big(1/\sqrt{T}\big)`, read: "Convergence rate: SGD on a convex problem gets within **1/√T** of optimal after T steps." },
        { eq: String.raw`\mathcal{L}(\theta,\lambda)=f(\theta)-\lambda\big(g(\theta)-c\big)`, read: "The **Lagrangian**: fold a constraint into the objective with a multiplier λ." },
      ],
      notes: "Big-O rate statements like row 3 appear in theory sections. Read them as: to halve the gap, you need four times as many steps, again the square-root law. Students do not need to prove such bounds, only to read what they promise and under which assumptions, here convexity.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "For f(x) = 3x² start at x = 1. Run 3 GD steps with η = 0.1 and with η = 0.4. What is the largest stable η?" },
        { lvl: "Warm-up", text: "Which are convex: x⁴, −x², eˣ + x², |x| + 2x, max(0, x)? Justify briefly." },
        { lvl: "Core", text: "With β = 0.9 and a constant gradient g = 1, compute the momentum velocity v for t = 1, 2, 3 and its limit." },
        { lvl: "Core", text: "Maximise f(x, y) = x + 2y subject to x² + y² = 5 using Lagrange multipliers." },
        { lvl: "Code", text: "Train a small MLP on MNIST with SGD, SGD+momentum and AdamW at 3 learning rates each. Plot loss curves on one figure; which is most robust to η?" },
        { lvl: "Research", text: "Read the Adam paper's Algorithm 1. Map every line to the equation slide. What does the paper say about the default hyperparameters?" },
      ],
      notes: "Answers: 1) f' = 6x; eta 0.1: x = 0.4, 0.16, 0.064; eta 0.4: x = -1.4, 1.96, -2.74, diverging; stable if eta < 2/6 = 0.333. 2) x to the 4, e to the x plus x squared, |x| + 2x, ReLU are convex; minus x squared is concave. 3) 1, 1.9, 2.71, limit 10. 4) gradient (1, 2) = 2 lambda (x, y), so (x, y) = (1, 2), maximum 5. 5) AdamW is usually most robust. 6) discussion.",
    });
    d.recap({
      points: [
        "Training = minimise empirical risk + regulariser; **convex** problems have one valley",
        "Learning rate must satisfy **η < 2/λmax**; too big diverges, too small crawls",
        "**SGD**: unbiased noisy gradients from minibatches; noise ∝ 1/√B",
        "**Momentum** smooths; **Adam** normalises per parameter; ==AdamW + warm-up + cosine== is the modern default",
        "Weight decay, dropout, early stopping regularise; **Lagrange** handles constraints",
      ],
      next: "The math of neural networks",
      nextTopics: ["Neurons, MLPs and activations", "Backprop end to end with numbers", "Initialisation (Xavier, He)", "Normalisation and residual connections"],
      notes: "We are now two-thirds through. Days 11 to 15 assemble all the math into real architectures, starting tomorrow with a full neural network trained by hand, then transformers, generative models, reinforcement learning and research practice.",
    });
  },
};
