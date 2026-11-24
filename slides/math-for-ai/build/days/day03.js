// Day 3 — Matrices: transformations and layers
module.exports = {
  day: 3,
  short: "Matrices, transformations and layers",
  file: "Day-03-Matrices-Transformations-and-Layers",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Matrices: Transformations and Layers",
      subtitle: "A matrix is a machine that moves space. Every neural-network layer is one",
      topics: ["Linear maps", "Matrix multiply", "Shapes", "Inverse and determinant", "Rank"],
      eq: String.raw`\mathbf{y}=W\mathbf{x}+\mathbf{b}`,
      notes: "Today we meet the workhorse of deep learning. More than 90 percent of the compute in training a transformer is matrix multiplication. We will see matrices two ways: as tables of numbers and as transformations that stretch, rotate and squash space. By the end, a dense layer y = Wx + b should feel completely transparent.",
    });
    d.objectives({
      goals: [
        "Read a matrix as a **table**, a **stack of vectors** and a **transformation**",
        "Multiply matrices by hand and predict output **shapes** instantly",
        "Write a whole neural layer, on a whole batch, as ==XW + b==",
        "Interpret **determinant, inverse and rank** geometrically",
        "Solve a small linear system and connect it to least squares",
      ],
      why: "A transformer is mostly matrix multiplications: projections to Q, K, V, attention, MLP blocks. ==GPUs are matrix-multiply machines==. Reading shapes fluently is the most practical skill in AI engineering.",
      prereq: "Day 2: vectors, dot product, norms.",
      notes: "Promise the class that after today they can debug most shape errors by reasoning, without trial and error.",
    });

    d.section("What a matrix is");
    d.concept({
      title: "Three ways to see a matrix",
      intuition: [
        "**Table**: m rows × n columns of numbers, e.g. a dataset with one example per row",
        "**Stack of vectors**: rows are vectors, columns are vectors",
        "**Transformation**: a function that takes a vector in ℝⁿ and returns one in ℝᵐ",
        "The columns of A show ==where the basis vectors land==",
      ],
      def: String.raw`A=\begin{bmatrix}a_{11}&a_{12}&\cdots&a_{1n}\\ \vdots&&\ddots&\vdots\\ a_{m1}&a_{m2}&\cdots&a_{mn}\end{bmatrix}\in\mathbb{R}^{m\times n}`,
      defNote: "aᵢⱼ sits in row i, column j. A maps ℝⁿ → ℝᵐ via x ↦ Ax. It is **linear**: A(αx + βy) = αAx + βAy.",
      eqSize: 22,
      notes: "Ask students to keep the three views in mind simultaneously. The data-scientist view: rows are examples, columns are features. The geometric view: A acts on space. The key fact for intuition: the first column of A is where the vector (1, 0, ..., 0) goes, the second column is where (0, 1, 0, ...) goes, and so on. Linearity means lines stay lines and the origin stays fixed.",
    });
    d.figure({
      title: "Matrices move space: scale, rotate, shear, collapse",
      fig: F("d03_transform"),
      wide: true,
      caption: "Grey: the original grid. Blue: the grid after the matrix acts. Red and green arrows: where the basis vectors e₁ and e₂ land, which are the matrix columns.",
      notes: "Walk left to right. Scaling stretches the x direction by 2 and shrinks y by half. Rotation by 30 degrees uses cos and sin in the matrix entries. Shear slides the top of the grid sideways, like pushing a deck of cards. The last matrix squashes the entire plane onto a line: information is lost and cannot be recovered. That is a rank-1 matrix, and it has determinant 0. Neural networks learn matrices that rotate and stretch data into shapes where classes become separable.",
    });

    d.section("Matrix multiplication");
    const mm = html(
      D.row([
        D.grid({ vals: [[1, 2, 0], [0, 1, 3]], color: "blue", hi: [[0, 0], [0, 1], [0, 2]], title: "A  (2×3)" }),
        D.op("×"),
        D.grid({ vals: [[2, 1], [1, 0], [4, 2]], color: "green", hi: [[0, 0], [1, 0], [2, 0]], title: "B  (3×2)" }),
        D.op("="),
        D.grid({ vals: [[4, 1], [13, 6]], color: "violet", hi: [[0, 0]], title: "C = AB  (2×2)" }),
        `<div style="font-size:21px;color:${P.navy};margin-left:20px;line-height:1.7">$c_{11}=\\mathbf{a}_{1,:}\\cdot\\mathbf{b}_{:,1}$<br>$=1\\cdot2+2\\cdot1+0\\cdot4=4$<br><span style="color:${P.muted};font-size:17px">row 1 of A · column 1 of B</span></div>`,
      ], { gap: 14 }),
      { w: 11.5 }
    );
    d.diagram({
      title: "Matrix multiplication = every row dotted with every column",
      diag: mm,
      chips: [
        ["Entry rule", "cᵢⱼ = Σₖ aᵢₖ bₖⱼ: row i of A dotted with column j of B."],
        ["Shape rule", "(m×n)(n×p) → (m×p). Inner sizes must match."],
        ["Not commutative", "AB ≠ BA in general; order means 'apply B first, then A' to x."],
      ],
      notes: "Highlight the gold-outlined cells: row 1 of A and column 1 of B produce the top-left entry of C. Compute a second entry live, c21 = 0 times 2 + 1 times 1 + 3 times 4 = 13. Students should physically trace rows and columns with their fingers. Then state the shape rule and drill it: inner dimensions cancel, outer dimensions survive.",
    });
    d.equation({
      title: "The definition, and the shape rule you will use every day",
      eq: String.raw`(AB)_{ij}=\sum_{k=1}^{n}A_{ik}B_{kj}\qquad \underset{m\times n}{A}\;\underset{n\times p}{B}=\underset{m\times p}{C}`,
      legend: [
        [String.raw`i`, "row of the output, comes from A"],
        [String.raw`j`, "column of the output, comes from B"],
        [String.raw`k`, "the shared index that gets summed away"],
        [String.raw`(AB)^{\top}`, "equals BᵀAᵀ: transposing reverses the order"],
        [String.raw`I`, "identity: AI = IA = A, the 'do nothing' matrix"],
        [String.raw`\mathcal{O}(mnp)`, "cost: m·n·p multiply-adds"],
      ],
      foot: "Shape check before every multiply: ==(32×768)(768×3072) → (32×3072)== is a transformer MLP layer on 32 tokens.",
      notes: "The summed index k is the key concept for reading einsum notation later. The cost m times n times p explains why large models are expensive: a 4096 by 4096 weight applied to 2048 tokens is about 34 billion multiply-adds for one layer. The transpose-reversal rule appears constantly in backpropagation derivations on Day 6.",
    });
    d.example({
      title: "Worked example: rotate a point by 90°",
      problem: "The rotation matrix by angle φ is R = [[cos φ, −sin φ], [sin φ, cos φ]]. Rotate x = (3, 1) by 90°, then check its length is unchanged.",
      problemEq: String.raw`R_{90^\circ}=\begin{bmatrix}0&-1\\1&0\end{bmatrix}`,
      steps: [
        { eq: String.raw`R\mathbf{x}=\begin{bmatrix}0\cdot3+(-1)\cdot1\\ 1\cdot3+0\cdot1\end{bmatrix}`, note: "row · column" },
        { eq: String.raw`R\mathbf{x}=\begin{bmatrix}-1\\3\end{bmatrix}`, note: "the rotated point" },
        { eq: String.raw`\|\mathbf{x}\|=\sqrt{10},\quad \|R\mathbf{x}\|=\sqrt{1+9}=\sqrt{10}`, note: "length preserved" },
        { eq: String.raw`R^{\top}R=I`, note: "R is orthogonal" },
      ],
      answer: "Rx = (−1, 3). Rotations are ==orthogonal matrices==: they preserve lengths and angles",
      notes: "Orthogonal matrices matter in AI: rotary position embeddings (RoPE) in LLaMA rotate query and key vectors by position-dependent angles, preserving their lengths. Orthogonal initialisation helps train deep and recurrent networks because repeated multiplication neither explodes nor shrinks vectors.",
    });

    d.section("A neural layer is a matrix");
    const layer = D.graph({
      W: 1260, H: 380,
      nodes: [
        ...[0, 1, 2].map((i) => ({ id: "x" + i, x: 160, y: 90 + i * 100, w: 64, shape: "circle", fill: "blue", label: `$x_${i + 1}$`, color: "white" })),
        ...[0, 1].map((j) => ({ id: "h" + j, x: 520, y: 140 + j * 100, w: 64, shape: "circle", fill: "violet", label: `$z_${j + 1}$`, color: "white" })),
        ...[0, 1].map((j) => ({ id: "a" + j, x: 720, y: 140 + j * 100, w: 64, shape: "circle", fill: "green", label: `$h_${j + 1}$`, color: "white" })),
      ],
      edges: [
        ...[0, 1, 2].flatMap((i) => [0, 1].map((j) => ({ a: "x" + i, b: "h" + j, color: "line", width: 2, label: i === 0 && j === 0 ? "$w_{11}$" : i === 2 && j === 1 ? "$w_{23}$" : undefined, lfs: 17 }))),
        { a: "h0", b: "a0", color: "green", label: "$\\phi$" }, { a: "h1", b: "a1", color: "green", label: "$\\phi$" },
      ],
      extraHtml:
        D.label(160, 25, "input $\\mathbf{x}\\in\\mathbb{R}^3$", { color: "blue", bold: true, fs: 18 }) +
        D.label(520, 60, "$\\mathbf{z}=W\\mathbf{x}+\\mathbf{b}$", { color: "violet", bold: true, fs: 19 }) +
        D.label(720, 60, "$\\mathbf{h}=\\phi(\\mathbf{z})$", { color: "green", bold: true, fs: 19 }) +
        `<div style="position:absolute;left:820px;top:110px;font-size:17px;white-space:nowrap;color:${P.navy}">$\\begin{bmatrix}z_1\\\\z_2\\end{bmatrix}=\\begin{bmatrix}w_{11}&w_{12}&w_{13}\\\\w_{21}&w_{22}&w_{23}\\end{bmatrix}\\begin{bmatrix}x_1\\\\x_2\\\\x_3\\end{bmatrix}+\\begin{bmatrix}b_1\\\\b_2\\end{bmatrix}$<div style="font-size:16px;color:${P.muted};margin-top:10px">$W\\in\\mathbb{R}^{2\\times3}$: one row per output neuron</div></div>`,
    });
    d.diagram({
      title: "A dense layer: every arrow is one entry of W",
      diag: layer,
      chips: [
        ["Row j of W", "the weights of neuron j: it computes one dot product wⱼ·x."],
        ["Bias b", "one number per output neuron, shifts its threshold."],
        ["Activation φ", "applied element-wise (ReLU, GELU). Without it, layers collapse into one matrix."],
      ],
      notes: "Map each picture element to the formula. Six arrows, six weights, arranged as a 2 by 3 matrix. Each output neuron is a row: its dot product with the input. Mention why the activation function is essential: the product of two matrices is just another matrix, so stacking linear layers without non-linearity gives no extra power. That is why deep networks interleave matrices and activations.",
    });
    d.example({
      title: "Worked example: a layer on a batch of inputs",
      problem: "Two examples are stacked as rows of X. The layer has weights W (3 inputs → 2 outputs) and bias b = (1, −1). Compute H = ReLU(XW + b).",
      problemEq: String.raw`X=\begin{bmatrix}1&0&2\\0&1&1\end{bmatrix},\ W=\begin{bmatrix}1&-1\\2&0\\0&1\end{bmatrix}`,
      steps: [
        { eq: String.raw`XW=\begin{bmatrix}1+0+0 & -1+0+2\\ 0+2+0 & 0+0+1\end{bmatrix}=\begin{bmatrix}1&1\\2&1\end{bmatrix}`, note: "(2×3)(3×2) → 2×2" },
        { eq: String.raw`XW+\mathbf{b}=\begin{bmatrix}2&0\\3&0\end{bmatrix}`, note: "b added to every row (broadcast)" },
        { eq: String.raw`H=\mathrm{ReLU}(\cdot)=\begin{bmatrix}2&0\\3&0\end{bmatrix}`, note: "negatives → 0" },
      ],
      answer: "Each row of H is one example's hidden representation. Shapes: ==(batch × in)(in × out) → (batch × out)==",
      notes: "Note the convention switch: papers often write Wx for a single column vector, while code uses XW with examples as rows so the batch is the first dimension. Both are the same computation, transposed. Broadcasting the bias means adding the same vector to every row; NumPy and PyTorch do this automatically.",
    });

    d.section("Inverse, determinant, rank");
    d.figure({
      title: "The determinant: how much a matrix scales area",
      fig: F("d03_det"),
      points: [
        { icon: "cube", text: "|det A| = factor by which **area** (or volume) is scaled" },
        { icon: "random", text: "det A < 0: the transformation also **flips** orientation" },
        { icon: "warn", text: "det A = 0: space is **squashed flat**; A has no inverse" },
      ],
      notes: "For a 2 by 2 matrix [[a, b], [c, d]], det = ad - bc. Here 2 times 2 minus 1 times 0.5 = 3.5, matching the area of the parallelogram. Determinants appear in AI in normalising flows (Day 13): when a generative model transforms a simple distribution, the log-determinant of the Jacobian tracks how probability density stretches.",
    });
    d.compare({
      title: "Inverse and rank: can the transformation be undone?",
      cols: [
        { head: "Inverse A⁻¹", icon: "random", eq: String.raw`A^{-1}A=I,\ \ \begin{bmatrix}a&b\\c&d\end{bmatrix}^{-1}=\tfrac{1}{ad-bc}\begin{bmatrix}d&-b\\-c&a\end{bmatrix}`, eqH: 1.0, items: ["Undoes A: if y = Ax then x = A⁻¹y", "Exists only if det A ≠ 0 (square, full rank)", "In code, **solve** Ax = y; never form A⁻¹ explicitly"] },
        { head: "Rank", icon: "layers", eq: String.raw`\mathrm{rank}(A)=\#\text{independent columns}`, eqH: 1.0, items: ["Dimension of the output space A can reach", "Rank-deficient = information lost", "**Low rank** = few underlying factors: the idea behind LoRA and compression (Day 4)"] },
      ],
      foot: "A 4096×4096 weight update with rank 8 needs only ==2 × 4096 × 8 ≈ 65k numbers instead of 16.8M==. That is LoRA.",
      notes: "Rank is the number of genuinely independent directions in the matrix. If one column is a multiple of another, it adds nothing new. Numerically, solving a linear system with np.linalg.solve is faster and more stable than computing an inverse and multiplying. The LoRA footnote previews tomorrow: fine-tuning large models by learning a low-rank update.",
    });
    d.example({
      title: "Worked example: solving a linear system",
      problem: "A shop sells pens and notebooks. 2 pens + 1 notebook cost ₹50; 1 pen + 3 notebooks cost ₹100. Find the prices.",
      problemEq: String.raw`\begin{bmatrix}2&1\\1&3\end{bmatrix}\begin{bmatrix}p\\n\end{bmatrix}=\begin{bmatrix}50\\100\end{bmatrix}`,
      steps: [
        { eq: String.raw`\det A=2\cdot3-1\cdot1=5\neq0`, note: "invertible" },
        { eq: String.raw`A^{-1}=\tfrac15\begin{bmatrix}3&-1\\-1&2\end{bmatrix}`, note: "2×2 inverse formula" },
        { eq: String.raw`\begin{bmatrix}p\\n\end{bmatrix}=\tfrac15\begin{bmatrix}150-100\\-50+200\end{bmatrix}=\begin{bmatrix}10\\30\end{bmatrix}`, note: "x = A⁻¹y" },
      ],
      answer: "Pen ₹10, notebook ₹30. With more equations than unknowns we use ==least squares: x = (AᵀA)⁻¹Aᵀy==",
      notes: "Check the answer: 2 times 10 + 30 = 50, and 10 + 90 = 100. Then generalise: in machine learning we have many more equations (data points) than unknowns (parameters), so no exact solution exists. Least squares finds the x that minimises the squared error, and its formula, the normal equation, is linear regression in closed form.",
    });
    d.code({
      title: "Matrices in code: shapes, broadcasting and einsum",
      code: `import torch

X = torch.randn(32, 768)      # batch of 32 tokens
W = torch.randn(768, 3072)    # MLP up-projection
b = torch.zeros(3072)

H = torch.relu(X @ W + b)     # (32, 3072), b broadcasts
print(H.shape)

# solve instead of invert
A = torch.tensor([[2., 1.], [1., 3.]])
y = torch.tensor([50., 100.])
x = torch.linalg.solve(A, y)  # tensor([10., 30.])

# rank and determinant
torch.linalg.matrix_rank(A), torch.linalg.det(A)

# einsum: name the indices, sum the shared one
C = torch.einsum("ik,kj->ij", X, W)   # same as X @ W
# batched: (batch, tokens, d) x (d, d_out)
T = torch.randn(4, 128, 768)
out = torch.einsum("btd,de->bte", T, W)  # (4,128,3072)`,
      points: [
        "Annotate every tensor with its **shape**; most bugs are shape bugs",
        "Bias b of shape (3072,) is **broadcast** across the 32 rows",
        "linalg.solve is faster and more accurate than inv(A) @ y",
        "**einsum** writes the index formula Σₖ AᵢₖBₖⱼ directly; papers use the same notation",
      ],
      fontSize: 12,
      notes: "Einsum is worth teaching early because it mirrors the index notation of papers. ik,kj->ij literally says: sum over the shared index k. In attention code you will see strings like bhqd,bhkd->bhqk, which is batched Q times K transpose across heads.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathbf{h}^{(\ell)}=\phi\big(W^{(\ell)}\mathbf{h}^{(\ell-1)}+\mathbf{b}^{(\ell)}\big)`, read: "Layer ℓ takes the previous layer's output, applies its own **weights and bias**, then an activation φ." },
        { eq: String.raw`Q=XW_Q,\ K=XW_K,\ V=XW_V,\quad W_\ast\in\mathbb{R}^{d\times d_k}`, read: "Queries, keys and values are three **linear projections** of the same token matrix X." },
        { eq: String.raw`\hat{\boldsymbol\beta}=(X^{\top}X)^{-1}X^{\top}\mathbf{y}`, read: "Linear regression coefficients in **closed form** (normal equation)." },
        { eq: String.raw`W'=W+BA,\ \ B\in\mathbb{R}^{d\times r},\ A\in\mathbb{R}^{r\times k},\ r\ll d`, read: "Fine-tune by adding a **low-rank** update BA instead of changing all of W (LoRA)." },
      ],
      notes: "These four lines are now readable. The superscript in brackets indexes layers. The asterisk in W star is shorthand for any of Q, K, V. r much less than d means the rank r is tiny compared with the dimension, which is what makes LoRA cheap.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Give the output shape, or say 'invalid': (5×3)(3×7); (4×2)(4×2); (2×6)ᵀ(2×6); (B×T×d)(d×4d)." },
        { lvl: "Warm-up", text: "Multiply by hand.", eq: String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}\begin{bmatrix}0&1\\1&0\end{bmatrix}` },
        { lvl: "Core", text: "Find AB and BA for the matrices in problem 2 and show AB ≠ BA. Describe geometrically what B does." },
        { lvl: "Core", text: "Compute det and the inverse of A = [[4, 7], [2, 6]]. Verify AA⁻¹ = I." },
        { lvl: "Code", text: "Count parameters of an MLP 784 → 256 → 128 → 10 (weights and biases). Verify with sum(p.numel()) in PyTorch." },
        { lvl: "Challenge", text: "Show that two linear layers without activation, W₂(W₁x + b₁) + b₂, equal one linear layer. What are its W and b?" },
      ],
      notes: "Answers: 1) 5x7; invalid; 6x6; B by T by 4d. 2) [[2, 1], [4, 3]]. 3) BA = [[3, 4], [1, 2]]; B swaps coordinates, so AB swaps columns of A and BA swaps rows. 4) det = 10, inverse = 1/10 [[6, -7], [-2, 4]]. 5) 784*256+256 + 256*128+128 + 128*10+10 = 235,146. 6) W = W2 W1, b = W2 b1 + b2.",
    });
    d.recap({
      points: [
        "A matrix is a table, a stack of vectors, and a **linear transformation** of space",
        "(AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ; shapes (m×n)(n×p) → (m×p); ==AB ≠ BA==",
        "A dense layer on a batch is **XW + b** followed by an activation",
        "**det** = area scaling; det = 0 means information is lost and no inverse exists",
        "**Rank** counts independent directions: low rank = compressible (LoRA)",
      ],
      next: "Eigenvalues, SVD and PCA",
      nextTopics: ["Eigenvectors: directions that only stretch", "Singular value decomposition", "PCA for dimensionality reduction", "Low-rank models and LoRA"],
      notes: "Tomorrow answers the question: which directions does a matrix treat specially? That leads to eigenvectors, the SVD and PCA, the most powerful decomposition in applied math.",
    });
  },
};
