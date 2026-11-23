// Day 2 — Vectors: the geometry of data
module.exports = {
  day: 2,
  short: "Vectors and the geometry of data",
  file: "Day-02-Vectors-and-Geometry-of-Data",
  build(d, { F, D }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Vectors: the Geometry of Data",
      subtitle: "Arrows, lists of numbers, similarity and distance: how AI turns words, images and users into points in space",
      topics: ["Vectors", "Dot product", "Cosine similarity", "Norms", "Projections"],
      eq: String.raw`\mathbf{u}\cdot\mathbf{v}=\|\mathbf{u}\|\,\|\mathbf{v}\|\cos\theta`,
      notes: "Yesterday we saw that a neuron computes w dot x plus b. Today we open up that dot product. Vectors are the data structure of AI: every word, image patch, user and product inside a modern model is a vector. The equation of the day connects algebra (multiply and add) with geometry (angle between arrows). It is the reason similarity search, recommendation and attention work.",
    });
    d.objectives({
      goals: [
        "See a vector both as an **arrow** in space and as a **list of numbers**",
        "Add, subtract and scale vectors, and picture what happens",
        "Compute the **dot product** and explain what its sign and size mean",
        "Measure length and distance with **L1, L2 and L∞ norms**",
        "Use **cosine similarity** and projections to compare embeddings",
      ],
      why: "Embeddings, search, recommendation and attention all reduce to one question: ==how similar are two vectors?== The dot product answers it, billions of times per second inside every LLM.",
      prereq: "Day 1: notation for ℝⁿ, Σ sums, and the weighted sum w·x + b.",
      notes: "Set expectations: today is visual. Everything is drawn in 2-D, but every formula works unchanged in 768 or 4096 dimensions, which is where real embeddings live.",
    });

    d.section("What is a vector");
    d.figure({
      title: "A vector is an arrow and a list at the same time",
      fig: F("d02_vectors"),
      wide: true,
      caption: "Left: v = (3, 2) means 3 steps right, 2 steps up.  Middle: add by placing arrows tip to tail.  Right: multiplying by a number stretches or flips.",
      notes: "Physicists see arrows, computer scientists see arrays, and mathematicians say both views are the same object. Addition is component-wise: (3, 1) + (1, 2.5) = (4, 3.5), which geometrically is walking along one arrow and then the other. Scaling multiplies every component: 2 times (1.5, 1) is (3, 2). A negative scalar flips direction. In AI, adding vectors combines information (for example the residual connection x + f(x) in transformers), and scaling weighs it.",
    });
    d.concept({
      title: "Vectors in ℝⁿ: same rules, any number of dimensions",
      intuition: [
        "We cannot draw 768 dimensions, but the **algebra is identical** to 2-D",
        "Each component is one **feature**: pixel brightness, word count, age, price",
        "A word embedding is a learned vector whose **direction encodes meaning**",
        "Column vectors are the default in papers; ==xᵀ== turns a column into a row",
      ],
      def: String.raw`\mathbf{x}=\begin{bmatrix}x_1\\x_2\\\vdots\\x_n\end{bmatrix}\in\mathbb{R}^n,\qquad
\begin{aligned}\mathbf{u}+\mathbf{v}&=(u_1+v_1,\dots,u_n+v_n)\\ c\,\mathbf{v}&=(c v_1,\dots,c v_n)\end{aligned}`,
      defNote: "Vector addition and scaling are component-wise. A set closed under these two operations is a **vector space**; ℝⁿ is the one we use every day.",
      eqSize: 22,
      notes: "Stress that vectors are column vectors by default, so x transpose is a row. Give concrete feature vectors: a house is (area, rooms, age, distance to metro). A 28 by 28 image flattened is a vector in R 784. A sentence embedding from BERT is a vector in R 768. Ask the class what adding two image vectors would look like: a double-exposure photo.",
    });

    d.section("The dot product");
    d.equation({
      title: "The dot product: multiply matching entries and add",
      eq: String.raw`\mathbf{u}\cdot\mathbf{v}=\mathbf{u}^{\top}\mathbf{v}=\sum_{i=1}^{n}u_i v_i=\|\mathbf{u}\|\,\|\mathbf{v}\|\cos\theta`,
      legend: [
        [String.raw`u_i v_i`, "multiply matching components"],
        [String.raw`\textstyle\sum`, "add the products: a single number comes out"],
        [String.raw`\|\mathbf{u}\|`, "length of u (Euclidean norm)"],
        [String.raw`\theta`, "angle between the two arrows"],
        [String.raw`>0,\ =0,\ <0`, "same direction, perpendicular, opposite"],
        [String.raw`\mathbf{u}^{\top}\mathbf{v}`, "the same thing written as a matrix product"],
      ],
      foot: "Algebra (Σ uᵢvᵢ) and geometry (‖u‖‖v‖cos θ) give the same number. ==That bridge is why similarity can be computed.==",
      notes: "Derive the meaning of the sign: cos theta is positive under 90 degrees, zero at 90, negative above. So the dot product tells whether two vectors point in roughly the same direction. Zero dot product means orthogonal, which in data terms means unrelated features. Mention that in attention, the score between a query and a key is exactly q dot k.",
    });
    d.figure({
      title: "Seeing the dot product: angle and shadow",
      fig: F("d02_dot"),
      points: [
        { icon: "compass", text: "Small angle → large positive dot product → **similar**" },
        { icon: "ruler", text: "90° → dot product **0** → orthogonal, unrelated" },
        { icon: "eye", text: "u·v / ‖u‖ is the length of v's **shadow** on u" },
      ],
      notes: "Left panel: the angle theta between u and v. Right panel: the projection, the shadow of v when light shines perpendicular to u. The dot product divided by the length of u is the signed length of that shadow. This picture explains linear classifiers too: w dot x measures how far x lies along the direction w, and the sign decides the class.",
    });
    d.example({
      title: "Worked example: dot product and the angle between vectors",
      problem: "Find u·v and the angle between u = (3, 4) and v = (4, 3).",
      problemEq: String.raw`\cos\theta=\frac{\mathbf{u}\cdot\mathbf{v}}{\|\mathbf{u}\|\,\|\mathbf{v}\|}`,
      steps: [
        { eq: String.raw`\mathbf{u}\cdot\mathbf{v}=3\cdot4+4\cdot3=24`, note: "multiply and add" },
        { eq: String.raw`\|\mathbf{u}\|=\sqrt{3^2+4^2}=5,\quad \|\mathbf{v}\|=5`, note: "lengths" },
        { eq: String.raw`\cos\theta=\frac{24}{5\cdot 5}=0.96`, note: "normalise" },
        { eq: String.raw`\theta=\arccos(0.96)\approx 16.3^\circ`, note: "nearly the same direction" },
      ],
      answer: "u·v = 24, θ ≈ 16°: the vectors are ==highly similar== (cosine similarity 0.96)",
      notes: "Work it on the board. The 3-4-5 triangle keeps numbers clean. Then ask: what about u = (3, 4) and w = (-4, 3)? Dot product -12 + 12 = 0, so they are perpendicular. Students should leave able to compute cosine similarity by hand for small vectors.",
    });

    d.section("Length and distance");
    d.compare({
      title: "Norms: three ways to measure the size of a vector",
      cols: [
        { head: "L2 (Euclidean)", icon: "ruler", eq: String.raw`\|\mathbf{x}\|_2=\sqrt{\textstyle\sum_i x_i^2}`, items: ["Straight-line length", "Used in MSE loss and weight decay ‖θ‖²", "Smooth: easy to differentiate"] },
        { head: "L1 (Manhattan)", icon: "map", eq: String.raw`\|\mathbf{x}\|_1=\textstyle\sum_i |x_i|`, items: ["Walk along a city grid", "L1 penalty pushes weights to **exactly zero** (sparsity, Lasso)", "Robust to outliers"] },
        { head: "L∞ (max)", icon: "target", eq: String.raw`\|\mathbf{x}\|_\infty=\max_i |x_i|`, items: ["Largest single component", "Adversarial attacks: no pixel may change by more than ε", "Gradient clipping by value"] },
      ],
      foot: "Distance between two points is the norm of their difference: ==d(u, v) = ‖u − v‖==",
      notes: "Compute all three for x = (3, -4): L2 = 5, L1 = 7, L-infinity = 4. Mention where each appears in research: L2 in losses and regularisation, L1 for sparse models and feature selection, L-infinity in adversarial robustness papers where perturbations are bounded by epsilon equals 8 over 255.",
    });
    d.figure({
      title: "Unit balls: what 'length 1' looks like under each norm",
      fig: F("d02_norms"),
      points: [
        { icon: "check", text: "L2 ball is a **circle**: every direction treated equally" },
        { icon: "filter", text: "L1 ball is a **diamond** with corners on the axes, which is why L1 regularisation yields sparse solutions" },
        { icon: "cube", text: "L∞ ball is a **square**: each coordinate bounded separately" },
      ],
      notes: "This picture explains a famous fact: when you minimise a loss subject to an L1 constraint, the optimum tends to hit a corner of the diamond, where some coordinates are exactly zero. That is the geometry behind Lasso and sparse models. With L2 the circle has no corners, so weights shrink but rarely become exactly zero.",
    });

    d.section("Similarity and embeddings");
    d.equation({
      title: "Cosine similarity: direction matters, length does not",
      eq: String.raw`\cos(\mathbf{u},\mathbf{v})=\frac{\mathbf{u}\cdot\mathbf{v}}{\|\mathbf{u}\|_2\,\|\mathbf{v}\|_2}\in[-1,\,1]`,
      legend: [
        [String.raw`+1`, "identical direction (same meaning)"],
        [String.raw`0`, "orthogonal (unrelated)"],
        [String.raw`-1`, "opposite direction"],
        [String.raw`\hat{\mathbf{u}}=\mathbf{u}/\|\mathbf{u}\|`, "normalised: after this, cosine = plain dot product"],
      ],
      foot: "Semantic search, RAG retrieval and CLIP all ==normalise embeddings, then take dot products==.",
      notes: "Why ignore length? A long document and a short one about the same topic should be similar; their embedding lengths may differ but directions agree. In practice vector databases store unit-normalised embeddings so that a fast dot product equals cosine similarity. CLIP trains image and text encoders so that matching pairs have high cosine similarity.",
    });
    d.figure({
      title: "Embeddings: meaning becomes geometry",
      fig: F("d02_embed"),
      points: [
        { icon: "language", text: "Similar words sit **close together** (cat, kitten, dog, puppy)" },
        { icon: "arrow", text: "Relations become **directions**: man→woman ≈ king→queen" },
        { icon: "link", text: "king − man + woman ≈ ==queen== (word2vec, 2013)" },
      ],
      notes: "This is a 2-D cartoon of a real phenomenon found in word2vec and GloVe embeddings. The violet arrows have nearly the same direction and length, so the relation male to female is a vector. The gold arrows encode country to capital. Vector arithmetic on embeddings is still used to steer LLM behaviour today, in research on activation steering and representation engineering.",
    });
    d.example({
      title: "Worked example: which document matches the query?",
      problem: "A tiny search engine has 3-dim embeddings. Query q = (1, 2, 0). Doc A = (2, 4, 1), Doc B = (0, 1, 3). Rank the documents by cosine similarity.",
      steps: [
        { eq: String.raw`\mathbf{q}\cdot\mathbf{a}=2+8+0=10,\quad \mathbf{q}\cdot\mathbf{b}=0+2+0=2`, note: "dot products" },
        { eq: String.raw`\|\mathbf{q}\|=\sqrt5,\ \|\mathbf{a}\|=\sqrt{21},\ \|\mathbf{b}\|=\sqrt{10}`, note: "lengths" },
        { eq: String.raw`\cos(\mathbf{q},\mathbf{a})=\tfrac{10}{\sqrt{105}}\approx 0.976`, note: "query vs A" },
        { eq: String.raw`\cos(\mathbf{q},\mathbf{b})=\tfrac{2}{\sqrt{50}}\approx 0.283`, note: "query vs B" },
      ],
      answer: "Return ==Doc A first== (0.98 vs 0.28). This is retrieval in a RAG system, in miniature",
      notes: "Real systems do this with millions of documents and 768 to 3072 dimensions, using approximate nearest neighbour indexes such as HNSW or FAISS. The math is exactly this. Ask: if we doubled Doc B's vector, would its cosine change? No, cosine ignores length.",
    });
    d.concept({
      title: "Projection and orthogonality: splitting a vector into parts",
      intuition: [
        "Any vector v splits into a part **along u** and a part **perpendicular** to u",
        "The parallel part is the **shadow**; the perpendicular part is what u cannot explain",
        "Orthogonal vectors carry **non-overlapping information**",
        "This idea powers least squares (Day 3), PCA (Day 4) and ==Gram-Schmidt== orthogonalisation",
      ],
      def: String.raw`\begin{aligned}
\mathrm{proj}_{\mathbf{u}}\mathbf{v}&=\frac{\mathbf{u}\cdot\mathbf{v}}{\mathbf{u}\cdot\mathbf{u}}\,\mathbf{u}\\[4pt]
\mathbf{v}_{\perp}&=\mathbf{v}-\mathrm{proj}_{\mathbf{u}}\mathbf{v},\qquad \mathbf{u}\cdot\mathbf{v}_{\perp}=0
\end{aligned}`,
      defNote: "Example: v = (2, 3), u = (1, 0). proj = (2, 0), v⊥ = (0, 3). Check: (1, 0)·(0, 3) = 0.",
      notes: "Draw v, u, and the dashed perpendicular from the tip of v down to u. Projection is the best approximation of v using only the direction u, best in the L2 sense. That one sentence is the seed of least squares regression and of PCA, which finds the directions whose projections keep the most information.",
    });
    d.code({
      title: "Vectors in NumPy and PyTorch",
      code: `import numpy as np

u = np.array([3.0, 4.0])
v = np.array([4.0, 3.0])

u + v, 2 * u              # add, scale
dot = u @ v               # 24.0
l2  = np.linalg.norm(u)           # 5.0
l1  = np.linalg.norm(u, ord=1)    # 7.0
inf = np.linalg.norm(u, ord=np.inf)  # 4.0

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

cosine(u, v)              # 0.96

# many queries vs many docs at once
Q = np.random.randn(8, 768)        # 8 query embeddings
Dm = np.random.randn(1000, 768)    # 1000 doc embeddings
Qn = Q / np.linalg.norm(Q, axis=1, keepdims=True)
Dn = Dm / np.linalg.norm(Dm, axis=1, keepdims=True)
scores = Qn @ Dn.T                 # (8, 1000) cosines
top5 = np.argsort(-scores, axis=1)[:, :5]`,
      points: [
        "@ is the dot product; norm(ord=…) switches between L2, L1, L∞",
        "Normalise once, then **one matrix product** scores every query against every document",
        "scores has shape (8, 1000): row i holds query i's similarity to each doc",
        "This batched pattern reappears as **attention scores** QKᵀ on Day 12",
      ],
      fontSize: 12,
      notes: "Emphasise the final block. Instead of a double loop over queries and documents, we normalise rows and do one matrix multiplication. Tomorrow we will understand that this is exactly what matrix multiplication is: many dot products at once. Shape annotations in comments are a habit worth building.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathrm{sim}(\mathbf{u},\mathbf{v})=\frac{\mathbf{u}^{\top}\mathbf{v}}{\|\mathbf{u}\|\,\|\mathbf{v}\|}`, read: "Similarity is the **cosine** of the angle between the two embeddings.", src: "SimCLR, CLIP, Sentence-BERT" },
        { eq: String.raw`\mathcal{L}=\mathcal{L}_{\text{task}}+\lambda\|\theta\|_2^2`, read: "Add λ times the **squared L2 norm** of the weights to keep them small (weight decay).", src: "Most training recipes" },
        { eq: String.raw`\|\boldsymbol{\delta}\|_\infty\le\epsilon=8/255`, read: "An adversarial perturbation may change **each pixel by at most** 8/255.", src: "Adversarial robustness (PGD)" },
        { eq: String.raw`\mathrm{score}(\mathbf{q},\mathbf{k})=\mathbf{q}^{\top}\mathbf{k}/\sqrt{d}`, read: "Attention scores are **dot products** of queries and keys, scaled by √d.", src: "Attention Is All You Need (2017)" },
      ],
      notes: "Each row comes from a famous line of work. Point out that with only two days of math, students can already read the core equation of contrastive learning, weight decay, adversarial robustness and attention. The square root of d scaling will be explained on Day 12.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Compute u + v, 3u and u − v for u = (1, −2, 4), v = (0, 5, −1)." },
        { lvl: "Warm-up", text: "Find the L1, L2 and L∞ norms of x = (−6, 8)." },
        { lvl: "Core", text: "Are a = (2, −1, 3) and b = (1, 5, 1) orthogonal? Find the cosine similarity of a and c = (4, −2, 6) and explain the result." },
        { lvl: "Core", text: "Project v = (4, 2) onto u = (1, 1). Write v as the sum of a parallel and a perpendicular part and verify they are orthogonal." },
        { lvl: "Code", text: "Load any pre-trained word embedding (e.g. GloVe-50). Find the 5 nearest neighbours of 'king − man + woman' by cosine similarity." },
        { lvl: "Challenge", text: "Prove that ‖u + v‖² = ‖u‖² + ‖v‖² + 2u·v. What theorem do you get when u ⊥ v?" },
      ],
      notes: "Answers: 1) (1, 3, 3), (3, -6, 12), (1, -7, 5). 2) 14, 10, 8. 3) a dot b = 2 - 5 + 3 = 0 so orthogonal; c = 2a so cosine is exactly 1, same direction. 4) proj = (3, 3), perpendicular part (1, -1), dot product 3 - 3 = 0. 5) queen should appear in the top results. 6) expand (u + v) dot (u + v); when u is perpendicular to v you get Pythagoras.",
    });
    d.recap({
      points: [
        "A vector is both an **arrow** and a **list of features**; rules work in any dimension",
        "Dot product u·v = Σuᵢvᵢ = ‖u‖‖v‖cos θ: ==algebra meets geometry==",
        "Norms measure size: L2 (smooth), L1 (sparse), L∞ (worst case); distance = ‖u − v‖",
        "**Cosine similarity** compares directions: the engine of search, RAG and CLIP",
        "Projection splits a vector into an explained part and an orthogonal remainder",
      ],
      next: "Matrices: transformations and layers",
      nextTopics: ["Matrices as linear maps", "Matrix multiplication and shapes", "Inverse, determinant, rank", "A neural layer as y = Wx + b"],
      notes: "Close with the bridge: a matrix is a stack of vectors, and matrix multiplication is many dot products at once. Tomorrow every neural network layer becomes a matrix.",
    });
  },
};
