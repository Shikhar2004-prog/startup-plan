// Day 13 — Generative models
module.exports = {
  day: 13,
  short: "Generative models",
  file: "Day-13-Generative-Models-VAE-GAN-Flow-Diffusion",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Generative Models: VAEs, GANs, Flows and Diffusion",
      subtitle: "Four mathematical answers to one question: how do we learn a probability distribution we can sample from?",
      topics: ["Autoencoders", "ELBO", "Reparameterisation", "GAN minimax", "Change of variables", "Diffusion", "DDPM loss"],
      eq: String.raw`\mathbf{x}_t=\sqrt{\bar\alpha_t}\,\mathbf{x}_0+\sqrt{1-\bar\alpha_t}\,\boldsymbol\epsilon`,
      notes: "Until now our models predicted a label or the next token. Today they generate whole objects: images, molecules, audio. Each family is a different trick for the same goal: make p_theta close to p_data and be able to sample from it. Every trick uses math from earlier days: Bayes (Day 7), MLE (Day 8), KL divergence (Day 9), Jacobians (Day 6).",
    });
    d.objectives({
      goals: [
        "State the goal of generative modelling as **maximum likelihood / minimum KL**",
        "Derive the **ELBO** and explain the **reparameterisation trick**",
        "Solve for the **optimal GAN discriminator** and the resulting divergence",
        "Use the **change-of-variables** formula behind normalising flows",
        "Write the **diffusion** forward process and the DDPM noise-prediction loss",
      ],
      why: "Stable Diffusion, DALL·E, Sora and AlphaFold 3 are ==diffusion models==; VAEs compress images inside them. Their papers are dense with ELBOs, KLs and Gaussians, all of which you can now read.",
      prereq: "Day 6 (Jacobians), Day 7 (Bayes, Gaussians), Day 8 (MLE), Day 9 (KL divergence), Day 11 (MLPs).",
      notes: "Frame the day as a tour of four families. Spend most time on the ELBO and diffusion, because those two dominate current research.",
    });

    d.section("The goal and autoencoders");
    d.concept({
      title: "What does it mean to learn a distribution?",
      intuition: [
        "Data x₁ … x_N are **samples** from an unknown p_data(x)",
        "We want a model p_θ(x) we can **evaluate** and, above all, **sample** from",
        "Maximum likelihood (Day 8) is the same as **minimising KL** (Day 9) from data to model",
        "Hard part: images live in ℝ^(512×512×3); we need p_θ to be flexible yet tractable",
      ],
      def: String.raw`\theta^*=\arg\max_\theta\ \mathbb{E}_{\mathbf{x}\sim p_{\text{data}}}\big[\log p_\theta(\mathbf{x})\big]=\arg\min_\theta\ \mathrm{KL}\big(p_{\text{data}}\,\|\,p_\theta\big)`,
      defNote: "Why equal: KL(p_data ‖ p_θ) = E[log p_data] − E[log p_θ], and the first term does not depend on θ.",
      notes: "Every model today is a way to make this optimisation possible. VAEs bound log p from below. GANs avoid computing p entirely. Flows make log p exact through invertible maps. Diffusion trains a denoiser that turns out to optimise a bound on log p.",
    });
    const ae = D.graph({
      W: 1200, H: 330,
      nodes: [
        { id: "x", x: 90, y: 160, w: 120, h: 120, label: "$\\mathbf{x}$", sub: "784 pixels", fill: P.soft.blue, stroke: "blue", fs: 26 },
        { id: "e", x: 330, y: 160, w: 190, h: 90, label: "Encoder $q_\\phi(\\mathbf{z}\\mid\\mathbf{x})$", sub: "MLP or CNN", fill: P.soft.violet, stroke: "violet", fs: 18 },
        { id: "z", x: 590, y: 160, w: 120, h: 60, label: "$\\mathbf{z}\\in\\mathbb{R}^{16}$", sub: "latent code", fill: P.soft.gold, stroke: "gold", fs: 20 },
        { id: "dd", x: 850, y: 160, w: 190, h: 90, label: "Decoder $p_\\theta(\\mathbf{x}\\mid\\mathbf{z})$", sub: "MLP or CNN", fill: P.soft.green, stroke: "green", fs: 18 },
        { id: "y", x: 1100, y: 160, w: 120, h: 120, label: "$\\hat{\\mathbf{x}}$", sub: "reconstruction", fill: P.soft.blue, stroke: "blue", fs: 26 },
      ],
      edges: [
        { a: "x", b: "e", color: "navy" }, { a: "e", b: "z", color: "navy" }, { a: "z", b: "dd", color: "navy" }, { a: "dd", b: "y", color: "navy" },
        { a: "x", b: "y", color: "coral", bend: 150, dash: true, label: "loss: ‖x − x̂‖²  +  KL(q(z|x) ‖ N(0, I))", lfs: 17 },
      ],
    });
    d.diagram({
      title: "From autoencoder to variational autoencoder",
      diag: ae,
      chips: [
        ["Autoencoder", "Compress to a small z, then rebuild. Learns features but z has no shape: you cannot sample it."],
        ["VAE", "Encoder outputs a distribution N(μ, σ²); a KL term pulls it towards N(0, I)."],
        ["Generate", "Sample z ~ N(0, I), run only the decoder: a brand-new x."],
      ],
      notes: "The bottleneck forces the network to keep only what matters (compare PCA on Day 4: a linear autoencoder learns the PCA subspace). A plain autoencoder's codes are scattered irregularly, so a random z decodes to garbage. The VAE regularises the code space to look like a standard Gaussian, so random samples land in meaningful regions.",
    });

    d.section("Variational autoencoders");
    d.equation({
      title: "Deriving the ELBO in three lines",
      eq: String.raw`\log p_\theta(\mathbf{x})=\log\!\int p_\theta(\mathbf{x}\mid\mathbf{z})p(\mathbf{z})\,d\mathbf{z}=\log\mathbb{E}_{q_\phi(\mathbf{z}\mid\mathbf{x})}\!\Big[\frac{p_\theta(\mathbf{x}\mid\mathbf{z})p(\mathbf{z})}{q_\phi(\mathbf{z}\mid\mathbf{x})}\Big]\ \ge\ \underbrace{\mathbb{E}_{q}\big[\log p_\theta(\mathbf{x}\mid\mathbf{z})\big]}_{\text{reconstruction}}-\underbrace{\mathrm{KL}\big(q_\phi(\mathbf{z}\mid\mathbf{x})\,\|\,p(\mathbf{z})\big)}_{\text{regulariser}}`,
      legend: [
        [String.raw`\int\cdots d\mathbf{z}`, "marginalise the latent: intractable for a neural decoder"],
        [String.raw`\frac{p}{q}`, "multiply and divide by q: importance sampling (Day 7)"],
        [String.raw`\log\mathbb{E}\ge\mathbb{E}\log`, "Jensen's inequality: log is concave"],
        [String.raw`\text{gap}`, "exactly KL(q(z|x) ‖ p(z|x)): the bound is tight when q is the true posterior"],
      ],
      foot: "Maximise the ELBO over ==both θ and φ==: better decoder and better approximate posterior at once.",
      eqSize: 17,
      notes: "Go line by line. The integral over z is what we cannot compute. Multiplying and dividing by q lets us write it as an expectation under q, which we can sample. Jensen's inequality moves the log inside and gives a lower bound. Splitting the log of the product gives reconstruction minus KL. With a Gaussian decoder, the reconstruction term is minus squared error up to constants (Day 8: Gaussian likelihood = MSE).",
    });
    d.example({
      title: "Worked example: the KL term in closed form",
      problem: "The encoder outputs μ = 1, σ = 0.5 for one latent dimension. Prior p(z) = N(0, 1). Compute KL(N(μ, σ²) ‖ N(0, 1)).",
      problemEq: String.raw`\mathrm{KL}=\tfrac12\big(\mu^2+\sigma^2-1-\log\sigma^2\big)`,
      steps: [
        { eq: String.raw`\mu^2=1,\quad \sigma^2=0.25`, note: "plug in" },
        { eq: String.raw`\log\sigma^2=\log0.25=-1.386`, note: "natural log" },
        { eq: String.raw`\tfrac12(1+0.25-1+1.386)=\tfrac12(1.636)`, note: "combine" },
        { eq: String.raw`\mathrm{KL}=0.818\ \text{nats}`, note: "result" },
        { eq: String.raw`\mu=0,\ \sigma=1\ \Rightarrow\ \mathrm{KL}=\tfrac12(0+1-1-0)=0`, note: "sanity check" },
      ],
      answer: "The KL term charges ==0.818 nats== for moving the code away from the prior; it is zero only when q = N(0, 1)",
      notes: "Derive the formula from the Day 9 definition if time allows: KL between two Gaussians has a closed form. Two effects: mu squared penalises codes far from the origin, and sigma squared minus 1 minus log sigma squared penalises a variance that is too small or too large (minimum at sigma = 1). In a 16-dimensional latent, the KL is the sum over dimensions.",
    });
    const rp = D.graph({
      W: 1200, H: 340,
      nodes: [
        { id: "x", x: 80, y: 170, w: 100, h: 60, label: "$\\mathbf{x}$", fill: P.soft.blue, stroke: "blue", fs: 24 },
        { id: "enc", x: 280, y: 170, w: 160, h: 70, label: "Encoder $\\phi$", fill: P.soft.violet, stroke: "violet", fs: 19 },
        { id: "mu", x: 490, y: 90, w: 100, h: 56, label: "$\\boldsymbol\\mu$", fill: P.soft.violet, stroke: "violet", fs: 22 },
        { id: "sg", x: 490, y: 250, w: 100, h: 56, label: "$\\boldsymbol\\sigma$", fill: P.soft.violet, stroke: "violet", fs: 22 },
        { id: "eps", x: 690, y: 320, w: 160, h: 44, label: "$\\boldsymbol\\epsilon\\sim\\mathcal{N}(0,I)$", fill: P.soft.gold, stroke: "gold", fs: 18 },
        { id: "z", x: 760, y: 170, w: 230, h: 70, label: "$\\mathbf{z}=\\boldsymbol\\mu+\\boldsymbol\\sigma\\odot\\boldsymbol\\epsilon$", fill: "white", stroke: "navy", fs: 21 },
        { id: "dec", x: 1080, y: 170, w: 170, h: 70, label: "Decoder $\\theta$", fill: P.soft.green, stroke: "green", fs: 19 },
      ],
      edges: [
        { a: "x", b: "enc", color: "navy" }, { a: "enc", b: "mu", color: "navy" }, { a: "enc", b: "sg", color: "navy" },
        { a: "mu", b: "z", color: "navy" }, { a: "sg", b: "z", color: "navy" }, { a: "eps", b: "z", color: "gold", dash: true }, { a: "z", b: "dec", color: "navy" },
      ],
      extraHtml: D.label(1000, 300, "∂z/∂μ = 1,   ∂z/∂σ = ε   → gradients reach φ", { color: "teal", bold: true, fs: 17 }),
    });
    d.diagram({
      title: "The reparameterisation trick: move the randomness aside",
      diag: rp,
      chips: [
        ["Problem", "Sampling z ~ N(μ, σ²) is not differentiable: no gradient flows to μ, σ."],
        ["Trick", "Sample ε from a fixed N(0, I) and compute z = μ + σ ⊙ ε, a deterministic function."],
        ["Result", "Backprop (Day 6) goes through z to the encoder; ε is just an input."],
      ],
      notes: "This one line made VAEs trainable (Kingma and Welling 2013). The same idea appears in diffusion: x_t = root alpha-bar times x_0 plus root of 1 minus alpha-bar times epsilon. In practice the encoder outputs log sigma squared for numerical stability, and sigma = exp of half of that.",
    });

    d.section("GANs");
    d.equation({
      title: "GANs: a two-player minimax game",
      eq: String.raw`\min_G\max_D\ V(D,G)=\mathbb{E}_{\mathbf{x}\sim p_{\text{data}}}\big[\log D(\mathbf{x})\big]+\mathbb{E}_{\mathbf{z}\sim p(\mathbf{z})}\big[\log\big(1-D(G(\mathbf{z}))\big)\big]`,
      legend: [
        [String.raw`G(\mathbf{z})`, "generator: noise in, fake sample out (like a decoder)"],
        [String.raw`D(\mathbf{x})\in(0,1)`, "discriminator: probability that x is real"],
        [String.raw`\max_D`, "D minimises binary cross-entropy (Day 9): real → 1, fake → 0"],
        [String.raw`\min_G`, "G tries to fool D; no likelihood is ever computed"],
      ],
      foot: "Optimal discriminator: ==D*(x) = p_data(x) / (p_data(x) + p_g(x))==. Then V = −log 4 + 2·JSD(p_data ‖ p_g).",
      eqSize: 21,
      notes: "Derive D star: for a fixed x, maximise a log D + b log(1 minus D) over D with a = p_data(x), b = p_g(x). Setting the derivative a/D minus b/(1 minus D) to zero gives D = a/(a + b). Substituting back gives Jensen-Shannon divergence, a symmetric relative of KL. So with a perfect D, the generator minimises a divergence, and the minimum is p_g = p_data.",
    });
    d.figure({
      title: "Watching a GAN train in one dimension",
      fig: F("d13_gan"), wide: true,
      points: [
        { icon: "eye", text: "Blue: real data. Green: generator. Dashed: discriminator D(x)" },
        { icon: "arrow", text: "D's slope tells G **which way to move** its samples" },
        { icon: "balance", text: "Equilibrium: p_g = p_data and ==D(x) = ½== everywhere" },
      ],
      notes: "Left: G's distribution is far from the data; D easily separates them. Middle: following D's gradient, G moves its mass towards the data. Right: the distributions match and D can do no better than a coin flip. In practice GAN training is unstable: mode collapse, oscillation. Tricks such as the non-saturating loss, Wasserstein GAN and spectral normalisation came from analysing this game mathematically.",
    });
    d.example({
      title: "Worked example: the optimal discriminator",
      problem: "At a point x, the real density is p_data(x) = 0.3 and the generator density is p_g(x) = 0.1. What does the best discriminator output, and what happens at equilibrium?",
      problemEq: String.raw`D^*(\mathbf{x})=\frac{p_{\text{data}}(\mathbf{x})}{p_{\text{data}}(\mathbf{x})+p_g(\mathbf{x})}`,
      steps: [
        { eq: String.raw`\max_D\ 0.3\log D+0.1\log(1-D)`, note: "pointwise objective" },
        { eq: String.raw`\frac{0.3}{D}-\frac{0.1}{1-D}=0`, note: "set derivative to 0" },
        { eq: String.raw`D^*=\frac{0.3}{0.3+0.1}=0.75`, note: "solve" },
        { eq: String.raw`p_g=p_{\text{data}}\Rightarrow D^*=\tfrac12,\ \ V=2\log\tfrac12=-\log4\approx-1.386`, note: "equilibrium" },
      ],
      answer: "D* = 0.75 says 'probably real'. At equilibrium D* = ½ and the game value is ==−log 4==",
      notes: "This is a standard exam and interview question. Note the role of calculus from Day 5: a one-variable maximisation solved by setting the derivative to zero. The minus log 4 value is how the original GAN paper proves the global optimum is p_g = p_data.",
    });

    d.section("Normalising flows");
    d.equation({
      title: "Flows: exact likelihood through an invertible map",
      eq: String.raw`\mathbf{x}=f(\mathbf{z}),\ \ \mathbf{z}\sim\mathcal{N}(0,I)\qquad\Longrightarrow\qquad \log p_X(\mathbf{x})=\log p_Z\big(f^{-1}(\mathbf{x})\big)+\log\Big|\det\frac{\partial f^{-1}}{\partial\mathbf{x}}\Big|`,
      legend: [
        [String.raw`f`, "an invertible neural network (a stack of simple invertible layers)"],
        [String.raw`f^{-1}(\mathbf{x})`, "map data back to noise to evaluate the density"],
        [String.raw`\det J`, "Jacobian determinant (Days 4 and 6): how much f stretches volume"],
        [String.raw`\log|\det|`, "must be cheap: flows use triangular Jacobians, so det = product of diagonal"],
      ],
      foot: "Probability mass is conserved: where f ==stretches== space, density ==drops== by the same factor.",
      eqSize: 21,
      notes: "This is the change-of-variables formula from calculus, in many dimensions. The Jacobian determinant from Day 4 measures the volume change of a linear map; here it is the local linearisation of f. RealNVP and Glow use coupling layers where half the coordinates are transformed using the other half, giving a triangular Jacobian.",
    });
    d.figure({
      title: "Change of variables in one dimension",
      fig: F("d13_flow"), wide: true,
      points: [
        { icon: "random", text: "z ~ N(0, 1), x = e^(0.6z): a simple invertible map" },
        { icon: "calc", text: "At x = 1: z = 0, |dz/dx| = 1/(0.6·1) = 1.667, so p_X(1) = 0.399 × 1.667 = ==0.665==" },
        { icon: "check", text: "The red curve (formula) matches the purple histogram (samples)" },
      ],
      notes: "Do the calculation at x = 1 together. z = log(x)/0.6 = 0. The standard normal density at 0 is 0.399. The derivative dz/dx = 1/(0.6 x) = 1.667 at x = 1. Multiply: 0.665. Small x is where the map compresses space, so the density piles up there: the mode is at e^(-0.36), about 0.70.",
    });

    d.section("Diffusion models");
    d.figure({
      title: "Diffusion, forward: destroy the data with Gaussian noise",
      fig: F("d13_diffusion"), wide: true,
      points: [
        { icon: "arrow", text: "Each step adds a little noise; after T = 1000 steps only N(0, I) is left" },
        { icon: "bolt", text: "Closed form: jump to any step t directly, no loop needed" },
        { icon: "brain", text: "Learn to ==reverse== it: a network removes the noise one step at a time" },
      ],
      notes: "The 2-D Swiss roll is a stand-in for images. The forward process is fixed, with no learning. All the learning is in the reverse direction: start from pure noise and denoise step by step until a data sample appears. The sqrt alpha-bar values shown above each panel are how much of the original signal survives.",
    });
    d.equation({
      title: "Forward process and the DDPM training loss",
      eq: String.raw`\mathbf{x}_t=\sqrt{\bar\alpha_t}\,\mathbf{x}_0+\sqrt{1-\bar\alpha_t}\,\boldsymbol\epsilon,\ \ \boldsymbol\epsilon\sim\mathcal{N}(0,I)\qquad \mathcal{L}(\theta)=\mathbb{E}_{\mathbf{x}_0,t,\boldsymbol\epsilon}\Big[\big\|\boldsymbol\epsilon-\boldsymbol\epsilon_\theta(\mathbf{x}_t,t)\big\|^2\Big]`,
      legend: [
        [String.raw`\bar\alpha_t=\prod_{s\le t}(1-\beta_s)`, "signal kept after t steps: 1 at t = 0, about 0 at t = T"],
        [String.raw`\boldsymbol\epsilon_\theta(\mathbf{x}_t,t)`, "a U-Net or transformer that predicts the noise that was added"],
        [String.raw`\|\cdot\|^2`, "plain MSE (Day 8): the whole method is regression"],
        [String.raw`\text{ELBO}`, "Ho et al. show this is a reweighted ELBO, the same bound as the VAE"],
      ],
      foot: "Training loop: pick x₀, pick t, pick ε, make x_t, ==predict ε==, take a gradient step. That is all.",
      eqSize: 19,
      notes: "The closed form follows because a sum of independent Gaussians is Gaussian and variances add. Diffusion is a deep VAE with a fixed encoder (the noising) and T latent layers; the ELBO decomposes into per-step KLs between Gaussians, each of which reduces to a squared error on the noise. Sampling runs the learned denoiser backwards from x_T ~ N(0, I).",
    });
    d.example({
      title: "Worked example: one diffusion training step",
      problem: "A 1-D data point x₀ = 2. At step t, ᾱ_t = 0.64. Sampled noise ε = −0.5. The network predicts ε̂ = −0.4.",
      problemEq: String.raw`\mathbf{x}_t=\sqrt{\bar\alpha_t}\,\mathbf{x}_0+\sqrt{1-\bar\alpha_t}\,\boldsymbol\epsilon`,
      steps: [
        { eq: String.raw`\sqrt{0.64}=0.8,\quad \sqrt{1-0.64}=0.6`, note: "coefficients" },
        { eq: String.raw`x_t=0.8\cdot2+0.6\cdot(-0.5)=1.3`, note: "noisy input" },
        { eq: String.raw`\mathcal{L}=(\epsilon-\hat\epsilon)^2=(-0.5+0.4)^2=0.01`, note: "loss" },
        { eq: String.raw`\hat x_0=\frac{x_t-0.6\,\hat\epsilon}{0.8}=\frac{1.3+0.24}{0.8}=1.925`, note: "implied clean guess" },
      ],
      answer: "Predicting the noise is equivalent to predicting the clean data: here x̂₀ = 1.925 vs the true ==2.0==",
      notes: "Note the identity 0.8 squared plus 0.6 squared = 1: the forward process preserves variance when x0 has unit variance. Rearranging the forward equation shows that a noise predictor gives a clean-data predictor for free. Some papers predict x0, some predict epsilon, some predict a mix called v; they are linear reparameterisations of each other.",
    });
    d.table({
      title: "Four families side by side",
      head: ["Family", "Training objective", "Exact log p(x)?", "Sampling", "Known for"],
      rows: [
        ["VAE", "maximise ELBO", "lower bound", "one decoder pass: fast", "latent spaces, Stable Diffusion's autoencoder"],
        ["GAN", "minimax game (JSD)", "no", "one generator pass: fast", "sharp faces (StyleGAN); unstable training"],
        ["Flow", "exact max likelihood", "**yes**", "one inverse pass", "exact densities, physics, audio"],
        ["Diffusion", "noise-prediction MSE (ELBO)", "bound", "many steps: slow (10–1000)", "**image, video, protein** state of the art"],
      ],
      colW: [1.5, 2.9, 1.9, 2.7, 3.13],
      fontSize: 15,
      foot: "Pattern: every family trades off ==tractable likelihood==, ==fast sampling== and ==sample quality==.",
      notes: "Use this table to review. Ask students where autoregressive transformers (Day 12) fit: they have exact likelihood by the chain rule and slow sequential sampling. Current research blends families: latent diffusion runs diffusion inside a VAE's latent space, and flow matching connects flows and diffusion.",
    });
    d.code({
      title: "A DDPM training step in PyTorch",
      code: `import torch, torch.nn.functional as F

T = 1000
beta = torch.linspace(1e-4, 0.02, T)      # noise schedule
abar = torch.cumprod(1 - beta, dim=0)      # alpha-bar_t

def train_step(model, x0, opt):
    t = torch.randint(0, T, (x0.shape[0],))  # random step
    eps = torch.randn_like(x0)               # noise to predict
    a = abar[t].view(-1, *[1] * (x0.dim() - 1))
    xt = a.sqrt() * x0 + (1 - a).sqrt() * eps
    loss = F.mse_loss(model(xt, t), eps)
    opt.zero_grad(); loss.backward(); opt.step()
    return loss.item()`,
      points: [
        "cumprod gives **ᾱ_t** for every t at once",
        "One random t per example: the loss is an **expectation over t**",
        "The forward process line is the slide's equation, verbatim",
        "Sampling reverses it with T denoising steps",
      ],
      fontSize: 14,
      notes: "This is essentially the complete training code of the DDPM paper minus the network. Students can use a small MLP that takes x_t concatenated with t/T on the 2-D Swiss roll, train for a few thousand steps, and then implement the sampler to watch noise turn into a spiral.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathcal{L}(\theta,\phi;\mathbf{x})=-\mathrm{KL}\big(q_\phi(\mathbf{z}|\mathbf{x})\|p(\mathbf{z})\big)+\mathbb{E}_{q_\phi}\big[\log p_\theta(\mathbf{x}|\mathbf{z})\big]`, read: "The **ELBO**: regularise the code, reconstruct the input.", src: "Kingma & Welling 2013" },
        { eq: String.raw`C(G)=-\log4+2\cdot\mathrm{JSD}\big(p_{\text{data}}\,\|\,p_g\big)`, read: "With the best D, the generator minimises **Jensen–Shannon divergence**.", src: "Goodfellow et al. 2014" },
        { eq: String.raw`q(\mathbf{x}_t|\mathbf{x}_0)=\mathcal{N}\big(\sqrt{\bar\alpha_t}\mathbf{x}_0,(1-\bar\alpha_t)I\big)`, read: "Jump straight to noise level t in **closed form**.", src: "Ho et al. 2020" },
        { eq: String.raw`\nabla_{\mathbf{x}}\log p_t(\mathbf{x})\approx-\boldsymbol\epsilon_\theta(\mathbf{x},t)/\sqrt{1-\bar\alpha_t}`, read: "The noise predictor is a **score function**: it points towards higher density.", src: "Song et al. 2021" },
      ],
      notes: "The last row links diffusion to score matching: predicting the noise is the same as estimating the gradient of the log density, up to scale. That viewpoint gives stochastic differential equation samplers and classifier-free guidance.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Compute KL(N(μ, σ²) ‖ N(0, 1)) for μ = 0, σ = 2 and for μ = 2, σ = 1. Which is penalised more?" },
        { lvl: "Warm-up", text: "In the diffusion example, what is x_t if ᾱ_t = 0.36 instead? How much of x₀ survives?" },
        { lvl: "Core", text: "Derive D*(x) = p_data / (p_data + p_g) by maximising a·log D + b·log(1 − D)." },
        { lvl: "Core", text: "Show the ELBO gap equals KL(q(z|x) ‖ p(z|x)) using Bayes' rule." },
        { lvl: "Code", text: "Train a tiny DDPM on the 2-D Swiss roll with an MLP denoiser. Plot samples after 1k, 5k and 20k steps." },
        { lvl: "Research", text: "Read the classifier-free guidance paper. Write its sampling equation and explain the guidance weight w." },
      ],
      notes: "Answers: 1) mu 0 sigma 2: one half of (0 + 4 minus 1 minus log 4) = 0.807; mu 2 sigma 1: one half of (4 + 1 minus 1 minus 0) = 2.0, so the shifted mean costs more. 2) 0.6 times 2 + 0.8 times minus 0.5 = 0.8; only 60 percent of the signal amplitude remains. 3) derivative a/D minus b/(1 minus D) = 0. 4) log p(x) minus ELBO = E_q[log q(z|x) minus log p(z|x)]. 6) epsilon-tilde = (1 + w) epsilon(x, c) minus w epsilon(x).",
    });
    d.recap({
      points: [
        "Generative modelling = learn p_θ ≈ p_data; MLE = **min KL(p_data ‖ p_θ)**",
        "VAE: maximise the **ELBO** = reconstruction − KL; train with z = μ + σ⊙ε",
        "GAN: minimax game; optimal D gives ==D* = p_data/(p_data + p_g)==",
        "Flow: exact log-likelihood via **change of variables** and log|det J|",
        "Diffusion: noise in closed form, learn to **predict the noise** with MSE",
      ],
      next: "Reinforcement learning",
      nextTopics: ["MDPs, returns and discounting", "Bellman equations and value iteration", "Policy gradients and PPO", "RLHF and DPO for LLMs"],
      notes: "Tomorrow the model is no longer given the right answer at all. It acts, receives a reward, and must work out which actions caused it. That is reinforcement learning, and it is also how chat models are aligned with human preferences.",
    });
  },
};
