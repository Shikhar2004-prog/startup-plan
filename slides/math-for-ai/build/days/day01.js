// Day 1 — The language of AI math
module.exports = {
  day: 1,
  short: "The language of AI math",
  file: "Day-01-Language-of-AI-Math",
  build(d, { F, D }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "The Language of AI Math",
      subtitle: "Notation, functions, sums, exponents and logs: the alphabet every AI paper is written in",
      topics: ["Notation", "Functions", "Σ and Π", "exp and log", "Models as functions"],
      eq: String.raw`\hat{y} = f_{\theta}(\mathbf{x})`,
      notes: "Welcome to Day 1 of Mathematics for AI. Over 15 days we go from the alphabet of mathematics to reading and writing research papers. Today is about language: if you can read the notation, half the fear of a paper disappears. The equation on the right, y-hat equals f-theta of x, is the single most important line in machine learning. By the end of today every symbol in it will feel natural.",
    });
    d.objectives({
      goals: [
        "Read the core symbols of AI papers: sets, vectors, Greek letters, subscripts",
        "Treat a model as a **function with parameters** θ",
        "Use Σ (sum) and Π (product) notation fluently and turn it into code",
        "Know why **exponentials and logarithms** are everywhere in AI",
        "Compute a logistic-regression prediction by hand",
      ],
      why: "Papers compress pages of ideas into one line of notation. Every model, from linear regression to GPT, is ==a function f(x; θ)== whose knobs θ are tuned by data. Today we learn to read that line.",
      prereq: "School algebra: variables, equations, plotting y = mx + c. No calculus needed yet.",
      notes: "Walk through the five goals. Emphasise the why-box: the course is not math for its own sake, every topic returns to how a model is built, trained or evaluated. Point to the journey tracker at the bottom: Days 1 to 4 are the representation layer (linear algebra), 5 to 6 are change (calculus), 7 to 9 are uncertainty (probability, statistics, information), 10 is optimisation, and 11 to 15 assemble everything into modern architectures and research practice.",
    });

    d.section("The big picture");
    d.big({
      title: "Every AI model is a function with knobs",
      statement: "A model takes an input, turns its **parameters** (knobs), and produces an output",
      eq: String.raw`\underbrace{\hat{y}}_{\text{prediction}} \;=\; f\big(\underbrace{\mathbf{x}}_{\text{input}}\,;\,\underbrace{\theta}_{\text{parameters}}\big)`,
      sub: "Spam filter: x = email, ŷ = P(spam).   Image classifier: x = pixels, ŷ = class.   GPT: x = text so far, ŷ = next-token probabilities.",
      notes: "This is the mental model for the whole course. x is whatever we feed in, numbers representing an email, an image or a sentence. theta is the collection of all parameters, which in GPT-scale models is hundreds of billions of numbers. Training means choosing theta so that y-hat is close to the true y. Ask the class: for a house price model, what is x, what is y-hat, what might theta be?",
    });
    const flow = D.graph({
      W: 1160, H: 400,
      nodes: [
        { id: "x", x: 110, y: 150, w: 170, h: 80, label: "Data $\\mathbf{x}$", sub: "vectors, matrices", fill: P.soft.blue, stroke: "blue" },
        { id: "f", x: 400, y: 150, w: 190, h: 80, label: "Model $f_\\theta$", sub: "matrix multiplies", fill: P.soft.violet, stroke: "violet" },
        { id: "y", x: 690, y: 150, w: 170, h: 80, label: "Prediction $\\hat y$", sub: "probabilities", fill: P.soft.green, stroke: "green" },
        { id: "L", x: 990, y: 150, w: 210, h: 80, label: "Loss $\\mathcal{L}(\\hat y, y)$", sub: "how wrong?", fill: P.soft.coral, stroke: "coral" },
        { id: "g", x: 690, y: 330, w: 260, h: 70, label: "Update $\\theta \\leftarrow \\theta - \\eta\\nabla_\\theta\\mathcal{L}$", fill: P.soft.gold, stroke: "gold", fs: 17 },
      ],
      edges: [
        { a: "x", b: "f", color: "navy" }, { a: "f", b: "y", color: "navy" }, { a: "y", b: "L", color: "navy" },
        { a: "L", b: "g", color: "gold", bend: -60, label: "gradients" }, { a: "g", b: "f", color: "gold", bend: -60, label: "better θ" },
      ],
      extraHtml: D.label(110, 40, "LINEAR ALGEBRA", { color: "blue", bold: true }) + D.label(400, 40, "LINEAR ALGEBRA + CALCULUS", { color: "violet", bold: true }) + D.label(690, 40, "PROBABILITY", { color: "green", bold: true }) + D.label(990, 40, "STATISTICS + INFO THEORY", { color: "coral", bold: true }) + D.label(1000, 335, "OPTIMIZATION", { color: "gold", bold: true }),
    });
    d.diagram({
      title: "Where each branch of math lives in a learning system",
      diag: flow,
      chips: [
        ["Represent (Days 2-4)", "Data and models are vectors and matrices."],
        ["Learn (Days 5-6, 10)", "Calculus gives the direction to improve θ."],
        ["Reason (Days 7-9)", "Probability measures uncertainty and loss."],
        ["Build (Days 11-15)", "Nets, transformers, generative models, RL."],
      ],
      notes: "This is the course map drawn as a training loop. Data enters as vectors, the model is a chain of matrix operations, the output is a probability distribution, the loss compares prediction and truth, and calculus tells us how to nudge theta. Each colour label tells which branch of math is doing the work. Come back to this slide whenever a student asks why do we need this topic.",
    });

    d.section("Notation");
    d.table({
      title: "Symbol cheat sheet: the letters you will meet daily",
      head: ["Symbol", "Read as", "Typical meaning in AI papers"],
      colW: [1.6, 2.6, 7.93],
      rows: [
        ["x, **x**, X", "x, bold x, capital X", "scalar, vector (bold lower-case), matrix (bold capital)"],
        ["θ, W, b", "theta, W, b", "parameters: all weights and biases of a model"],
        ["η, λ", "eta, lambda", "learning rate; regularisation strength"],
        ["μ, σ, σ²", "mu, sigma, sigma squared", "mean, standard deviation, variance (σ is also the sigmoid)"],
        ["∈, ℝ, ℝⁿ", "in, the reals, R-n", "x ∈ ℝⁿ: x is a list of n real numbers"],
        ["Σ, Π, ∇", "sum, product, nabla", "add up, multiply up, gradient (direction of steepest increase)"],
        ["x ~ p", "x sampled from p", "x is drawn at random from distribution p"],
        ["xᵢ, x⁽ⁱ⁾, ŷ", "x sub i, x super i, y hat", "i-th component, i-th example, a prediction"],
      ],
      fontSize: 14,
      notes: "Do not ask students to memorise this table; ask them to keep it open while reading papers. Point out the typography convention: lower-case italic for scalars, bold lower-case for vectors, bold capitals for matrices. Hats mean estimates or predictions. Superscripts in brackets index training examples, subscripts index components. Sigma is overloaded: standard deviation or the sigmoid function, context decides.",
    });
    d.concept({
      title: "Sets and spaces: where our numbers live",
      intuition: [
        "A **set** is a collection: {0, 1} are the two labels of a yes/no task",
        "**ℝ** is the number line; **ℝⁿ** is a list of n real numbers, a point in n-dimensional space",
        "A 28×28 grey image is one point in ℝ⁷⁸⁴; a 4096-dim LLM embedding is a point in ℝ⁴⁰⁹⁶",
        "Shapes matter: most bugs in AI code are ==shape mismatches==",
      ],
      def: String.raw`\begin{aligned}
\mathbb{R}^n &= \{(x_1,\dots,x_n) : x_i \in \mathbb{R}\}\\
\mathbf{X} &\in \mathbb{R}^{m\times n}\ \ (m \text{ rows}, n \text{ cols})\\
[0,1] &= \{p \in \mathbb{R} : 0 \le p \le 1\}\\
\mathcal{D} &= \{(\mathbf{x}^{(i)}, y^{(i)})\}_{i=1}^{N}
\end{aligned}`,
      defNote: "Read the last line as: a dataset 𝒟 is a set of N pairs, each an input x⁽ⁱ⁾ with its label y⁽ⁱ⁾. Probabilities live in the interval [0, 1].",
      notes: "Show the leap from 2-D and 3-D, which we can draw, to n-D, which we cannot draw but can compute with exactly the same rules. An image flattened into 784 numbers is one point; the whole MNIST dataset is a cloud of 60,000 points in 784-dimensional space. Ask: what is the shape of a batch of 32 RGB images of size 224 by 224? Answer: 32 by 3 by 224 by 224.",
    });
    d.concept({
      title: "Functions: machines that map inputs to outputs",
      intuition: [
        "A function assigns **exactly one output** to each input",
        "f : ℝⁿ → ℝᵏ says what goes in (n numbers) and what comes out (k numbers)",
        "**Composition** g∘f means: do f first, then g. Deep networks are long compositions",
        "A ==layer== is just a function; a network is functions of functions",
      ],
      def: String.raw`\begin{aligned}
f &: \mathbb{R}^{n} \to \mathbb{R}^{k}\\[2pt]
(g\circ f)(\mathbf{x}) &= g\big(f(\mathbf{x})\big)\\[2pt]
f_\theta(\mathbf{x}) &= f_L\circ \cdots \circ f_2 \circ f_1(\mathbf{x})
\end{aligned}`,
      defNote: "The last line is a deep network with L layers. Each fₗ has its own parameters; θ collects them all.",
      notes: "Use a vending machine analogy: insert coins and a choice, get exactly one item. Domain and codomain are the shapes of input and output. Composition is the idea that makes deep learning deep: ResNet-50 is roughly fifty functions composed. On Day 6 we will see that the chain rule of calculus is exactly the rule for differentiating a composition, which is why backpropagation works.",
    });
    d.figure({
      title: "Six functions you will see in every model",
      fig: F("d01_functions"),
      points: [
        { icon: "chart", text: "**Linear**: the core of every layer, Wx + b" },
        { icon: "mountain", text: "**Quadratic**: squared error loss, (ŷ − y)²" },
        { icon: "bolt", text: "**exp / log**: softmax, likelihoods, cross-entropy" },
        { icon: "layers", text: "**Sigmoid / ReLU**: activations that add non-linearity" },
      ],
      caption: "Learn the shape of each curve; papers assume you can picture them instantly",
      notes: "Go curve by curve and ask where it appears. Linear: every dense layer. Quadratic: mean squared error, and the bowl-shaped loss surfaces we optimise on Day 10. Exponential: always positive, explodes quickly, used in softmax. Log: the inverse of exp, defined only for positive inputs, turns products into sums. Sigmoid squashes any number into 0 to 1, useful for probabilities. ReLU is zero for negatives and identity for positives, the default activation in deep nets.",
    });

    d.section("Sums and products");
    d.equation({
      title: "Summation notation: a for-loop written in one symbol",
      eq: String.raw`\sum_{i=1}^{n} x_i \;=\; x_1 + x_2 + \cdots + x_n \qquad \prod_{i=1}^{n} p_i \;=\; p_1 \cdot p_2 \cdots p_n`,
      legend: [
        [String.raw`\textstyle\sum`, "capital sigma: add everything up"],
        [String.raw`i=1`, "the loop index and where it starts"],
        [String.raw`n`, "where the loop stops (inclusive)"],
        [String.raw`\textstyle\prod`, "capital pi: multiply everything up"],
        [String.raw`x_i`, "the term computed at each step"],
        [String.raw`\frac{1}{n}\sum_i`, "an average: the most common pattern"],
      ],
      foot: "Translate every Σ into code: ==total = 0; for i in 1..n: total += xᵢ==. Every loss function is an average over examples.",
      notes: "Students often freeze at sigma notation; demystify it as a loop. Write the Python loop on the board next to the symbol. Point out the average pattern one over n times a sum, which is how the training loss over a dataset is written. The product symbol appears whenever independent probabilities multiply, for example the likelihood of a dataset, which we will meet on Day 8.",
    });
    d.example({
      title: "Worked example: a neuron is a weighted sum",
      problem: "A neuron has weights w = (0.5, 1, −0.2) and bias b = 0.1. Compute its output z for input x = (2, −1, 3).",
      problemEq: String.raw`z = \sum_{i=1}^{3} w_i x_i + b`,
      steps: [
        { eq: String.raw`w_1x_1 = 0.5 \times 2 = 1`, note: "first term" },
        { eq: String.raw`w_2x_2 = 1 \times (-1) = -1`, note: "second term" },
        { eq: String.raw`w_3x_3 = -0.2 \times 3 = -0.6`, note: "third term" },
        { eq: String.raw`z = 1 - 1 - 0.6 + 0.1 = -0.5`, note: "add the bias" },
      ],
      answer: "z = −0.5. This weighted sum is the ==dot product w·x + b==, the subject of Day 2",
      notes: "Do this live and slowly. Each weight says how much the neuron cares about that input; a negative weight means the input pushes the output down. The bias shifts the result regardless of input. Mention that a modern network does billions of these weighted sums per prediction, which is why GPUs, built for exactly this, matter.",
    });
    d.code({
      title: "The same thing in NumPy: notation becomes one line",
      code: `import numpy as np

x = np.array([2.0, -1.0, 3.0])
w = np.array([0.5, 1.0, -0.2])
b = 0.1

# loop version: literally the sigma
z = 0.0
for i in range(3):
    z += w[i] * x[i]
z += b

# vectorised version: the dot product
z = w @ x + b          # -0.5

# averages and products
losses = np.array([0.2, 0.5, 0.1])
mean_loss = losses.mean()       # (1/n) sum
p = np.array([0.9, 0.8, 0.5])
joint = p.prod()                # 0.36`,
      points: [
        "Each Σ becomes a loop, and then a **vectorised** call that runs on the GPU",
        "w @ x is the dot product, the operation behind every layer",
        "mean() is (1/n)Σ: the form of every training loss",
        "prod() multiplies probabilities; we will soon replace it by a sum of logs",
      ],
      notes: "Run this in a notebook if possible. The message: math notation maps one to one onto code. Encourage students to keep a notebook open while reading papers and type out each equation they meet; it is the fastest way to understand and to catch their own misunderstandings.",
    });

    d.section("Exponentials and logarithms");
    d.concept({
      title: "Exponentials and logarithms: the two-way street",
      intuition: [
        "**eˣ** is always positive and grows explosively: perfect for turning scores into weights",
        "**ln x** undoes eˣ: ln(eˣ) = x. It only accepts positive numbers",
        "Logs turn **products into sums**, and sums are easier to differentiate and safer for computers",
        "That is why papers write ==log-likelihoods== and why losses are often logs",
      ],
      def: String.raw`\begin{aligned}
e^{a}e^{b} &= e^{a+b}\\
\ln(ab) &= \ln a + \ln b\\
\ln(a^{k}) &= k\ln a\\
\ln\!\Big(\prod_i p_i\Big) &= \sum_i \ln p_i
\end{aligned}`,
      defNote: "e ≈ 2.718. In ML, log almost always means the natural log ln. Base-2 logs appear in information theory (bits, Day 9).",
      notes: "Draw both curves and show they are mirror images across the line y = x. Stress the last identity: log of a product equals sum of logs. That single identity is why maximum likelihood training, cross-entropy loss and perplexity all use logs. Also note ln is undefined for zero, which is why code adds a tiny epsilon before taking logs of probabilities.",
    });
    d.figure({
      title: "Why logs save training: products of probabilities vanish",
      fig: F("d01_logscale"),
      points: [
        { icon: "warn", text: "0.9 multiplied 1000 times is about 10⁻⁴⁶; float32 underflows to **0**" },
        { icon: "check", text: "The log stays a tidy number: 1000 × ln 0.9 ≈ **−105.4**" },
        { icon: "language", text: "A language model scores a sentence by summing ==log-probabilities== of tokens" },
      ],
      notes: "This is the first numerical-methods lesson of the course. Computers store numbers with limited precision; float32 cannot represent anything smaller than about 1e-45. Multiplying many probabilities underflows to zero and the gradient disappears. Taking logs converts the product into a sum of moderate negative numbers. Every LLM computes the log-probability of a sequence as a sum over tokens for exactly this reason.",
    });
    d.equation({
      title: "The sigmoid: squashing any score into a probability",
      eq: String.raw`\sigma(z) = \frac{1}{1+e^{-z}} \qquad \sigma(0)=0.5,\quad \sigma(z)\to 1 \text{ as } z\to\infty`,
      legend: [
        [String.raw`z`, "a raw score (logit) from w·x + b, any real number"],
        [String.raw`e^{-z}`, "large when z is negative, tiny when z is positive"],
        [String.raw`\sigma(z)`, "output in (0, 1): read as a probability"],
        [String.raw`\sigma'(z)`, "slope: σ(z)(1 − σ(z)), at most 0.25"],
      ],
      foot: "Logistic regression = weighted sum + sigmoid. It is a ==one-neuron neural network==.",
      notes: "Plug in values with the class: z = 0 gives 0.5, z = 2 gives about 0.88, z = -2 about 0.12. The derivative formula is worth remembering because it reappears in backpropagation on Day 11, and its maximum of 0.25 explains why deep stacks of sigmoids suffer from vanishing gradients.",
    });
    d.example({
      title: "Worked example: will this email be spam?",
      problem: "Features: x₁ = number of links = 2, x₂ = sender is a known contact = 1. Learned weights w = (0.8, −0.5), bias b = 0.2. What probability does the model give for spam?",
      problemEq: String.raw`P(\text{spam}) = \sigma(w_1x_1 + w_2x_2 + b)`,
      steps: [
        { eq: String.raw`z = 0.8(2) + (-0.5)(1) + 0.2`, note: "weighted sum" },
        { eq: String.raw`z = 1.6 - 0.5 + 0.2 = 1.3`, note: "the logit" },
        { eq: String.raw`e^{-1.3} \approx 0.2725`, note: "exponential" },
        { eq: String.raw`\sigma(1.3) = \frac{1}{1+0.2725} \approx 0.786`, note: "squash to (0, 1)" },
      ],
      answer: "P(spam) ≈ 0.79. Above a 0.5 threshold, so ==classify as spam==",
      notes: "Interpret each weight: links increase the spam score, a known sender decreases it. The final probability is about 79 percent. Ask: what would the probability be with zero links? z = -0.3, sigma about 0.43, so not spam. This is the full forward pass of the simplest neural network, and the remaining 14 days build on exactly this pattern.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathcal{D}=\{(\mathbf{x}^{(i)},y^{(i)})\}_{i=1}^{N},\ \mathbf{x}^{(i)}\in\mathbb{R}^{d},\ y^{(i)}\in\{1,\dots,K\}`, read: "We have N labelled examples; each input is a list of d numbers and each label is one of K classes." },
        { eq: String.raw`\theta^{*}=\arg\min_{\theta}\ \frac{1}{N}\sum_{i=1}^{N}\ell\big(f_\theta(\mathbf{x}^{(i)}),\,y^{(i)}\big)`, read: "The best parameters θ* are the ones that make the **average loss** over the dataset as small as possible." },
        { eq: String.raw`\log p_\theta(w_1,\dots,w_T)=\sum_{t=1}^{T}\log p_\theta(w_t\mid w_{<t})`, read: "A language model scores a sentence by **adding the log-probability** of each word given the words before it." },
      ],
      notes: "This slide is the payoff. These three lines appear, almost word for word, in thousands of papers. Read each aloud together. argmin means the input that makes the expression smallest, not the smallest value itself. The vertical bar in the last line means given. w less than t means all words before position t. Encourage students to say formulas out loud in plain English as a habit.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Write out the sum in full and evaluate it.", eq: String.raw`\sum_{k=1}^{4} (2k-1)` },
        { lvl: "Warm-up", text: "What are the shapes? A batch of 64 sentences, each 128 tokens, each token a 512-dim embedding. Write it as ℝ^(…)." },
        { lvl: "Core", text: "Simplify using log rules, then evaluate with ln 2 ≈ 0.693.", eq: String.raw`\ln\big(2^{10}\cdot 2^{-3}\big)` },
        { lvl: "Core", text: "For the spam model, find the number of links x₁ at which P(spam) = 0.5 when x₂ = 1. (Hint: σ(z) = 0.5 when z = 0.)" },
        { lvl: "Code", text: "Compute the log-probability of a 1000-token sentence where every token has p = 0.9, two ways: np.prod then log, and sum of logs. Explain the difference." },
        { lvl: "Research", text: "Open the abstract and method section of any ML paper. List every symbol you cannot read yet; we will tick them off over the 15 days." },
      ],
      notes: "Answers: 1) 1 + 3 + 5 + 7 = 16. 2) 64 by 128 by 512. 3) ln 2 to the 7 = 7 ln 2 about 4.85. 4) 0.8 x1 - 0.5 + 0.2 = 0 gives x1 = 0.375. 5) the product underflows to 0 in float32 so log gives minus infinity; the sum of logs gives about -105.4. 6) There is no single answer: collect the lists and revisit them on Day 15.",
    });
    d.recap({
      points: [
        "A model is a **function** ŷ = f(x; θ); training chooses the parameters θ",
        "Scalars x, vectors **x**, matrices **X**; x ∈ ℝⁿ means a list of n numbers",
        "Σ is a loop that adds, Π a loop that multiplies; (1/N)Σ is an average loss",
        "**Logs** turn products into sums and keep tiny probabilities computable",
        "Sigmoid turns any score into a probability: logistic regression is ==one neuron==",
      ],
      next: "Vectors: the geometry of data",
      nextTopics: ["Vectors as arrows and as data", "Dot product and cosine similarity", "Norms, distances and embeddings", "Projections"],
      notes: "Ask three students to each state one takeaway in their own words. Preview Day 2: we will look inside the w dot x from today and discover it measures similarity, which is the foundation of embeddings, search and attention.",
    });
  },
};
