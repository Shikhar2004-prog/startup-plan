// Day 12 — Attention and transformers
module.exports = {
  day: 12,
  short: "Attention and transformers",
  file: "Day-12-Attention-and-Transformers",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Attention and Transformers",
      subtitle: "Weight sharing, scaled dot-product attention, masks, multi-head attention, positional encodings and the transformer block",
      topics: ["Convolution", "Q, K, V", "Scaling by √d", "Masks", "Multi-head", "Positions", "Transformer block"],
      eq: String.raw`\mathrm{Attn}(Q,K,V)=\mathrm{softmax}\!\Big(\frac{QK^{\top}}{\sqrt{d_k}}\Big)V`,
      notes: "Yesterday's MLP uses fixed weights for every input. Today we let the weights depend on the input itself. That single idea, attention, is the core of GPT, BERT, ViT, Whisper and almost every modern model. By the end of today students should be able to compute attention by hand and read the transformer equations line by line.",
    });
    d.objectives({
      goals: [
        "Explain **weight sharing** in convolutions and why it is an inductive bias",
        "Compute **scaled dot-product attention** by hand with real numbers",
        "Derive why we divide by **√d_k**",
        "Use **causal masks** and **multi-head** attention",
        "Write the **transformer block** and its cost in n and d",
      ],
      why: "Every LLM paper assumes you can read ==softmax(QKᵀ/√d)V== at a glance. Today turns that line into something you can compute, debug and modify.",
      prereq: "Day 2 (dot products), Day 3 (matrix products), Day 7 (softmax as probabilities), Day 11 (MLP, LayerNorm, residuals).",
      notes: "Point out that everything today is matrix multiplication plus softmax. No new calculus is needed; backprop through these operations uses the Day 6 rules.",
    });

    d.section("From fixed weights to data-dependent weights");
    d.concept({
      title: "Convolution: the same small weights, slid everywhere",
      intuition: [
        "A **kernel** w of size k is reused at every position: far fewer parameters than a dense layer",
        "Built-in assumption (**inductive bias**): nearby inputs matter, and a pattern means the same thing anywhere",
        "Stacking layers grows the **receptive field** step by step",
        "Limitation: mixing weights are **fixed**, and long-range links need many layers",
      ],
      def: String.raw`(\mathbf{x}*\mathbf{w})_i=\sum_{j=0}^{k-1} w_j\,x_{i+j}`,
      defNote: "Example: x = (1, 2, 0, 3), w = (1, −1) gives (−1, 2, −3): an edge detector. A dense layer 4→3 needs 12 weights; this needs 2.",
      notes: "Compute the example: 1 minus 2 is minus 1, 2 minus 0 is 2, 0 minus 3 is minus 3. Ask: what if the relevant token is 500 positions away? A CNN needs many layers to connect them. Attention connects any two positions in one step, with weights computed from the content. That is the motivation for the rest of the day.",
    });
    d.concept({
      title: "Attention is a soft dictionary lookup",
      intuition: [
        "Each token asks a **query** q: what am I looking for?",
        "Each token offers a **key** k (what I contain) and a **value** v (what I pass on)",
        "Score = **q·k** (Day 2: similarity). Softmax turns scores into weights that sum to 1",
        "Output = **weighted average of values**: a hard lookup picks one, attention blends",
      ],
      def: String.raw`\mathbf{o}=\sum_{j}\alpha_j\mathbf{v}_j,\qquad \alpha_j=\frac{e^{\mathbf{q}\cdot\mathbf{k}_j/\sqrt{d_k}}}{\sum_{j'}e^{\mathbf{q}\cdot\mathbf{k}_{j'}/\sqrt{d_k}}}`,
      defNote: "In 'The animal didn't cross the street because it was tired', the query of 'it' should score highest against the key of 'animal'.",
      notes: "Use the dictionary analogy: a Python dict returns the value whose key exactly matches. Attention returns a mixture of all values, weighted by how well each key matches. Because everything is differentiable, the model learns what to query for and what to advertise in keys.",
    });

    d.section("Scaled dot-product attention");
    d.equation({
      title: "The attention equation, symbol by symbol",
      eq: String.raw`Q=XW_Q,\ \ K=XW_K,\ \ V=XW_V,\qquad \mathrm{Attn}(Q,K,V)=\mathrm{softmax}\!\Big(\frac{QK^{\top}}{\sqrt{d_k}}+M\Big)V`,
      legend: [
        [String.raw`X\in\mathbb{R}^{n\times d}`, "n tokens, each a d-dimensional vector"],
        [String.raw`W_Q,W_K\in\mathbb{R}^{d\times d_k}`, "learned projections to queries and keys"],
        [String.raw`QK^{\top}\in\mathbb{R}^{n\times n}`, "all pairwise scores: row i = token i's query against every key"],
        [String.raw`M`, "mask: 0 where allowed, −∞ where forbidden"],
      ],
      foot: "softmax is applied ==row by row==: each token gets its own probability distribution over the tokens it may attend to.",
      eqSize: 23,
      notes: "Walk through the shapes: X is n by d, Q and K are n by d_k, QK transpose is n by n, V is n by d_v, so the output is n by d_v. The only learned parameters are the three projection matrices. The mask M is added before the softmax; e to the minus infinity is zero, so masked positions receive exactly zero weight.",
    });
    const flow = D.graph({
      W: 1200, H: 380,
      nodes: [
        { id: "X", x: 80, y: 190, w: 110, h: 64, label: "$X$", sub: "n × d", fill: P.soft.blue, stroke: "blue", fs: 24 },
        { id: "Q", x: 320, y: 70, w: 120, h: 58, label: "$Q$", fill: P.soft.violet, stroke: "violet", fs: 22 },
        { id: "K", x: 320, y: 190, w: 120, h: 58, label: "$K$", fill: P.soft.violet, stroke: "violet", fs: 22 },
        { id: "V", x: 320, y: 310, w: 120, h: 58, label: "$V$", fill: P.soft.green, stroke: "green", fs: 22 },
        { id: "S", x: 580, y: 130, w: 200, h: 64, label: "$S=QK^{\\top}/\\sqrt{d_k}$", sub: "n × n scores", fill: "white", stroke: "navy", fs: 19 },
        { id: "A", x: 840, y: 130, w: 210, h: 64, label: "$A=\\mathrm{softmax}(S+M)$", sub: "rows sum to 1", fill: P.soft.gold, stroke: "gold", fs: 19 },
        { id: "O", x: 1080, y: 250, w: 170, h: 64, label: "$O=AV$", sub: "n × d_v", fill: P.soft.green, stroke: "green", fs: 21 },
      ],
      edges: [
        { a: "X", b: "Q", color: "navy", label: "$W_Q$", lfs: 17 },
        { a: "X", b: "K", color: "navy", label: "$W_K$", lfs: 17 },
        { a: "X", b: "V", color: "navy", label: "$W_V$", lfs: 17 },
        { a: "Q", b: "S", color: "violet" }, { a: "K", b: "S", color: "violet" },
        { a: "S", b: "A", color: "navy" }, { a: "A", b: "O", color: "gold", width: 3 }, { a: "V", b: "O", color: "green", width: 3 },
      ],
    });
    d.diagram({
      title: "Attention as a data-flow graph",
      diag: flow,
      chips: [
        ["Three views of X", "The same tokens are projected three ways: to ask, to be found, to be passed on."],
        ["Scores", "One matrix product computes all n² query-key similarities in parallel."],
        ["Mixing", "Row i of A says how much of every value token i takes."],
      ],
      notes: "Trace one token's path: its row of X becomes a query; that query meets every key in S; softmax turns the row into weights; the weights mix the rows of V. Contrast with yesterday's MLP: there the mixing matrix W was fixed after training. Here A changes for every input sentence.",
    });
    d.example({
      title: "Worked example: one query attends to three tokens",
      problem: "d_k = 2. Query of 'sat': q = (1, 0). Keys: k₁ = (0, 1), k₂ = (2, 0), k₃ = (1, 1). Values: v₁ = (1, 0), v₂ = (0, 1), v₃ = (1, 1).",
      problemEq: String.raw`\mathbf{q}=\begin{bmatrix}1\\0\end{bmatrix},\ K=\begin{bmatrix}0&1\\2&0\\1&1\end{bmatrix}`,
      steps: [
        { eq: String.raw`\mathbf{q}\cdot\mathbf{k}_j=(0,\ 2,\ 1)`, note: "raw scores" },
        { eq: String.raw`\div\sqrt2:\ (0,\ 1.414,\ 0.707)`, note: "scale" },
        { eq: String.raw`e^{s}=(1,\ 4.113,\ 2.028),\ \ \textstyle\sum=7.141`, note: "exponentiate" },
        { eq: String.raw`\boldsymbol\alpha=(0.140,\ 0.576,\ 0.284)`, note: "normalise" },
        { eq: String.raw`\mathbf{o}=0.140\,\mathbf{v}_1+0.576\,\mathbf{v}_2+0.284\,\mathbf{v}_3=(0.424,\ 0.860)`, note: "mix values" },
      ],
      answer: "Token 2 has the best-matching key, so it gets ==58% of the weight==; the output leans towards v₂",
      notes: "Let students do each line on a calculator. Check: the weights sum to 1.000. The output's first coordinate is 0.140 plus 0.284 = 0.424, the second is 0.576 plus 0.284 = 0.860. Ask what happens if we doubled q: the scores double, the softmax gets sharper, and the weight on token 2 rises to about 0.77. That leads to the next slide on scaling.",
    });
    d.figure({
      title: "Why divide by √d_k: keep the softmax soft",
      fig: F("d12_scaling"), wide: true,
      points: [
        { icon: "dice", text: "If q, k have independent entries with mean 0, variance 1: Var(q·k) = d_k" },
        { icon: "warn", text: "Large d_k → huge scores → softmax becomes **one-hot** → gradients ≈ 0" },
        { icon: "check", text: "Dividing by √d_k makes ==Var = 1== for every d_k" },
      ],
      notes: "Derivation: q dot k is a sum of d_k products q_i k_i. Each product has mean 0 and variance 1 (independent, unit variance). Variances add, so the sum has variance d_k, standard deviation root d_k. Left plot: simulated standard deviation grows like root d, and the scaled version stays at 1. Right plot: with d_k = 512 the unscaled softmax puts nearly all weight on one key. The softmax derivative p(1 minus p) is then near zero, so learning stalls. Same variance argument as He initialisation yesterday.",
    });

    d.section("Masks, heads and positions");
    const tok = ["I", "love", "math", "!"];
    const mask = html(
      D.row([
        D.grid({ vals: [[2.1, 0.3, -0.5, 1.2], [0.4, 1.8, 0.9, -0.2], [-1.0, 1.5, 0.8, 0.1], [0.2, 0.2, 0.9, 0.3]], color: "violet", rowLabels: tok, colLabels: tok, title: "scores S (queries × keys)", cell: 62, fs: 17, fmt: (v) => v.toFixed(1) }),
        D.op("+"),
        D.grid({ vals: [["0", "−∞", "−∞", "−∞"], ["0", "0", "−∞", "−∞"], ["0", "0", "0", "−∞"], ["0", "0", "0", "0"]], color: "coral", rowLabels: tok, colLabels: tok, title: "causal mask M", cell: 52, fs: 17 }),
        D.op("→"),
        D.grid({ vals: [[1.0, "·", "·", "·"], [0.2, 0.8, "·", "·"], [0.05, 0.63, 0.32, "·"], [0.19, 0.19, 0.39, 0.22]], color: "green", rowLabels: tok, colLabels: tok, title: "weights A = softmax(S + M)", cell: 62, fs: 17, max: 1, fmt: (v) => (typeof v === "number" ? v.toFixed(2) : v) }),
      ], { gap: 14 }),
      { w: 12 }
    );
    d.diagram({
      title: "Causal masking: a language model may not peek ahead",
      diag: mask,
      chips: [
        ["Rule", "Token t may attend to positions 1…t only, so training matches generation."],
        ["Mechanism", "Add −∞ above the diagonal before softmax: e^(−∞) = 0."],
        ["Check", "Each row of A sums to 1; row 2 is softmax(0.4, 1.8) = (0.2, 0.8)."],
      ],
      notes: "Verify row 2 with the class: e to the 0.4 is 1.49, e to the 1.8 is 6.05, so the weights are 0.20 and 0.80. Row 3: e^-1 = 0.37, e^1.5 = 4.48, e^0.8 = 2.23, sum 7.08, weights 0.05, 0.63, 0.32; the slide rounds for display. The mask is what makes GPT a next-token predictor. BERT uses no causal mask (bidirectional) but uses padding masks to ignore empty positions.",
    });
    d.equation({
      title: "Multi-head attention: several lookups in parallel",
      eq: String.raw`\mathrm{head}_i=\mathrm{Attn}\big(XW_Q^{(i)},\,XW_K^{(i)},\,XW_V^{(i)}\big),\qquad \mathrm{MHA}(X)=\big[\mathrm{head}_1;\dots;\mathrm{head}_h\big]\,W_O`,
      legend: [
        [String.raw`h`, "number of heads (12 in GPT-2 small, 96 in GPT-3)"],
        [String.raw`d_k=d/h`, "each head works in a smaller subspace, so total cost matches one big head"],
        [String.raw`[\,\cdot\,;\,\cdot\,]`, "concatenate the head outputs side by side: n × d"],
        [String.raw`W_O\in\mathbb{R}^{d\times d}`, "mixes the heads back together"],
      ],
      foot: "Different heads learn different relations: one tracks ==syntax==, one the ==previous token==, one ==coreference==.",
      eqSize: 23,
      notes: "With d = 768 and h = 12, each head has d_k = 64. Parameter count of MHA: 4 d squared, about 2.4 million for d = 768. Interpretability research (induction heads, Olsson et al. 2022) finds heads with clean algorithmic roles. Variants for inference speed: multi-query and grouped-query attention share K and V across heads.",
    });
    d.figure({
      title: "Positional encodings: attention alone ignores order",
      fig: F("d12_posenc"), wide: true,
      points: [
        { icon: "random", text: "Attention is **permutation-equivariant**: shuffle the tokens, outputs shuffle the same way" },
        { icon: "compass", text: "Fix: add a position signal. Sinusoidal: PE(p, 2i) = sin(p / 10000^(2i/d))" },
        { icon: "cog", text: "Each pair of dimensions is a **clock** at its own speed: fast dims for local order, slow for global" },
      ],
      notes: "Without positions, 'dog bites man' and 'man bites dog' give the same set of outputs. The left heatmap shows the sinusoidal encoding for 64 positions and 64 dimensions; the right shows three dimensions as waves of different wavelength. A key property: PE(p + k) is a fixed linear function (a rotation) of PE(p), so relative offsets are easy to read out. That property leads directly to RoPE on the next slide.",
    });
    d.compare({
      title: "Three ways to encode position",
      cols: [
        { head: "Sinusoidal (2017)", icon: "chart", eq: String.raw`\mathbf{x}_p\leftarrow\mathbf{x}_p+\mathrm{PE}(p)`, items: ["Fixed, no parameters", "Added once at the input", "Original transformer"] },
        { head: "Learned absolute", icon: "table", eq: String.raw`\mathbf{x}_p\leftarrow\mathbf{x}_p+\mathbf{e}_p,\ \ \mathbf{e}_p\ \text{learned}`, items: ["One learned vector per position", "Cannot go past the trained length", "GPT-2, BERT"] },
        { head: "RoPE (2021)", icon: "compass", eq: String.raw`(R_m\mathbf{q})^{\top}(R_n\mathbf{k})=\mathbf{q}^{\top}R_{n-m}\mathbf{k}`, items: ["**Rotates** q and k by angle ∝ position", "Score depends only on the **offset n − m**", "LLaMA, Mistral, Qwen"] },
      ],
      notes: "RoPE uses the Day 3 rotation matrix. Rotations satisfy R_m transpose R_n = R_(n minus m), so the dot product of a rotated query and a rotated key depends only on the relative distance. This is why RoPE models can be extended to longer contexts by rescaling the angles (position interpolation, YaRN).",
    });

    d.section("The transformer block");
    const blk = D.graph({
      W: 1200, H: 330,
      nodes: [
        { id: "x", x: 60, y: 220, w: 90, h: 60, label: "$\\mathbf{x}$", fill: P.soft.blue, stroke: "blue", fs: 24 },
        { id: "n1", x: 200, y: 220, w: 110, h: 60, label: "LayerNorm", fill: "white", stroke: "line", fs: 17 },
        { id: "a", x: 370, y: 220, w: 150, h: 60, label: "Masked MHA", fill: P.soft.violet, stroke: "violet", fs: 18 },
        { id: "p1", x: 510, y: 220, w: 50, shape: "circle", label: "+", fill: P.soft.gold, stroke: "gold", fs: 26 },
        { id: "n2", x: 650, y: 220, w: 110, h: 60, label: "LayerNorm", fill: "white", stroke: "line", fs: 17 },
        { id: "f", x: 820, y: 220, w: 150, h: 60, label: "FFN (MLP)", sub: "d → 4d → d", fill: P.soft.green, stroke: "green", fs: 18 },
        { id: "p2", x: 960, y: 220, w: 50, shape: "circle", label: "+", fill: P.soft.gold, stroke: "gold", fs: 26 },
        { id: "y", x: 1110, y: 220, w: 120, h: 60, label: "$\\mathbf{x}'$", fill: P.soft.blue, stroke: "blue", fs: 24 },
      ],
      edges: [
        { a: "x", b: "n1", color: "navy" }, { a: "n1", b: "a", color: "navy" }, { a: "a", b: "p1", color: "navy" },
        { a: "p1", b: "n2", color: "navy" }, { a: "n2", b: "f", color: "navy" }, { a: "f", b: "p2", color: "navy" }, { a: "p2", b: "y", color: "navy" },
        { a: "x", b: "p1", color: "teal", bend: -150, width: 3, label: "residual", lfs: 16, lofs: [0, -14] },
        { a: "p1", b: "p2", color: "teal", bend: -150, width: 3, label: "residual", lfs: 16, lofs: [0, -14] },
      ],
      extraHtml: D.label(370, 300, "tokens talk to each other", { color: "violet", fs: 15 }) + D.label(820, 300, "each token thinks alone", { color: "green", fs: 15 }),
    });
    d.diagram({
      title: "One pre-norm transformer block (GPT-style)",
      diag: blk,
      chips: [
        ["Equations", "h = x + MHA(LN(x)),   x′ = h + FFN(LN(h))."],
        ["Stack it", "GPT-2 small: 12 blocks, d = 768. LLaMA-3 8B: 32 blocks, d = 4096."],
        ["Output", "Final LN, then logits = x′ W_vocab, then softmax over the vocabulary."],
      ],
      notes: "This is every component from Days 11 and 12 together. Attention mixes information across positions; the FFN processes each position independently. LayerNorm keeps scales controlled and the residual stream carries information and gradients through depth. Parameter count per block is about 12 d squared: 4 d squared for attention and 8 d squared for the FFN.",
    });
    d.table({
      title: "Shapes and cost of one block (n tokens, width d)",
      head: ["Step", "Shapes", "FLOPs (multiply-adds)", "Memory"],
      rows: [
        ["Q, K, V projections", "(n×d)(d×d), three times", "3nd²", "3nd"],
        ["Scores QKᵀ", "(n×d)(d×n) → n×n", "**n²d**", "**n²** per head"],
        ["Softmax + mask", "n×n", "n²", "n²"],
        ["Weighted sum AV", "(n×n)(n×d)", "**n²d**", "nd"],
        ["Output projection W_O", "(n×d)(d×d)", "nd²", "nd"],
        ["FFN d → 4d → d", "(n×d)(d×4d), (n×4d)(4d×d)", "8nd²", "4nd"],
      ],
      colW: [2.7, 3.6, 3.1, 2.73],
      fontSize: 16,
      foot: "Attention is ==O(n²)== in sequence length: doubling the context quadruples score memory. FlashAttention, sparse and linear attention attack this term.",
      notes: "For short sequences the nd squared terms (projections, FFN) dominate; the n squared d terms dominate when n exceeds about 6d. Example: d = 4096, n = 32k tokens: one n by n score matrix per head is a billion entries. FlashAttention computes exactly the same result but in tiles, never materialising the full matrix. During generation, a KV cache stores past K and V so each new token costs O(n d) instead of recomputing everything.",
    });
    d.equation({
      title: "What a language model is trained to do",
      eq: String.raw`p_\theta(x_1,\dots,x_T)=\prod_{t=1}^{T}p_\theta(x_t\mid x_{<t}),\qquad \mathcal{L}(\theta)=-\frac1T\sum_{t=1}^{T}\log p_\theta(x_t\mid x_{<t}),\qquad \mathrm{PPL}=e^{\mathcal{L}}`,
      legend: [
        [String.raw`\prod_t`, "chain rule of probability (Day 7): exact, no assumption"],
        [String.raw`p_\theta(x_t\mid x_{<t})`, "softmax over the vocabulary at position t; the causal mask enforces x_{<t}"],
        [String.raw`-\log p`, "cross-entropy (Day 9) against the true next token"],
        [String.raw`\mathrm{PPL}`, "perplexity: an effective number of equally likely choices"],
      ],
      foot: "Loss 2.0 nats means perplexity e² ≈ 7.4: the model is as unsure as a fair ==7-sided die== per token.",
      eqSize: 21,
      notes: "Everything connects: the chain rule of probability factorises the sequence, the transformer with causal mask computes every conditional in parallel during training, and the loss is the cross-entropy from Day 9. All positions are trained at once, which is why transformers train so efficiently on GPUs.",
    });
    d.code({
      title: "Causal multi-head attention in NumPy",
      code: `import numpy as np

def softmax(S):
    S = S - S.max(-1, keepdims=True)   # stability (Day 9)
    E = np.exp(S); return E / E.sum(-1, keepdims=True)

def mha(X, Wq, Wk, Wv, Wo, h):
    n, d = X.shape; dk = d // h
    split = lambda M: M.reshape(n, h, dk).transpose(1, 0, 2)
    Q, K, V = split(X @ Wq), split(X @ Wk), split(X @ Wv)
    S = Q @ K.transpose(0, 2, 1) / np.sqrt(dk)  # (h, n, n)
    S += np.triu(np.full((n, n), -np.inf), 1)   # causal mask
    A = softmax(S)
    O = (A @ V).transpose(1, 0, 2).reshape(n, d)  # concat heads
    return O @ Wo, A

rng = np.random.default_rng(0); n, d, h = 4, 8, 2
X = rng.normal(size=(n, d))
W = [rng.normal(0, d**-0.5, (d, d)) for _ in range(4)]
out, A = mha(X, *W, h)
print(A[0].round(2))           # lower-triangular, rows sum to 1`,
      points: [
        "Subtract the row max before exp: same softmax, **no overflow**",
        "reshape + transpose turns one big matrix into **h heads**",
        "np.triu(…, 1) builds the **−∞ mask** above the diagonal",
        "Check: A[0] is lower-triangular and each row sums to 1",
      ],
      fontSize: 11.5,
      notes: "Have students run this and print A for each head. Then remove the mask and see the upper triangle fill in. Then remove the division by root dk with d = 512 and see the rows become nearly one-hot. Compare the output with torch.nn.functional.scaled_dot_product_attention with is_causal=True as a correctness check.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\big(QK^{\top}/\sqrt{d_k}\big)V`, read: "**Scaled dot-product attention**: score, normalise, mix.", src: "Vaswani et al. 2017" },
        { eq: String.raw`\mathrm{PE}_{(p,2i)}=\sin\!\big(p/10000^{2i/d}\big)`, read: "**Sinusoidal positions**: dimension pair i is a clock with wavelength 2π·10000^(2i/d).", src: "Vaswani et al. 2017" },
        { eq: String.raw`f_{q}(\mathbf{x}_m,m)=R^{d}_{\Theta,m}W_q\mathbf{x}_m`, read: "**RoPE**: rotate the query of position m by angles mθᵢ.", src: "Su et al. 2021" },
        { eq: String.raw`\mathbf{h}=\mathbf{x}+\mathrm{MHA}(\mathrm{LN}(\mathbf{x})),\ \ \mathbf{x}'=\mathbf{h}+\mathrm{FFN}(\mathrm{LN}(\mathbf{h}))`, read: "One **pre-norm block**; the whole model is this, stacked L times." },
      ],
      notes: "Ask students to open 'Attention Is All You Need' and find equation 1 and the position-encoding formula; they can now read both. In the RoPE paper, R is a block-diagonal matrix of 2 by 2 rotations, exactly the Day 3 rotation matrix repeated d/2 times.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Redo the worked example with q = (2, 0). What are the new weights? Is the softmax sharper or softer?" },
        { lvl: "Warm-up", text: "A 1-D convolution has kernel size 3 and 64 input and 64 output channels. How many weights? Compare with a dense layer on a length-100 sequence." },
        { lvl: "Core", text: "Prove: if q and k have i.i.d. entries with mean 0 and variance 1, then Var(q·k) = d_k." },
        { lvl: "Core", text: "Count the parameters of one GPT-2 small block (d = 768, FFN 4d). Multiply by 12 blocks." },
        { lvl: "Code", text: "Use the NumPy code to show that without positional encodings, permuting X permutes the output in the same way." },
        { lvl: "Research", text: "Prove the RoPE identity (R_m q)ᵀ(R_n k) = qᵀ R_(n−m) k for 2-D rotations, and explain why it gives relative positions." },
      ],
      notes: "Answers: 1) scores (0, 4, 2)/1.414 = (0, 2.83, 1.41); weights about (0.05, 0.77, 0.19): sharper. 2) 3 × 64 × 64 = 12,288 (plus 64 biases); dense on 100 × 64 inputs to 100 × 64 outputs needs 6400 squared, about 41 million. 3) each product q_i k_i has mean 0, variance E[q²]E[k²] = 1, independent terms add. 4) attention 4 × 768² = 2.36M, FFN 8 × 768² = 4.72M, total about 7.1M per block, 85M for 12 blocks (plus embeddings gives the famous 124M). 5) without PE, MHA(PX) = P MHA(X) when no causal mask is used. 6) R_m transpose = R_(−m), and rotations compose by adding angles.",
    });
    d.recap({
      points: [
        "Convolution: **shared fixed** weights; attention: weights ==computed from the data==",
        "Attention = softmax(QKᵀ/√d_k + M) V: score, scale, mask, normalise, mix",
        "√d_k keeps score variance at 1 so the **softmax does not saturate**",
        "Multi-head = several lookups in subspaces; positions via **sinusoids or RoPE**",
        "Block: x + MHA(LN x), then + FFN(LN ·); cost **O(n²d + nd²)**",
      ],
      next: "Generative models",
      nextTopics: ["Autoencoders and VAEs (the ELBO)", "GANs as a minimax game", "Normalising flows", "Diffusion models"],
      notes: "Tomorrow we move from predicting labels and next tokens to generating whole images and data: VAEs, GANs, flows and diffusion. Each one is a different answer to the question of how to model a complicated probability distribution.",
    });
  },
};
