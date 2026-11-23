// Day 5 — Calculus I: derivatives and gradients
module.exports = {
  day: 5,
  short: "Derivatives and gradients",
  file: "Day-05-Calculus-I-Derivatives-and-Gradients",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Calculus I: Derivatives and Gradients",
      subtitle: "How a tiny change in a parameter changes the loss: the signal every neural network learns from",
      topics: ["Derivatives", "Rules", "Chain rule", "Partials", "Gradient", "Descent"],
      eq: String.raw`f'(x)=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}`,
      notes: "We now move from representing data to learning. Learning means changing parameters to reduce the loss, and to know which way to change them we need derivatives. Today covers single-variable derivatives, the rules for computing them, the chain rule, and the gradient: a vector of derivatives that points uphill. We end with a first gradient descent step by hand.",
    });
    d.objectives({
      goals: [
        "Explain a derivative as a **slope** and as a **sensitivity**",
        "Differentiate common functions with the **sum, product, quotient and chain rules**",
        "Compute **partial derivatives** of functions of many variables",
        "Assemble them into the **gradient** ∇f and read its direction",
        "Take a **gradient-descent step** by hand and check a derivative numerically",
      ],
      why: "Training is ==repeatedly asking: if I nudge this weight, does the loss go up or down?== The derivative is exactly that answer, computed for billions of weights at once by backpropagation.",
      prereq: "Day 1: functions, exp/log, sigmoid. Day 2: vectors.",
      notes: "Reassure students who fear calculus: we need a small, practical toolkit, not the whole subject. The goal is fluency with slopes, the chain rule and gradients.",
    });

    d.section("The derivative");
    d.figure({
      title: "The derivative is the slope of the tangent line",
      fig: F("d05_tangent"),
      points: [
        { icon: "ruler", text: "Secant slope: rise over run between x₀ and x₀ + h" },
        { icon: "compress", text: "Shrink h → 0: secants turn into the **tangent**" },
        { icon: "bolt", text: "f′(x₀) = how fast f changes **per unit of x** at x₀" },
      ],
      notes: "The light grey lines connect x0 with points further away; as h shrinks they rotate toward the red tangent line. Its slope is the derivative. In ML language the derivative is a sensitivity: if f is the loss and x is one weight, f prime tells how much the loss changes per unit change of that weight, at the current value.",
    });
    d.concept({
      title: "Two readings of the same idea",
      intuition: [
        "**Geometry**: the slope of the curve at a point",
        "**Sensitivity**: change in output ≈ f′(x) × change in input",
        "f′ > 0: increasing; f′ < 0: decreasing; f′ = 0: flat (minimum, maximum or saddle)",
        "Training sets parameters where the loss is ==flat at the bottom==",
      ],
      def: String.raw`\begin{aligned}f'(x)=\frac{df}{dx}&=\lim_{h\to0}\frac{f(x+h)-f(x)}{h}\\[4pt] f(x+\Delta x)&\approx f(x)+f'(x)\,\Delta x\end{aligned}`,
      defNote: "The second line is the **linear approximation**: zoom in far enough and every smooth curve looks like a straight line. Gradient descent trusts this line for one small step.",
      notes: "The linear approximation is the single most useful formula in this course. Example: f(x) = x squared at x = 3, f prime = 6, so f(3.01) is about 9 + 6 times 0.01 = 9.06; the exact value is 9.0601. Gradient descent assumes this approximation holds within a small step, which is why the learning rate must be small.",
    });
    d.table({
      title: "Derivatives you will use constantly",
      head: ["Function f(x)", "Derivative f′(x)", "Where it appears in AI"],
      colW: [3.0, 3.6, 5.53],
      rows: [
        ["c (constant)", "0", "biases that do not depend on x"],
        ["xⁿ", "n·xⁿ⁻¹", "squared error (ŷ − y)² → 2(ŷ − y)"],
        ["eˣ", "eˣ", "softmax, exponential families"],
        ["ln x", "1/x", "log-likelihood, cross-entropy"],
        ["σ(x) = 1/(1+e⁻ˣ)", "σ(x)(1 − σ(x))", "logistic regression, gates in LSTMs"],
        ["tanh x", "1 − tanh²x", "RNN activations"],
        ["ReLU(x) = max(0, x)", "1 if x > 0, else 0", "the default activation"],
        ["|x|", "sign(x) (undefined at 0)", "L1 loss and L1 regularisation"],
      ],
      fontSize: 14,
      notes: "Do not derive all of these; derive one or two and trust the rest. ReLU is not differentiable at exactly zero, and frameworks simply pick 0 there; in practice it never matters. Note the beautiful sigmoid derivative written in terms of sigma itself, which makes backpropagation through sigmoids cheap.",
    });
    d.compare({
      title: "Rules for combining functions",
      cols: [
        { head: "Sum and constant", icon: "calc", eq: String.raw`(af+bg)'=af'+bg'`, items: ["Derivatives are **linear**", "Loss of a batch = average of losses, so gradient = average of gradients"] },
        { head: "Product", icon: "layers", eq: String.raw`(fg)'=f'g+fg'`, items: ["Each factor takes its turn changing", "Used for gates: σ(z)·tanh(c) in LSTMs and GLU"] },
        { head: "Chain rule", icon: "link", eq: String.raw`\big(f(g(x))\big)'=f'(g(x))\,g'(x)`, items: ["Rates **multiply** through a chain", "The entire engine of ==backpropagation=="] },
      ],
      foot: "Quotient rule (f/g)′ = (f′g − fg′)/g². It is the product rule in disguise.",
      notes: "The sum rule is why minibatch gradients are averages. The product rule appears with gating mechanisms. The chain rule is the star: tomorrow we will scale it up to whole networks. Practise each with one quick example: derivative of 3x squared + 5x is 6x + 5; of x times e to the x is e to the x times (1 + x); of sine of x squared is cos(x squared) times 2x.",
    });

    d.section("The chain rule");
    const chain = D.graph({
      W: 1160, H: 300,
      nodes: [
        { id: "x", x: 110, y: 130, w: 120, h: 70, label: "$x$", fill: P.soft.blue, stroke: "blue", fs: 26 },
        { id: "g", x: 420, y: 130, w: 200, h: 80, label: "$u=g(x)$", sub: "inner function", fill: P.soft.violet, stroke: "violet" },
        { id: "f", x: 760, y: 130, w: 200, h: 80, label: "$y=f(u)$", sub: "outer function", fill: P.soft.green, stroke: "green" },
        { id: "y", x: 1050, y: 130, w: 120, h: 70, label: "$y$", fill: P.soft.coral, stroke: "coral", fs: 26 },
      ],
      edges: [
        { a: "x", b: "g", color: "navy", label: "$\\dfrac{du}{dx}=g'(x)$", lofs: [0, -48], lfs: 19 },
        { a: "g", b: "f", color: "navy", label: "$\\dfrac{dy}{du}=f'(u)$", lofs: [0, -48], lfs: 19 },
        { a: "f", b: "y", color: "navy" },
      ],
      extraHtml: `<div style="position:absolute;left:580px;top:255px;transform:translate(-50%,-50%);font-size:27px;color:${P.navy};background:${P.soft.gold};padding:8px 22px;border-radius:12px;border:2px solid ${P.gold}">$\\dfrac{dy}{dx}=\\dfrac{dy}{du}\\cdot\\dfrac{du}{dx}$</div>`,
    });
    d.diagram({
      title: "Chain rule: rates multiply along a chain of functions",
      diag: chain,
      chips: [
        ["Gears analogy", "If u turns 3× as fast as x and y 2× as fast as u, then y turns 6× as fast as x."],
        ["Deep nets", "A network is a long chain, so its gradient is a long product of local derivatives."],
        ["Warning", "Many factors < 1 multiply to ≈ 0 (vanishing); many > 1 explode."],
      ],
      notes: "The gear analogy makes the chain rule obvious: sensitivities multiply. Write a concrete example next to the diagram: y = (3x + 1) squared. Inner u = 3x + 1, du/dx = 3. Outer y = u squared, dy/du = 2u. So dy/dx = 2(3x + 1) times 3 = 6(3x + 1). At x = 1, that is 24. The warning chip previews why deep networks needed ReLU, residual connections and normalisation.",
    });
    d.example({
      title: "Worked example: derivative of a sigmoid neuron's loss",
      problem: "One neuron: z = wx + b, prediction ŷ = σ(z), squared loss L = (ŷ − y)². With x = 2, w = 0.5, b = 0, y = 1, find dL/dw.",
      problemEq: String.raw`\frac{dL}{dw}=\frac{dL}{d\hat y}\cdot\frac{d\hat y}{dz}\cdot\frac{dz}{dw}`,
      steps: [
        { eq: String.raw`z=0.5\cdot2+0=1,\quad \hat y=\sigma(1)\approx0.731`, note: "forward pass" },
        { eq: String.raw`\tfrac{dL}{d\hat y}=2(\hat y-y)=2(0.731-1)=-0.538`, note: "outer derivative" },
        { eq: String.raw`\tfrac{d\hat y}{dz}=\sigma(1)(1-\sigma(1))\approx0.197`, note: "sigmoid derivative" },
        { eq: String.raw`\tfrac{dz}{dw}=x=2`, note: "inner derivative" },
        { eq: String.raw`\tfrac{dL}{dw}=(-0.538)(0.197)(2)\approx-0.212`, note: "multiply the chain" },
      ],
      answer: "dL/dw ≈ −0.21 < 0, so ==increasing w lowers the loss==. Gradient descent will raise w",
      notes: "This is backpropagation for a single neuron, done by hand. The sign is what matters most: negative means the loss falls as w rises, so we should increase w. The magnitude tells how strongly. Point out that the sigmoid factor 0.197 is below 0.25, which shrinks the signal; stack many sigmoids and the gradient vanishes.",
    });

    d.section("Many variables: partial derivatives and the gradient");
    d.figure({
      title: "Partial derivatives: change one variable, freeze the rest",
      fig: F("d05_surface"),
      points: [
        { icon: "cube", text: "f(x, y) is a **surface**; each input direction has its own slope" },
        { icon: "ruler", text: "∂f/∂x: slope along the gold slice (y fixed)" },
        { icon: "ruler", text: "∂f/∂y: slope along the red slice (x fixed)" },
      ],
      notes: "For f(x, y) = x squared + 0.6 y squared, the partial derivative with respect to x treats y as a constant: 2x. With respect to y: 1.2y. Geometrically each partial is the slope of a one-dimensional slice through the surface. A neural network loss is a surface over millions of dimensions, one per weight, and we need the partial derivative for each.",
    });
    d.equation({
      title: "The gradient: all partial derivatives in one vector",
      eq: String.raw`\nabla f(\mathbf{x})=\begin{bmatrix}\dfrac{\partial f}{\partial x_1}\\ \vdots\\ \dfrac{\partial f}{\partial x_n}\end{bmatrix},\qquad f(\mathbf{x}+\boldsymbol\delta)\approx f(\mathbf{x})+\nabla f(\mathbf{x})^{\top}\boldsymbol\delta`,
      legend: [
        [String.raw`\partial`, "partial: differentiate in one variable only"],
        [String.raw`\nabla f`, "points in the direction of steepest increase"],
        [String.raw`\|\nabla f\|`, "how steep that steepest direction is"],
        [String.raw`-\nabla f`, "steepest decrease: the direction of learning"],
        [String.raw`\nabla f=\mathbf{0}`, "stationary point: min, max or saddle"],
        [String.raw`\nabla_\theta\mathcal{L}`, "gradient of the loss with respect to parameters"],
      ],
      foot: "Why steepest? The change ∇f·δ is a dot product, largest when δ points ==along ∇f== (Day 2, cos θ = 1).",
      eqSize: 30,
      notes: "Connect to Day 2: the first-order change in f is the dot product of the gradient with the step. Among all steps of a fixed length, the dot product is largest when the step aligns with the gradient and most negative when it points opposite. So minus the gradient is the steepest way down. This is the mathematical justification of gradient descent.",
    });
    d.figure({
      title: "The gradient field: arrows point uphill, learning walks downhill",
      fig: F("d05_gradient"),
      points: [
        { icon: "arrow", text: "Red arrows: ∇f at each point, **perpendicular** to contour lines" },
        { icon: "mountain", text: "Navy path: repeated steps of **−η∇f** reach the minimum" },
        { icon: "warn", text: "Path zig-zags because f is steeper in y: an early hint of **conditioning** (Day 10)" },
      ],
      notes: "Contour lines connect points of equal loss, like a topographic map. Gradients are always perpendicular to contours. Gradient descent follows the negative gradient. Because the bowl is elongated, the path curves: it moves quickly in the steep y direction and slowly in x. Momentum and Adam, on Day 10, were invented to handle exactly this.",
    });
    d.example({
      title: "Worked example: compute a gradient and take one step",
      problem: "f(x, y) = x² + 3xy + 2y². Find ∇f at (1, 2), then take one gradient-descent step with learning rate η = 0.05.",
      problemEq: String.raw`\mathbf{p}_{\text{new}}=\mathbf{p}-\eta\,\nabla f(\mathbf{p})`,
      steps: [
        { eq: String.raw`\tfrac{\partial f}{\partial x}=2x+3y,\quad \tfrac{\partial f}{\partial y}=3x+4y`, note: "partials" },
        { eq: String.raw`\nabla f(1,2)=(2+6,\ 3+8)=(8,\ 11)`, note: "evaluate" },
        { eq: String.raw`\mathbf{p}_{\text{new}}=(1,2)-0.05(8,11)=(0.6,\ 1.45)`, note: "step downhill" },
        { eq: String.raw`f(1,2)=15\ \to\ f(0.6,1.45)\approx7.18`, note: "loss decreased" },
      ],
      answer: "One step cut f from 15 to ≈ 7.2. Training a network is ==this, repeated millions of times==",
      notes: "Check f(0.6, 1.45) = 0.36 + 3 times 0.87 + 2 times 2.1025 = 0.36 + 2.61 + 4.205 = 7.175. The linear approximation predicted a drop of eta times the squared gradient norm, 0.05 times 185 = 9.25; the real drop, 7.8, is a bit smaller because the function curves. That gap is why step size matters.",
    });
    d.code({
      title: "Check any derivative numerically: the gradient check",
      code: `import numpy as np

def f(p):
    x, y = p
    return x**2 + 3*x*y + 2*y**2

def grad_f(p):                    # our analytic answer
    x, y = p
    return np.array([2*x + 3*y, 3*x + 4*y])

def numeric_grad(f, p, h=1e-5):   # central differences
    g = np.zeros_like(p)
    for i in range(len(p)):
        e = np.zeros_like(p); e[i] = h
        g[i] = (f(p + e) - f(p - e)) / (2 * h)
    return g

p = np.array([1.0, 2.0])
print(grad_f(p), numeric_grad(f, p))   # [8, 11] twice

# gradient descent
for step in range(50):
    p = p - 0.05 * grad_f(p)
print(p, f(p))                          # -> near (0, 0)`,
      points: [
        "**Central difference** (f(x+h) − f(x−h)) / 2h is accurate to O(h²)",
        "Compare with your analytic gradient: relative error < 1e-6 means it is right",
        "Researchers use this to **debug custom layers and losses**",
        "torch.autograd.gradcheck automates exactly this test",
      ],
      fontSize: 12.5,
      notes: "Gradient checking is a research survival skill. Whenever you implement a new layer or loss by hand, compare its gradient with finite differences. Use float64 and h around 1e-5. Note the cost: numeric gradients need two function evaluations per parameter, hopeless for millions of parameters, which is why we need backpropagation tomorrow.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\theta_{t+1}=\theta_t-\eta\,\nabla_\theta\mathcal{L}(\theta_t)`, read: "Update the parameters by a small step **against the gradient** of the loss." },
        { eq: String.raw`\frac{\partial\mathcal{L}}{\partial w_{ij}}=\frac{\partial\mathcal{L}}{\partial z_i}\,x_j`, read: "The gradient for weight wᵢⱼ is **error signal at neuron i** times **input j**." },
        { eq: String.raw`\nabla_{\mathbf{x}}\mathcal{L}(f_\theta(\mathbf{x}),y)`, read: "Gradient **with respect to the input**, not the weights: used for saliency maps and adversarial examples." },
        { eq: String.raw`\|\nabla_\theta\mathcal{L}\|_2\le c`, read: "**Gradient clipping**: rescale the gradient if its norm exceeds c, to stop training from exploding." },
      ],
      notes: "The third row surprises students: we can also differentiate with respect to the input image. Saliency maps visualise which pixels most affect a prediction; the FGSM adversarial attack steps the image along the sign of this gradient. Gradient clipping at norm 1.0 is standard when training transformers.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Differentiate: (a) 4x³ − 2x + 7  (b) e^(3x)  (c) ln(1 + x²)." },
        { lvl: "Warm-up", text: "Using f(x + Δx) ≈ f(x) + f′(x)Δx, estimate √4.1 from √4 = 2." },
        { lvl: "Core", text: "Find ∇f for f(x, y, z) = x²y + yz³ at (1, 2, −1)." },
        { lvl: "Core", text: "Show that the derivative of the softplus ln(1 + eˣ) is the sigmoid σ(x)." },
        { lvl: "Code", text: "Implement numeric_grad and verify your answer to problem 3. Then run 100 steps of gradient descent on f(x, y) = (x − 3)² + 10(y + 1)² and plot the path." },
        { lvl: "Challenge", text: "For the neuron example, compute dL/db as well. Then do one update of w and b with η = 1 and verify the loss decreases." },
      ],
      notes: "Answers: 1) 12x squared - 2; 3 e to the 3x; 2x over (1 + x squared). 2) derivative 1/(2 sqrt x) = 0.25 at 4, so sqrt 4.1 is about 2.025 (true 2.0248). 3) (2xy, x squared + z cubed, 3yz squared) = (4, 0, 6). 4) e^x over (1 + e^x) = sigma(x). 5) path converges to (3, -1), zig-zagging in y. 6) dL/db = -0.106; new w = 0.712, b = 0.106, loss falls from 0.072 to about 0.032.",
    });
    d.recap({
      points: [
        "The derivative is a **slope** and a **sensitivity**: Δf ≈ f′(x)Δx",
        "Know the table: xⁿ, eˣ, ln x, σ, tanh, ReLU; combine with sum, product rules",
        "**Chain rule**: rates multiply along a chain; it is backprop's engine",
        "The **gradient** ∇f collects all partials and points uphill; ==−∇f is the way down==",
        "Gradient descent θ ← θ − η∇L; verify gradients numerically with central differences",
      ],
      next: "Calculus II: Jacobians and backpropagation",
      nextTopics: ["Multivariable chain rule", "Jacobians and Hessians", "Taylor expansions", "Computational graphs and autodiff"],
      notes: "Tomorrow we scale the chain rule to vectors and matrices, draw computational graphs, and see exactly how PyTorch computes gradients for millions of parameters in one backward pass.",
    });
  },
};
