// Day 4 — Eigenvalues, SVD and PCA
module.exports = {
  day: 4,
  short: "Eigenvalues, SVD and PCA",
  file: "Day-04-Eigenvalues-SVD-and-PCA",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Eigenvalues, SVD and PCA",
      subtitle: "The special directions of a matrix: how to compress data, find structure and fine-tune giant models cheaply",
      topics: ["Eigenvectors", "Diagonalisation", "SVD", "Low rank", "PCA", "LoRA"],
      eq: String.raw`A=U\Sigma V^{\top}`,
      notes: "Today is the summit of linear algebra for AI. Yesterday a matrix was a transformation. Today we ask which directions it treats specially, and we find that every matrix, no matter how messy, is just rotate, stretch, rotate. That fact, the singular value decomposition, gives us PCA, image compression, recommender systems, and LoRA fine-tuning of LLMs.",
    });
    d.objectives({
      goals: [
        "Define **eigenvectors and eigenvalues** and find them for a 2×2 matrix",
        "Diagonalise a symmetric matrix as **QΛQᵀ** and explain why it helps",
        "Read the **SVD** as rotate → stretch → rotate",
        "Use singular values for **low-rank approximation** and compression",
        "Run **PCA** step by step and connect low rank to ==LoRA==",
      ],
      why: "Eigen-thinking appears everywhere: PCA for visualising embeddings, spectral analysis of training stability, PageRank, and ==LoRA==, which fine-tunes billion-parameter models by learning low-rank updates.",
      prereq: "Day 3: matrix multiplication, determinant, rank, orthogonal matrices.",
      notes: "Tell the class this is the most abstract day of the linear algebra block, so we lean heavily on pictures. Every formula will have a geometric meaning on screen.",
    });

    d.section("Eigenvectors");
    d.figure({
      title: "Eigenvectors: directions a matrix only stretches",
      fig: F("d04_eigen"),
      points: [
        { icon: "arrow", text: "Most vectors get **rotated and stretched** by A" },
        { icon: "target", text: "Red ones stay on their line: those are **eigenvectors**" },
        { icon: "ruler", text: "The stretch factor along each is its **eigenvalue** λ (here 3 and 1)" },
      ],
      notes: "Left: twelve unit vectors around a circle. Right: after applying A = [[2, 1], [1, 2]] the circle becomes an ellipse and most arrows change direction. The two red arrows along the diagonals do not change direction; they only get longer. Along (1, 1) the stretch is 3, along (1, -1) it is 1. Those are the eigenvectors and eigenvalues. Eigen is German for own: the matrix's own directions.",
    });
    d.equation({
      title: "The eigen-equation",
      eq: String.raw`A\mathbf{v}=\lambda\mathbf{v}\qquad\Longleftrightarrow\qquad \det(A-\lambda I)=0`,
      legend: [
        [String.raw`\mathbf{v}\neq\mathbf{0}`, "eigenvector: a direction that A does not turn"],
        [String.raw`\lambda`, "eigenvalue: how much A stretches along v"],
        [String.raw`|\lambda|>1`, "grows when A is applied repeatedly"],
        [String.raw`|\lambda|<1`, "shrinks when A is applied repeatedly"],
        [String.raw`\lambda<0`, "flips direction"],
        [String.raw`\det(A-\lambda I)`, "the characteristic polynomial: its roots are the λ's"],
      ],
      foot: "Repeated multiplication A^k v = λ^k v explains ==exploding and vanishing gradients== in deep and recurrent networks.",
      notes: "Derivation: A v = lambda v means (A - lambda I) v = 0 has a non-zero solution, which requires A - lambda I to squash space, so its determinant is zero. Then the RNN insight: if a recurrent weight matrix has largest eigenvalue 1.1, after 100 steps signals grow by 1.1 to the 100, about 13,800; with 0.9 they shrink to 0.00003. That is the vanishing and exploding gradient problem in one line.",
    });
    d.example({
      title: "Worked example: eigenvalues of a 2×2 matrix",
      problem: "Find the eigenvalues and eigenvectors of A.",
      problemEq: String.raw`A=\begin{bmatrix}2&1\\1&2\end{bmatrix}`,
      steps: [
        { eq: String.raw`\det\begin{bmatrix}2-\lambda&1\\1&2-\lambda\end{bmatrix}=(2-\lambda)^2-1=0`, note: "characteristic eq." },
        { eq: String.raw`\lambda^2-4\lambda+3=0\ \Rightarrow\ \lambda_1=3,\ \lambda_2=1`, note: "two roots" },
        { eq: String.raw`\lambda=3:\ \begin{bmatrix}-1&1\\1&-1\end{bmatrix}\mathbf{v}=\mathbf{0}\Rightarrow \mathbf{v}_1=\tfrac{1}{\sqrt2}(1,1)`, note: "solve (A−3I)v = 0" },
        { eq: String.raw`\lambda=1:\ \mathbf{v}_2=\tfrac{1}{\sqrt2}(1,-1)`, note: "orthogonal to v₁" },
      ],
      answer: "λ = 3, 1. Check: trace = 2 + 2 = ==λ₁ + λ₂ = 4==, det = 3 = ==λ₁λ₂==",
      notes: "Two quick sanity checks every student should know: the sum of eigenvalues equals the trace (sum of the diagonal), and the product equals the determinant. Note that the eigenvectors of this symmetric matrix are perpendicular. That is not a coincidence, as the next slide shows.",
    });
    d.concept({
      title: "Symmetric matrices: the nicest case, and the most common",
      intuition: [
        "Covariance matrices, Hessians and Gram matrices XᵀX are all **symmetric**",
        "Their eigenvalues are **real** and eigenvectors are **orthogonal**",
        "So A = rotate into the eigenbasis, **scale** each axis by λ, rotate back",
        "Positive semi-definite (all λ ≥ 0) = ==bowl-shaped== quadratic forms, key for optimisation (Day 10)",
      ],
      def: String.raw`A=A^{\top}\ \Rightarrow\ A=Q\Lambda Q^{\top},\quad Q^{\top}Q=I,\quad \Lambda=\begin{bmatrix}\lambda_1&&\\&\ddots&\\&&\lambda_n\end{bmatrix}`,
      defNote: "This is the **spectral theorem**. Q's columns are the eigenvectors. Powers become easy: Aᵏ = QΛᵏQᵀ.",
      eqSize: 22,
      notes: "The spectral theorem is the reason PCA works: the covariance matrix is symmetric, so it has an orthogonal set of eigenvectors, the principal axes. A matrix is positive semi-definite when x transpose A x is never negative, equivalently all eigenvalues are non-negative. On Day 10 we will see that the Hessian of a loss being positive definite means we are at the bottom of a bowl.",
    });

    d.section("Singular value decomposition");
    d.figure({
      title: "SVD: every matrix is rotate, stretch, rotate",
      fig: F("d04_svd"),
      wide: true,
      caption: "A circle of inputs becomes an ellipse. Vᵀ rotates, Σ stretches along the axes by the singular values σ₁ ≥ σ₂, then U rotates into place.",
      notes: "Unlike eigendecomposition, the SVD works for every matrix, square or not, symmetric or not. Follow the red and green arrows: they start as the right singular vectors, get rotated onto the axes, stretched by sigma 1 and sigma 2, then rotated by U. The singular values are always non-negative and sorted from largest to smallest. They tell us how important each direction is.",
    });
    d.equation({
      title: "The singular value decomposition",
      eq: String.raw`\underset{m\times n}{A}=\underset{m\times m}{U}\ \underset{m\times n}{\Sigma}\ \underset{n\times n}{V^{\top}}=\sum_{i=1}^{r}\sigma_i\,\mathbf{u}_i\mathbf{v}_i^{\top}`,
      legend: [
        [String.raw`U`, "orthonormal output directions (left singular vectors)"],
        [String.raw`\Sigma`, "diagonal, singular values σ₁ ≥ σ₂ ≥ … ≥ 0"],
        [String.raw`V`, "orthonormal input directions (right singular vectors)"],
        [String.raw`\mathbf{u}_i\mathbf{v}_i^{\top}`, "a rank-1 'layer' of the matrix"],
        [String.raw`r`, "rank = number of non-zero σᵢ"],
        [String.raw`\sigma_i^2`, "eigenvalues of AᵀA"],
      ],
      foot: "Keep only the top k terms: ==Aₖ = Σᵢ₌₁ᵏ σᵢuᵢvᵢᵀ== is the best rank-k approximation (Eckart–Young theorem).",
      notes: "The sum form is the most useful view: any matrix is a weighted sum of rank-one pieces, each an outer product of two vectors, sorted by importance. Truncating the sum gives the best possible low-rank approximation in both Frobenius and spectral norms. That theorem, Eckart-Young, justifies compression, denoising and low-rank adaptation.",
    });
    d.figure({
      title: "Low-rank approximation: keep the big singular values",
      fig: F("d04_lowrank"),
      wide: true,
      caption: "A 120×120 image is a matrix. Rank 15 keeps most of the picture with 15·(120+120+1) = 3,615 numbers instead of 14,400. The singular values fall off quickly.",
      notes: "Show how quickly the picture appears: rank 1 is a blurry outer product, rank 5 already shows the face, rank 15 is nearly perfect. The plot on the right is the singular value spectrum on a log scale; most energy is in the first few values. Real data, including neural network weight matrices and their updates during fine-tuning, often has this fast-decaying spectrum. That observation is the scientific basis of LoRA.",
    });
    const lora = D.graph({
      W: 1160, H: 380,
      nodes: [
        { id: "x", x: 90, y: 190, w: 110, h: 60, label: "$\\mathbf{x}\\in\\mathbb{R}^{d}$", fill: P.soft.blue, stroke: "blue" },
        { id: "W", x: 420, y: 90, w: 230, h: 110, label: "$W_0$  frozen", sub: "$d\\times d$ = 16.8M params", fill: "#E9EDF3", stroke: "muted" },
        { id: "A", x: 340, y: 290, w: 150, h: 64, label: "$A$  ($r\\times d$)", fill: P.soft.green, stroke: "green" },
        { id: "B", x: 560, y: 290, w: 150, h: 64, label: "$B$  ($d\\times r$)", fill: P.soft.green, stroke: "green" },
        { id: "plus", x: 780, y: 190, w: 54, shape: "circle", label: "+", fill: P.soft.gold, stroke: "gold", fs: 28 },
        { id: "h", x: 1020, y: 190, w: 240, h: 64, label: "$\\mathbf{h}=W_0\\mathbf{x}+BA\\mathbf{x}$", fill: P.soft.violet, stroke: "violet" },
      ],
      edges: [
        { a: "x", b: "W", color: "navy" }, { a: "x", b: "A", color: "green" }, { a: "A", b: "B", color: "green", label: "rank $r=8$" },
        { a: "W", b: "plus", color: "navy" }, { a: "B", b: "plus", color: "green" }, { a: "plus", b: "h", color: "navy" },
      ],
      extraHtml: D.label(450, 360, "trainable: $2dr$ = 65k params (0.4%)", { color: "green", bold: true, fs: 17 }),
    });
    d.diagram({
      title: "LoRA: fine-tune a giant model with a low-rank update",
      diag: lora,
      chips: [
        ["Idea", "The change ΔW needed for a new task is approximately low rank."],
        ["Math", "ΔW = BA with rank r ≪ d. Only A and B are trained."],
        ["Effect", "Fine-tune a 7B model on one GPU; swap tiny adapters per task."],
      ],
      notes: "Here d = 4096. The original weight W0 has 16.8 million numbers and stays frozen. LoRA adds a bypass: project x down to r = 8 dimensions with A, then back up with B. The product BA is a d by d matrix of rank at most 8. Trainable parameters drop from 16.8 million to 65 thousand per matrix. B is initialised to zero so training starts exactly from the pre-trained model. This is Hu et al. 2021, now standard practice.",
    });

    d.section("Principal component analysis");
    d.figure({
      title: "PCA: find the directions where data varies most",
      fig: F("d04_pca"),
      points: [
        { icon: "compass", text: "**PC1** points along the longest spread of the cloud" },
        { icon: "ruler", text: "PC2 is **orthogonal** to PC1 and captures what is left" },
        { icon: "compress", text: "Projecting onto PC1 keeps ==most variance with half the numbers==" },
      ],
      notes: "Each dot is a data point with two correlated features. PCA rotates the axes to align with the cloud. If we keep only PC1, each point becomes a single number, its projection, and we lose only the small spread along PC2. With 768-dimensional embeddings we often keep 2 or 3 components to visualise them, or 50 to 100 to denoise before clustering.",
    });
    d.example({
      title: "Worked example: PCA, step by step",
      problem: "Four 2-D points: (2, 0), (0, 2), (3, 1), (1, 3). Find the first principal component and the variance it explains.",
      steps: [
        { eq: String.raw`\boldsymbol\mu=(1.5,\,1.5);\ \ \tilde X=X-\boldsymbol\mu`, note: "1. centre the data" },
        { eq: String.raw`C=\tfrac{1}{n}\tilde X^{\top}\tilde X=\begin{bmatrix}1.25&-0.75\\-0.75&1.25\end{bmatrix}`, note: "2. covariance" },
        { eq: String.raw`\lambda_1=2.0,\ \mathbf{v}_1=\tfrac{1}{\sqrt2}(1,-1);\quad \lambda_2=0.5`, note: "3. eigen-decompose" },
        { eq: String.raw`\tfrac{\lambda_1}{\lambda_1+\lambda_2}=\tfrac{2.0}{2.5}=80\%`, note: "4. explained variance" },
      ],
      answer: "PC1 = (1, −1)/√2 explains 80% of variance. Projections z = X̃v₁ give ==1-D coordinates==",
      notes: "Centred points: (0.5, -1.5), (-1.5, 0.5), (1.5, -0.5), (-0.5, 1.5). Covariance entries: variance of x = (0.25 + 2.25 + 2.25 + 0.25)/4 = 1.25, same for y, covariance = (-0.75 - 0.75 - 0.75 - 0.75)/4 = -0.75. Eigenvalues 1.25 plus or minus 0.75. The points spread most along the anti-diagonal. In practice PCA is computed via the SVD of the centred data matrix, which is more stable.",
    });
    d.code({
      title: "SVD and PCA in a few lines",
      code: `import numpy as np

A = np.array([[2., 1.], [1., 2.]])
lam, Q = np.linalg.eigh(A)      # symmetric: eigh
# lam = [1, 3], columns of Q = eigenvectors

M = np.random.randn(500, 300)
U, S, Vt = np.linalg.svd(M, full_matrices=False)
k = 20
M_k = U[:, :k] * S[:k] @ Vt[:k]   # best rank-k approx
err = np.linalg.norm(M - M_k) / np.linalg.norm(M)

# PCA via SVD of centred data
X = np.random.randn(1000, 768)        # embeddings
Xc = X - X.mean(axis=0)
U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
Z = Xc @ Vt[:2].T                     # (1000, 2) for a plot
explained = S**2 / (S**2).sum()       # variance ratios`,
      points: [
        "Use **eigh** for symmetric matrices: faster and returns sorted real λ",
        "U[:, :k] * S[:k] @ Vt[:k] is the truncated sum Σσᵢuᵢvᵢᵀ",
        "PCA = SVD of centred data; rows of Vᵀ are the **principal axes**",
        "S² / ΣS² gives the explained-variance ratio for choosing k",
      ],
      fontSize: 12.5,
      notes: "Point out the broadcasting trick U[:, :k] * S[:k], which scales each column by its singular value without building a diagonal matrix. In research code you will also see sklearn PCA and torch.linalg.svd; they implement the same mathematics.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`W=W_0+\Delta W=W_0+BA,\ \ \mathrm{rank}(\Delta W)\le r`, read: "Fine-tuning learns only a **low-rank** correction to the frozen weights.", src: "LoRA, Hu et al. 2021" },
        { eq: String.raw`\kappa(A)=\sigma_{\max}/\sigma_{\min}`, read: "The **condition number**: a large ratio means the problem is numerically sensitive and hard to optimise." },
        { eq: String.raw`\rho(W)=\max_i|\lambda_i(W)|<1`, read: "If the **spectral radius** of the recurrent weights is below 1, signals (and gradients) decay over time." },
        { eq: String.raw`\mathbf{z}=V_k^{\top}(\mathbf{x}-\boldsymbol\mu)`, read: "Represent x by its coordinates on the **top-k principal axes** (PCA)." },
      ],
      notes: "Each line now decodes. The condition number appears in optimisation papers explaining why some problems converge slowly; Adam and normalisation layers partly fix poor conditioning. The spectral radius appears in RNN and state-space model papers such as S4 and Mamba, which carefully control eigenvalues to remember long sequences.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Find eigenvalues and eigenvectors.", eq: String.raw`\begin{bmatrix}4&0\\0&-2\end{bmatrix}` },
        { lvl: "Warm-up", text: "A 3×3 matrix has eigenvalues 2, 0.5 and 1. What is its determinant? Is it invertible?" },
        { lvl: "Core", text: "Find the eigenvalues of [[3, 1], [0, 2]] and check that their sum equals the trace." },
        { lvl: "Core", text: "A 1000×1000 matrix is approximated with rank 10. How many numbers are stored? What compression ratio?" },
        { lvl: "Code", text: "Run PCA on MNIST digits; plot the first 2 components coloured by label. How many components keep 90% of variance?" },
        { lvl: "Research", text: "In LoRA, why is B initialised to zero? What would happen to the model at step 0 otherwise?" },
      ],
      notes: "Answers: 1) 4 with (1, 0), -2 with (0, 1). 2) det = 1, invertible since no eigenvalue is zero. 3) 3 and 2, trace 5. 4) 10 times (1000 + 1000 + 1) = 20,010 numbers, about 50 times smaller. 5) around 87 components for 90 percent. 6) With B = 0, BA = 0, so the adapted model starts identical to the pre-trained model and training is stable.",
    });
    d.recap({
      points: [
        "Eigenvectors keep their direction: **Av = λv**; λ's sum to the trace, multiply to det",
        "Symmetric matrices diagonalise with orthogonal eigenvectors: **A = QΛQᵀ**",
        "**SVD** works for any matrix: rotate, stretch by σᵢ, rotate",
        "Truncated SVD is the ==best low-rank approximation==: compression and LoRA",
        "**PCA** = eigenvectors of the covariance = SVD of centred data",
      ],
      next: "Calculus I: derivatives and gradients",
      nextTopics: ["Derivatives as slopes and rates", "Rules and the chain rule", "Partial derivatives and the gradient", "A first gradient-descent step"],
      notes: "This completes the representation block. Tomorrow we switch from describing data to changing parameters, which needs calculus. Encourage students to revisit the SVD slide: it will return in research papers repeatedly.",
    });
  },
};
