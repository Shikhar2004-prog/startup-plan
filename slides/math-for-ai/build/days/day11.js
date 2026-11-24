// Day 11 — The math of neural networks
module.exports = {
  day: 11,
  short: "The math of neural networks",
  file: "Day-11-Math-of-Neural-Networks",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "The Math of Neural Networks",
      subtitle: "Layers, activations, losses, backpropagation with real numbers, initialisation, normalisation and residual connections",
      topics: ["MLPs", "Activations", "Losses", "Backprop by hand", "Init", "Norms", "Residuals"],
      eq: String.raw`\mathbf{h}^{(\ell)}=\phi\big(W^{(\ell)}\mathbf{h}^{(\ell-1)}+\mathbf{b}^{(\ell)}\big)`,
      notes: "Days 1 to 10 built the toolkit. From today we assemble it into real architectures. Today: the multilayer perceptron from scratch. We will do a complete forward pass, backward pass and parameter update by hand with real numbers, and then study the three ideas that made deep networks trainable: good initialisation, normalisation and residual connections.",
    });
    d.objectives({
      goals: [
        "Write an **MLP** as a composition of affine maps and activations",
        "Explain why **non-linearity** is essential and what universal approximation says",
        "Match **output layers to losses**: regression, binary, multi-class",
        "Run a full **forward + backward + update** step by hand",
        "Justify **He/Xavier init**, **LayerNorm** and **residual connections** mathematically",
      ],
      why: "Every modern model, including the transformer MLP blocks of GPT, is built from these pieces. Knowing the math lets you ==diagnose dead units, exploding activations and unstable training== instead of guessing.",
      prereq: "Day 3 (layers as matrices), Day 6 (backprop equations), Day 9 (cross-entropy), Day 10 (optimisers).",
      notes: "Tell the class that today is the payoff of Days 3, 6, 9 and 10 together. Keep the full backprop example as the centrepiece of the session.",
    });

    d.section("Architecture");
    const mlp = D.nnet({
      W: 1150, H: 430,
      layers: [
        { n: 3, label: "input x ∈ ℝ³", color: "blue" },
        { n: 5, label: "hidden h⁽¹⁾ ∈ ℝ⁵", color: "violet" },
        { n: 5, label: "hidden h⁽²⁾ ∈ ℝ⁵", color: "violet" },
        { n: 2, label: "output ŷ ∈ ℝ²", color: "green" },
      ],
    });
    d.diagram({
      title: "A multilayer perceptron: affine map, activation, repeat",
      diag: mlp,
      chips: [
        ["Each arrow bundle", "one weight matrix: W⁽¹⁾ is 5×3, W⁽²⁾ is 5×5, W⁽³⁾ is 2×5."],
        ["Each circle", "one neuron: a dot product, plus bias, through φ."],
        ["Parameters", "(3·5+5) + (5·5+5) + (5·2+2) = 62 numbers to learn."],
      ],
      notes: "Count parameters together; it is a useful skill for reading architecture tables. Each layer computes z = W h + b and then h = phi(z). The final layer usually has no activation, or a softmax, depending on the task. In a transformer, the MLP block is exactly this with two layers, hidden width 4 times the model width, and GELU.",
    });
    d.figure({
      title: "Why non-linearity: a line cannot separate a ring",
      fig: F("d11_boundary"),
      wide: true,
      caption: "Left: logistic regression (Day 1) can only draw a straight boundary. Right: one hidden layer of 16 tanh units, trained by gradient descent, bends the boundary into a closed curve.",
      notes: "This figure was produced by training both models in NumPy with the math from Days 5 to 10. The hidden layer maps the 2-D input into 16 dimensions where the classes become linearly separable, and the output layer draws a line there. Seen back in the input space, that line becomes a curve. Recall the Day 3 exercise: without the activation, two linear layers collapse into one, so the right panel would be impossible.",
    });
    d.concept({
      title: "Universal approximation: what one hidden layer can do",
      intuition: [
        "Enough hidden units can approximate **any continuous function** on a bounded region",
        "Picture: each ReLU adds a **kink**; enough kinks trace any curve",
        "It guarantees **existence**, not that SGD will find it, nor how many units are needed",
        "In practice **depth** is far more efficient than width: deep nets reuse features",
      ],
      def: String.raw`\forall\,\varepsilon>0\ \ \exists\,N,\{\mathbf{w}_j,b_j,a_j\}:\ \sup_{\mathbf{x}\in K}\Big|f(\mathbf{x})-\sum_{j=1}^{N}a_j\,\phi(\mathbf{w}_j^{\top}\mathbf{x}+b_j)\Big|<\varepsilon`,
      defNote: "Cybenko (1989), Hornik (1991). K is a compact (bounded, closed) set; φ any non-polynomial activation.",
      eqSize: 20,
      notes: "Read the formula aloud: for any accuracy epsilon there is some width N and some weights such that the network is within epsilon of f everywhere on K. Stress the limits: it says nothing about learnability, generalisation or efficiency. Theory papers on depth separation show functions that a deep network represents with polynomially many units but a shallow one needs exponentially many.",
    });
    d.figure({
      title: "Activations and their derivatives",
      fig: F("d11_activations"),
      wide: true,
      caption: "Right panel matters for training: backprop multiplies by φ′(z). Sigmoid's derivative never exceeds 0.25, so deep sigmoid stacks shrink gradients. ReLU passes gradient 1 for z > 0; GELU (used in GPT and BERT) is a smooth ReLU.",
      notes: "Sigmoid and tanh saturate: for large inputs their derivatives are near zero, so gradients vanish. ReLU fixed that, at the cost of dead units whose input is always negative and so never receive gradient. GELU, z times the Gaussian CDF of z, is smooth and slightly negative for small negative inputs; it is the default in transformers. SwiGLU, a gated variant, is used in LLaMA.",
    });
    d.table({
      title: "Match the output layer to the loss",
      head: ["Task", "Output layer", "Loss", "Probabilistic view (Day 8)"],
      colW: [2.4, 2.9, 3.4, 3.43],
      rows: [
        ["Regression", "linear: ŷ = Wh + b", "MSE: ½(ŷ − y)²", "Gaussian likelihood"],
        ["Binary classification", "sigmoid: p = σ(z)", "BCE: −[y log p + (1−y) log(1−p)]", "Bernoulli likelihood"],
        ["K-class classification", "softmax over K logits", "cross-entropy: −log p_y", "categorical likelihood"],
        ["Multi-label", "K independent sigmoids", "sum of K BCE terms", "K Bernoullis"],
        ["Language modelling", "softmax over vocabulary", "cross-entropy per token", "autoregressive factorisation"],
      ],
      fontSize: 14,
      foot: "Beautiful fact: for all three main pairs, the gradient at the logits is ==prediction − target==.",
      notes: "Derive the foot quickly for softmax plus cross-entropy: the derivative of minus log softmax with respect to z_i is p_i minus y_i, where y is one-hot. The same holds for sigmoid plus BCE and for linear plus MSE. This is not a coincidence; these pairs are canonical links of exponential-family distributions, and it makes the backward pass simple and numerically stable.",
    });

    d.section("Backpropagation with numbers");
    const bp = D.graph({
      W: 1200, H: 360,
      nodes: [
        { id: "x", x: 80, y: 150, w: 110, h: 64, label: "$\\mathbf{x}$", fill: P.soft.blue, stroke: "blue", fs: 24 },
        { id: "z1", x: 300, y: 150, w: 170, h: 64, label: "$\\mathbf{z}_1=W_1\\mathbf{x}+\\mathbf{b}_1$", fill: P.soft.violet, stroke: "violet", fs: 18 },
        { id: "h", x: 520, y: 150, w: 150, h: 64, label: "$\\mathbf{h}=\\mathrm{ReLU}(\\mathbf{z}_1)$", fill: P.soft.violet, stroke: "violet", fs: 18 },
        { id: "y", x: 750, y: 150, w: 170, h: 64, label: "$\\hat y=\\mathbf{w}_2^{\\top}\\mathbf{h}+b_2$", fill: P.soft.green, stroke: "green", fs: 18 },
        { id: "L", x: 1010, y: 150, w: 180, h: 64, label: "$L=\\tfrac12(\\hat y-y)^2$", fill: P.soft.coral, stroke: "coral", fs: 18 },
      ],
      edges: [
        { a: "x", b: "z1", color: "navy" }, { a: "z1", b: "h", color: "navy" }, { a: "h", b: "y", color: "navy" }, { a: "y", b: "L", color: "navy" },
        { a: "L", b: "y", color: "coral", bend: -190, lofs: [0, 24], label: "$\\delta_2=\\hat y-y$", lfs: 18 },
        { a: "y", b: "h", color: "coral", bend: -190, lofs: [0, 24], label: "$\\partial L/\\partial\\mathbf{h}=\\delta_2\\mathbf{w}_2$", lfs: 18 },
        { a: "h", b: "z1", color: "coral", bend: -190, lofs: [0, 24], label: "$\\boldsymbol\\delta_1=(\\cdot)\\odot\\mathbb{1}[\\mathbf{z}_1>0]$", lfs: 18 },
      ],
      extraHtml: D.label(600, 30, "forward: compute and cache values  →", { color: "navy", bold: true, fs: 18 }) + D.label(600, 335, "←  backward: multiply local derivatives (chain rule)", { color: "coral", bold: true, fs: 18 }),
    });
    d.diagram({
      title: "The 2-layer network we will train by hand",
      diag: bp,
      chips: [
        ["Weight gradients", "∂L/∂w₂ = δ₂h,  ∂L/∂W₁ = δ₁xᵀ (Day 6)."],
        ["Bias gradients", "∂L/∂b₂ = δ₂,  ∂L/∂b₁ = δ₁."],
        ["ReLU gate", "Gradient passes only through units that were active in the forward pass."],
      ],
      notes: "Set up the next two slides. The forward pass runs left to right and caches z1, h and y-hat. The backward pass runs right to left. The output error delta 2 is prediction minus target. It flows back through w2 to give the gradient at h, and the ReLU acts as a gate: it zeroes the gradient for units whose pre-activation was negative.",
    });
    d.example({
      title: "Worked example, part 1: the forward pass",
      problem: "x = (1, 2), target y = 1. Layer 1: W₁ = [[0.5, −1], [1, 0.5]], b₁ = (0, 0). Layer 2: w₂ = (1, −0.5), b₂ = 0.5.",
      problemEq: String.raw`W_1=\begin{bmatrix}0.5&-1\\1&0.5\end{bmatrix}`,
      steps: [
        { eq: String.raw`\mathbf{z}_1=W_1\mathbf{x}=(0.5-2,\ 1+1)=(-1.5,\ 2)`, note: "affine" },
        { eq: String.raw`\mathbf{h}=\mathrm{ReLU}(\mathbf{z}_1)=(0,\ 2)`, note: "unit 1 is off" },
        { eq: String.raw`\hat y=1\cdot0+(-0.5)\cdot2+0.5=-0.5`, note: "output" },
        { eq: String.raw`L=\tfrac12(-0.5-1)^2=1.125`, note: "loss" },
      ],
      answer: "Prediction −0.5 vs target 1: loss ==1.125==. Cache z₁ and h for the backward pass",
      notes: "Go slowly and let students compute each line. Highlight that hidden unit 1 is inactive because its pre-activation is negative; this will matter in the backward pass, because no gradient will reach its incoming weights.",
    });
    d.example({
      title: "Worked example, part 2: backward pass and update (η = 0.1)",
      problem: "Use the cached values z₁ = (−1.5, 2), h = (0, 2), ŷ = −0.5. Compute all gradients, update, and re-run the forward pass.",
      steps: [
        { eq: String.raw`\delta_2=\hat y-y=-1.5;\ \ \tfrac{\partial L}{\partial\mathbf{w}_2}=\delta_2\mathbf{h}=(0,-3),\ \tfrac{\partial L}{\partial b_2}=-1.5`, note: "output layer" },
        { eq: String.raw`\tfrac{\partial L}{\partial\mathbf{h}}=\delta_2\mathbf{w}_2=(-1.5,\ 0.75);\ \ \boldsymbol\delta_1=(0,\ 0.75)`, note: "through ReLU gate" },
        { eq: String.raw`\tfrac{\partial L}{\partial W_1}=\boldsymbol\delta_1\mathbf{x}^{\top}=\begin{bmatrix}0&0\\0.75&1.5\end{bmatrix},\ \tfrac{\partial L}{\partial\mathbf{b}_1}=(0,0.75)`, note: "hidden layer" },
        { eq: String.raw`\mathbf{w}_2\!\to\!(1,-0.2),\ b_2\!\to\!0.65,\ W_1^{[2,:]}\!\to\!(0.925,0.35),\ b_1\!\to\!(0,-0.075)`, note: "θ ← θ − 0.1∇" },
        { eq: String.raw`\text{new: }\mathbf{h}=(0,\,1.55),\ \hat y=0.34,\ L=0.218`, note: "re-run forward" },
      ],
      answer: "One step: loss 1.125 → 0.218. ==That is all training is==, repeated over many examples and steps",
      notes: "Each gradient uses only cached forward values and the error from above. Unit 1 receives no update because it was inactive: if that persists for all inputs it is a dead ReLU. Verify the new forward pass: z1 second entry = 0.925 + 0.7 - 0.075 = 1.55, y-hat = -0.2 times 1.55 + 0.65 = 0.34. Students can check everything with the PyTorch code on Day 6.",
    });
    d.equation({
      title: "Backprop for any depth: one recursion",
      eq: String.raw`\boldsymbol\delta^{(L)}=\nabla_{\hat{\mathbf{y}}}\mathcal{L}\odot\phi'(\mathbf{z}^{(L)}),\qquad \boldsymbol\delta^{(\ell)}=\big(W^{(\ell+1)\top}\boldsymbol\delta^{(\ell+1)}\big)\odot\phi'(\mathbf{z}^{(\ell)}),\qquad \frac{\partial\mathcal{L}}{\partial W^{(\ell)}}=\boldsymbol\delta^{(\ell)}\mathbf{h}^{(\ell-1)\top}`,
      legend: [
        [String.raw`\boldsymbol\delta^{(\ell)}`, "error signal at layer ℓ (∂L/∂z⁽ˡ⁾)"],
        [String.raw`W^{(\ell+1)\top}`, "sends error back through the next layer's weights"],
        [String.raw`\odot\,\phi'`, "gates it by the local slope of the activation"],
        [String.raw`\boldsymbol\delta\mathbf{h}^{\top}`, "outer product gives the weight gradient"],
      ],
      foot: "Gradient at layer 1 ≈ product of L matrices Wᵀ·diag(φ′): its size can ==vanish or explode exponentially in depth==.",
      eqSize: 22,
      notes: "This is the general algorithm from Rumelhart, Hinton and Williams 1986. The cost of the backward pass is about twice the forward pass. The foot explains the problem the remaining slides solve: repeated multiplication by matrices and activation slopes. Initialisation controls the matrices' scale, normalisation controls activations, residual connections add an identity path.",
    });

    d.section("Making deep networks trainable");
    d.figure({
      title: "Initialisation: keep the signal's variance constant",
      fig: F("d11_init"),
      points: [
        { icon: "ruler", text: "Var of a sum of n terms ≈ n·Var(w)·Var(x): pick Var(w) to cancel n" },
        { icon: "check", text: "**Xavier/Glorot** (tanh): Var(w) = 2/(n_in + n_out)" },
        { icon: "bolt", text: "**He/Kaiming** (ReLU): Var(w) = ==2/n_in==; the 2 compensates for ReLU zeroing half the inputs" },
      ],
      notes: "Derivation sketch: z_j is a sum of n_in products w times x. With independent zero-mean terms, the variance of z is n_in times Var(w) times E[x squared]. ReLU keeps half the variance, so to keep the variance constant from layer to layer we need n_in times Var(w) times one half equal to 1, giving Var(w) = 2 over n_in. The plot is a real simulation: a factor of 1.5 in standard deviation compounds to a million-fold explosion over 20 layers.",
    });
    d.compare({
      title: "Normalisation layers: re-centre and re-scale activations",
      cols: [
        { head: "BatchNorm", icon: "layers", eq: String.raw`\hat x=\frac{x-\mu_{\mathcal{B}}}{\sqrt{\sigma^2_{\mathcal{B}}+\epsilon}},\ y=\gamma\hat x+\beta`, items: ["Statistics over the **batch**, per feature", "Great for CNNs", "Behaves differently in train vs eval; awkward for small batches and sequences"] },
        { head: "LayerNorm", icon: "table", eq: String.raw`\mu=\tfrac1d\textstyle\sum_i x_i,\ \sigma^2=\tfrac1d\textstyle\sum_i(x_i-\mu)^2`, items: ["Statistics over the **features of one token**", "Same in train and eval", "Standard in transformers"] },
        { head: "RMSNorm", icon: "compress", eq: String.raw`y=\gamma\odot\frac{\mathbf{x}}{\sqrt{\frac1d\sum_i x_i^2+\epsilon}}`, items: ["Skip the mean: cheaper", "Used in LLaMA, Mistral, Gemma", "Learned scale γ restores flexibility"] },
      ],
      notes: "All three standardise activations so the next layer sees inputs with controlled scale, which keeps gradients healthy and allows larger learning rates. gamma and beta are learned so the network can undo the normalisation if useful. The key difference is the axis: batch for BatchNorm, features for LayerNorm. That is why LayerNorm suits variable-length sequences.",
    });
    const res = D.graph({
      W: 1100, H: 330,
      nodes: [
        { id: "x", x: 90, y: 200, w: 110, h: 60, label: "$\\mathbf{x}$", fill: P.soft.blue, stroke: "blue", fs: 24 },
        { id: "n", x: 330, y: 200, w: 150, h: 60, label: "LayerNorm", fill: "white", stroke: "line" },
        { id: "f", x: 560, y: 200, w: 180, h: 60, label: "$F(\\cdot)$: MLP or attention", fill: P.soft.violet, stroke: "violet", fs: 18 },
        { id: "p", x: 790, y: 200, w: 56, shape: "circle", label: "+", fill: P.soft.gold, stroke: "gold", fs: 28 },
        { id: "y", x: 990, y: 200, w: 170, h: 60, label: "$\\mathbf{x}+F(\\mathbf{x})$", fill: P.soft.green, stroke: "green" },
        { id: "k", x: 440, y: 60, w: 10, h: 10, shape: "none" },
      ],
      edges: [
        { a: "x", b: "n", color: "navy" }, { a: "n", b: "f", color: "navy" }, { a: "f", b: "p", color: "navy" }, { a: "p", b: "y", color: "navy" },
        { a: "x", b: "p", color: "green", bend: 150, width: 3.5, label: "identity shortcut: gradient flows straight through", lfs: 17 },
      ],
    });
    d.diagram({
      title: "Residual connections: an express lane for gradients",
      diag: res,
      chips: [
        ["Forward", "y = x + F(x): each block learns a correction, not a whole new representation."],
        ["Backward", "∂y/∂x = I + ∂F/∂x. The identity term means gradients never have to vanish."],
        ["Impact", "ResNet (2015) trained 152 layers; every transformer block uses two residuals."],
      ],
      notes: "This is the pre-norm residual block used in GPT-style transformers: normalise, apply F, add back the input. The derivative contains the identity matrix, so even if the Jacobian of F is small, the gradient reaching earlier layers is at least the gradient arriving from above. In product form across depth, we multiply terms like I plus a small matrix instead of small matrices, which avoids exponential decay.",
    });
    d.code({
      title: "An MLP from scratch: forward, backward, update",
      code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(256, 2)); y = (np.linalg.norm(X, axis=1) < 1)*1.
W1 = rng.normal(0, 1.0, (2, 16)); b1 = np.zeros(16)   # He
W2 = rng.normal(0, np.sqrt(2/16), (16, 1)); b2 = np.zeros(1)

for step in range(2000):
    z1 = X @ W1 + b1; h = np.maximum(0, z1)          # forward
    z2 = (h @ W2 + b2).ravel(); p = 1/(1+np.exp(-z2))
    loss = -np.mean(y*np.log(p+1e-9) + (1-y)*np.log(1-p+1e-9))

    d2 = ((p - y) / len(y))[:, None]                   # backward
    gW2, gb2 = h.T @ d2, d2.sum(0)
    d1 = (d2 @ W2.T) * (z1 > 0)
    gW1, gb1 = X.T @ d1, d1.sum(0)

    for P, G in ((W1, gW1), (b1, gb1), (W2, gW2), (b2, gb2)):
        P -= 0.5 * G                                   # update
print(loss, ((p > .5) == y).mean())`,
      points: [
        "He initialisation: std = √(2/n_in)",
        "BCE gradient at the logit is **p − y** (output-layer table)",
        "(z1 > 0) is the **ReLU gate** from the worked example",
        "Swap the update loop for Adam from Day 10 and compare",
      ],
      fontSize: 11.5,
      notes: "Fifteen lines contain the whole of deep learning: initialise, forward, loss, backward, update. Have students type and run it, then verify the gradients against PyTorch autograd using the Day 6 recipe. Then ask them to remove the ReLU and observe accuracy collapse to that of a linear model.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`W\sim\mathcal{N}\big(0,\,2/n_{\text{in}}\big)`, read: "**He initialisation** for ReLU networks.", src: "He et al. 2015" },
        { eq: String.raw`\mathbf{x}_{\ell+1}=\mathbf{x}_\ell+F_\ell\big(\mathrm{LN}(\mathbf{x}_\ell)\big)`, read: "A **pre-norm residual block**: normalise, transform, add back.", src: "GPT-2 and later" },
        { eq: String.raw`\mathrm{FFN}(\mathbf{x})=W_2\,\mathrm{GELU}(W_1\mathbf{x}+\mathbf{b}_1)+\mathbf{b}_2,\ \ W_1\in\mathbb{R}^{4d\times d}`, read: "The transformer **MLP block**: expand to 4d, activate, project back." },
        { eq: String.raw`\mathrm{SwiGLU}(\mathbf{x})=\big(\mathrm{Swish}(W\mathbf{x})\odot V\mathbf{x}\big)U`, read: "A **gated** MLP: one branch decides how much of the other passes.", src: "Shazeer 2020; LLaMA" },
      ],
      notes: "These four lines are the building blocks of most current LLMs. Students can now read each piece. Point out that the product-rule derivative from Day 5 is what backprop uses through the gate in SwiGLU.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Count the parameters of an MLP 784 → 512 → 512 → 10. Which layer dominates?" },
        { lvl: "Warm-up", text: "Show that for softmax + cross-entropy, ∂L/∂zᵢ = pᵢ − yᵢ." },
        { lvl: "Core", text: "Repeat the worked example with target y = −1. Which parameters change, and in which direction?" },
        { lvl: "Core", text: "A layer has n_in = 1024 inputs and uses ReLU. What std should He init use? What happens to activations after 30 layers if you use std = 0.05 instead?" },
        { lvl: "Code", text: "Extend the NumPy MLP to 10 layers. Train with and without residual connections and plot the gradient norm of the first layer over training." },
        { lvl: "Research", text: "Read the ResNet paper's Figure 1. Explain the 'degradation problem' using today's backprop recursion." },
      ],
      notes: "Answers: 1) 401,920 + 262,656 + 5,130 = 669,706; the first layer dominates. 2) differentiate minus z_y + log-sum-exp. 3) delta2 = 0.5, so w2 second entry decreases further, b2 decreases, W1 row 2 decreases; unit 1 still frozen. 4) std = sqrt(2/1024) = 0.044; 0.05 is slightly larger, per-layer variance factor (0.05/0.044) squared = 1.28, so about 1.28 to the 30, around 1,600 times variance growth. 5) without residuals the first-layer gradient is much smaller. 6) deeper plain nets had higher training error, an optimisation problem that residuals fix.",
    });
    d.recap({
      points: [
        "MLP = repeated affine map + **non-linearity**; without φ it collapses to one matrix",
        "Output/loss pairs (linear+MSE, sigmoid+BCE, softmax+CE) give gradient ==ŷ − y==",
        "Backprop: ==δ(l) = (W(l+1)ᵀ δ(l+1)) ⊙ φ′(z(l))== and ∂L/∂W = δhᵀ; you did one step by hand",
        "**He/Xavier init** keeps activation variance stable across depth",
        "**Normalisation** and **residuals** (∂y/∂x = I + ∂F/∂x) make 100+ layers trainable",
      ],
      next: "Attention and transformers",
      nextTopics: ["Convolution and weight sharing", "Scaled dot-product attention", "Multi-head attention and masks", "Positional encodings and the transformer block"],
      notes: "Tomorrow we replace the fixed weight matrix with something more powerful: weights computed from the data itself. That is attention, and with today's residuals, normalisation and MLP blocks, it gives the transformer.",
    });
  },
};
