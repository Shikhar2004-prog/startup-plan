// Day 6 — Calculus II: Jacobians, Hessians and backpropagation
module.exports = {
  day: 6,
  short: "Jacobians and backpropagation",
  file: "Day-06-Calculus-II-Jacobians-and-Backpropagation",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Calculus II: Jacobians and Backpropagation",
      subtitle: "The chain rule for vectors and matrices, curvature, and how autodiff computes millions of gradients in one pass",
      topics: ["Jacobian", "Hessian", "Taylor", "Matrix calculus", "Computational graphs", "Autodiff"],
      eq: String.raw`\frac{\partial\mathcal{L}}{\partial\mathbf{x}}=J_f^{\top}\,\frac{\partial\mathcal{L}}{\partial\mathbf{y}}`,
      notes: "Yesterday we differentiated scalar functions. Real networks map vectors to vectors, layer after layer. Today we generalise the derivative to the Jacobian matrix, the second derivative to the Hessian, and the chain rule to whole computational graphs. The equation of the day is backpropagation through one layer: the gradient flowing backward is the transposed Jacobian times the gradient arriving from above.",
    });
    d.objectives({
      goals: [
        "Write the **Jacobian** of a vector function and know its shape",
        "Use the **Hessian** to classify minima, maxima and saddle points",
        "Approximate functions with first- and second-order **Taylor** expansions",
        "Apply core **matrix-calculus** identities used in papers",
        "Run forward and backward passes on a **computational graph** by hand",
      ],
      why: "Every deep-learning framework is an ==automatic differentiation engine==. Understanding the backward pass lets you debug exploding gradients, write custom layers and read optimisation papers.",
      prereq: "Day 3 (matrix shapes) and Day 5 (chain rule, gradient).",
      notes: "Today is the bridge between calculus and neural networks. By the end, the phrase loss.backward() should no longer feel like magic.",
    });

    d.section("Jacobian and Hessian");
    d.concept({
      title: "The Jacobian: the derivative of a vector-valued function",
      intuition: [
        "A layer maps **n inputs to m outputs**, so there are m × n partial derivatives",
        "Arrange them in a matrix: row i = gradient of output i",
        "Near a point, the function acts like the **linear map** J: Δy ≈ J Δx",
        "For y = Wx, the Jacobian is simply ==W itself==",
      ],
      def: String.raw`J_f(\mathbf{x})=\frac{\partial\mathbf{y}}{\partial\mathbf{x}}=\begin{bmatrix}\frac{\partial y_1}{\partial x_1}&\cdots&\frac{\partial y_1}{\partial x_n}\\ \vdots&\ddots&\vdots\\ \frac{\partial y_m}{\partial x_1}&\cdots&\frac{\partial y_m}{\partial x_n}\end{bmatrix}\in\mathbb{R}^{m\times n}`,
      defNote: "Element-wise functions like ReLU have a **diagonal** Jacobian: output i depends only on input i.",
      eqSize: 22,
      notes: "Shape check: m outputs by n inputs, the same shape as a weight matrix mapping R n to R m. Give the ReLU example: for input (2, -1, 3) the Jacobian is diag(1, 0, 1). Normalising flows (Day 13) need the determinant of a Jacobian; adversarial robustness papers bound the norm of the Jacobian of the network with respect to its input.",
    });
    d.example({
      title: "Worked example: a Jacobian by hand",
      problem: "f maps (x, y) to two outputs: f₁ = x²y and f₂ = 5x + sin y. Find J at (1, 0).",
      problemEq: String.raw`J=\begin{bmatrix}\partial_x f_1&\partial_y f_1\\ \partial_x f_2&\partial_y f_2\end{bmatrix}`,
      steps: [
        { eq: String.raw`\partial_x f_1=2xy,\quad \partial_y f_1=x^2`, note: "row 1" },
        { eq: String.raw`\partial_x f_2=5,\quad \partial_y f_2=\cos y`, note: "row 2" },
        { eq: String.raw`J(1,0)=\begin{bmatrix}0&1\\5&1\end{bmatrix}`, note: "evaluate" },
        { eq: String.raw`\Delta\mathbf{f}\approx J\begin{bmatrix}0.1\\0.1\end{bmatrix}=\begin{bmatrix}0.1\\0.6\end{bmatrix}`, note: "local linear prediction" },
      ],
      answer: "The Jacobian is the ==best linear approximation== of f near the point",
      notes: "Verify the last step numerically: at (1.1, 0.1), f1 = 1.21 times 0.1 = 0.121 versus 0 originally, predicted 0.1; f2 = 5.5 + 0.0998 = 5.5998 versus 5, predicted 0.6. Close, with small second-order error. That error is what the Hessian describes.",
    });
    d.concept({
      title: "The Hessian: curvature of the loss surface",
      intuition: [
        "The gradient says which way is downhill; the **Hessian** says how the slope itself changes",
        "Large eigenvalues = **sharp** directions; small = **flat** directions",
        "Ratio of largest to smallest eigenvalue = **condition number**: high means slow, zig-zag training",
        "Research on ==sharp vs flat minima== links curvature to generalisation",
      ],
      def: String.raw`H_f(\mathbf{x})=\nabla^2 f=\begin{bmatrix}\frac{\partial^2 f}{\partial x_1^2}&\cdots&\frac{\partial^2 f}{\partial x_1\partial x_n}\\ \vdots&\ddots&\vdots\\ \frac{\partial^2 f}{\partial x_n\partial x_1}&\cdots&\frac{\partial^2 f}{\partial x_n^2}\end{bmatrix}`,
      defNote: "H is symmetric, so by Day 4 it has real eigenvalues and orthogonal eigenvectors: the principal curvatures.",
      eqSize: 22,
      notes: "For f = x squared + 3xy + 2y squared from yesterday, H = [[2, 3], [3, 4]]: constant because f is quadratic. Its eigenvalues are 3 plus or minus root 10, one positive and one negative, so the stationary point at the origin is a saddle. Mention that a 7-billion-parameter model has a Hessian with 49 quintillion entries, so we never form it; we use Hessian-vector products instead.",
    });
    d.figure({
      title: "Reading critical points with the Hessian",
      fig: F("d06_critical"),
      wide: true,
      caption: "At a point where ∇f = 0: all Hessian eigenvalues > 0 → minimum; all < 0 → maximum; mixed signs → saddle. In high dimensions, most critical points of a neural-network loss are saddles.",
      notes: "Each surface has a flat point at the centre where the gradient vanishes. The Hessian tells them apart. Important research insight from Dauphin et al. 2014: in very high dimensions, it is overwhelmingly likely that some curvature directions are negative, so saddle points, not bad local minima, are the main obstacle. Noise in SGD helps escape saddles.",
    });
    d.figure({
      title: "Taylor expansion: approximate any smooth function locally",
      fig: F("d06_taylor"),
      points: [
        { icon: "ruler", text: "**1st order** (gradient): justifies gradient descent" },
        { icon: "mountain", text: "**2nd order** (Hessian): justifies Newton's method and learning-rate limits" },
        { icon: "warn", text: "Both are only good **near a**: big steps break the approximation" },
      ],
      notes: "The red dashed tangent matches the value and slope at a. The green parabola also matches the curvature, so it hugs the curve over a wider range. Optimisers are built by minimising these local models: minimise the linear model with a step limit and you get gradient descent; minimise the quadratic model and you get Newton's method.",
    });
    d.equation({
      title: "Taylor in many dimensions: the optimiser's local model",
      eq: String.raw`f(\mathbf{x}+\boldsymbol\delta)\approx f(\mathbf{x})+\nabla f(\mathbf{x})^{\top}\boldsymbol\delta+\tfrac12\,\boldsymbol\delta^{\top}H(\mathbf{x})\,\boldsymbol\delta`,
      legend: [
        [String.raw`\nabla f^{\top}\boldsymbol\delta`, "linear term: slope along the step"],
        [String.raw`\tfrac12\boldsymbol\delta^{\top}H\boldsymbol\delta`, "quadratic term: bending along the step"],
        [String.raw`\boldsymbol\delta^{*}=-H^{-1}\nabla f`, "Newton step: jump to the bottom of the local bowl"],
        [String.raw`\eta<2/\lambda_{\max}(H)`, "gradient descent is stable only below this step size"],
      ],
      foot: "Why learning rates blow up: if η exceeds ==2 / largest curvature==, each step overshoots more than the last (see Day 10).",
      notes: "Setting the derivative of the quadratic model to zero gives the Newton step. Newton is too expensive for deep nets, but approximations of it inspire Adam, Shampoo and K-FAC. The stability bound eta less than 2 over lambda max explains why sharp regions of the loss force small learning rates; recent research calls the phenomenon the edge of stability.",
    });

    d.section("Matrix calculus");
    d.table({
      title: "Matrix-calculus identities that appear in papers",
      head: ["Function", "Gradient", "Where you meet it"],
      colW: [3.3, 3.5, 5.33],
      rows: [
        ["f = aᵀx", "∇ₓf = a", "linear layer output w.r.t. its input"],
        ["f = xᵀAx", "∇ₓf = (A + Aᵀ)x  (= 2Ax if A symmetric)", "quadratic losses, Gaussians"],
        ["f = ‖x‖₂²", "∇ₓf = 2x", "weight decay, MSE"],
        ["f = ‖Xw − y‖²", "∇w f = 2Xᵀ(Xw − y)", "linear regression; set to 0 → normal equation"],
        ["y = Wx, upstream g = ∂L/∂y", "∂L/∂W = g xᵀ,  ∂L/∂x = Wᵀg", "backprop through every dense layer"],
        ["f = log Σᵢ e^(zᵢ)", "∇z f = softmax(z)", "cross-entropy, log-sum-exp"],
      ],
      fontSize: 14,
      foot: "Shape rule for checking: ==∂L/∂W always has the same shape as W==.",
      notes: "The fifth row is the most important line of backprop. The gradient for a weight matrix is an outer product: upstream error times input transposed. The gradient passed further down is W transpose times the upstream error. Show the shape check: g is m by 1, x transpose is 1 by n, so g x transpose is m by n, same as W. The last row explains why softmax appears as the gradient of log-sum-exp.",
    });
    d.example({
      title: "Worked example: least squares by matrix calculus",
      problem: "Find w minimising L(w) = ‖Xw − y‖² for a data matrix X (n × d) and targets y.",
      problemEq: String.raw`L(\mathbf{w})=(X\mathbf{w}-\mathbf{y})^{\top}(X\mathbf{w}-\mathbf{y})`,
      steps: [
        { eq: String.raw`L=\mathbf{w}^{\top}X^{\top}X\mathbf{w}-2\mathbf{y}^{\top}X\mathbf{w}+\mathbf{y}^{\top}\mathbf{y}`, note: "expand" },
        { eq: String.raw`\nabla_{\mathbf{w}}L=2X^{\top}X\mathbf{w}-2X^{\top}\mathbf{y}`, note: "use xᵀAx and aᵀx rules" },
        { eq: String.raw`X^{\top}X\,\mathbf{w}^{*}=X^{\top}\mathbf{y}`, note: "set gradient to 0" },
        { eq: String.raw`\mathbf{w}^{*}=(X^{\top}X)^{-1}X^{\top}\mathbf{y}`, note: "normal equation" },
      ],
      answer: "The Hessian 2XᵀX is positive semi-definite, so this is a ==global minimum== (convex, Day 10)",
      notes: "This connects Day 3, where we quoted the normal equation, with today, where we derive it. The Hessian 2 X transpose X is positive semi-definite because w transpose X transpose X w = norm of Xw squared, never negative. Linear regression is therefore a convex problem with a unique solution when X has full column rank.",
    });

    d.section("Backpropagation");
    const g = D.graph({
      W: 1200, H: 430,
      nodes: [
        { id: "x", x: 70, y: 110, w: 90, h: 56, label: "$x=2$", fill: P.soft.blue, stroke: "blue" },
        { id: "w", x: 70, y: 230, w: 90, h: 56, label: "$w=0.5$", fill: P.soft.violet, stroke: "violet" },
        { id: "b", x: 70, y: 340, w: 90, h: 56, label: "$b=0$", fill: P.soft.violet, stroke: "violet" },
        { id: "m", x: 290, y: 170, w: 64, shape: "circle", label: "$\\times$", fill: "white", stroke: "navy", fs: 26 },
        { id: "a", x: 470, y: 250, w: 64, shape: "circle", label: "$+$", fill: "white", stroke: "navy", fs: 26 },
        { id: "s", x: 680, y: 250, w: 64, shape: "circle", label: "$\\sigma$", fill: "white", stroke: "navy", fs: 24 },
        { id: "y", x: 680, y: 380, w: 90, h: 50, label: "$y=1$", fill: P.soft.green, stroke: "green" },
        { id: "l", x: 900, y: 250, w: 84, shape: "circle", label: "$(\\cdot)^2$", fill: "white", stroke: "navy", fs: 20 },
        { id: "L", x: 1110, y: 250, w: 130, h: 64, label: "$L=0.072$", fill: P.soft.coral, stroke: "coral" },
      ],
      edges: [
        { a: "x", b: "m", color: "navy" }, { a: "w", b: "m", color: "navy" }, { a: "m", b: "a", color: "navy", label: "$z_1=1$", lofs: [-20, -22] },
        { a: "b", b: "a", color: "navy" }, { a: "a", b: "s", color: "navy", label: "$z=1$", lofs: [0, -24] },
        { a: "s", b: "l", color: "navy", label: "$\\hat y=0.731$", lofs: [0, -24] }, { a: "y", b: "l", color: "navy", label: "$\\hat y-y$", lofs: [30, 0] },
        { a: "l", b: "L", color: "navy" },
      ],
      extraHtml:
        D.label(1110, 315, "$\\partial L/\\partial L=1$", { color: "coral", bold: true, fs: 19 }) +
        D.label(790, 195, "$\\bar{\\hat y}=2(\\hat y-y)=-0.538$", { color: "coral", bold: true, fs: 19 }) +
        D.label(575, 195, "$\\bar z=-0.538\\cdot0.197=-0.106$", { color: "coral", bold: true, fs: 19 }) +
        D.label(470, 330, "$\\bar b=\\bar z=-0.106$", { color: "coral", bold: true, fs: 19 }) +
        D.label(300, 100, "$\\bar w=\\bar z\\cdot x=-0.212$", { color: "coral", bold: true, fs: 19 }) +
        D.label(600, 28, "black: forward values (left → right)        red: gradients (right → left)", { color: "muted", fs: 17 }),
    });
    d.diagram({
      title: "A computational graph: forward values, backward gradients",
      diag: g,
      chips: [
        ["Forward pass", "Compute and store every intermediate value, left to right."],
        ["Backward pass", "Start with ∂L/∂L = 1; each node multiplies by its local derivative and passes it back."],
        ["Fan-in", "When a value feeds several nodes, add the gradients that come back from each."],
      ],
      notes: "This is the same neuron as yesterday's worked example, now drawn as a graph. The forward pass computes z1 = 1, z = 1, y-hat = 0.731 and L = 0.072. The backward pass starts at the loss with gradient 1 and moves right to left. Each node needs only its own local derivative: the square node contributes 2(y-hat minus y), the sigmoid node sigma(1 - sigma), the plus node passes the gradient unchanged to both inputs, and the times node sends each input the gradient times the other input. A bar over a variable is common notation for the gradient of the loss with respect to it.",
    });
    d.compare({
      title: "Forward mode vs reverse mode automatic differentiation",
      cols: [
        { head: "Forward mode", icon: "arrow", items: ["Push derivatives **forward** alongside values", "One pass per **input** direction", "Cheap when inputs are few, outputs many", "Used for Jacobian-vector products (JVPs)"] },
        { head: "Reverse mode (backprop)", icon: "random", items: ["Store values forward, push gradients **backward**", "One pass per **output**: the loss is a single number", "Gradient of 1 loss w.r.t. 10⁹ weights costs ≈ ==2–3 forward passes==", "Memory cost: activations must be stored"] },
        { head: "Practical tricks", icon: "cog", items: ["**Gradient checkpointing**: recompute activations to save memory", "**Mixed precision**: forward in 16-bit, careful scaling of gradients", "**Gradient check** with finite differences (Day 5)"] },
      ],
      notes: "Explain why deep learning uses reverse mode: we have one scalar loss and billions of parameters, so one backward pass gives all partial derivatives. Forward mode would need a billion passes. The cost: all activations from the forward pass must be stored for the backward pass, which is why GPU memory, not compute, often limits batch size. Checkpointing trades compute for memory.",
    });
    d.equation({
      title: "Backprop through one dense layer: the three equations",
      eq: String.raw`\mathbf{z}=W\mathbf{x}+\mathbf{b}\ \Rightarrow\ \frac{\partial L}{\partial W}=\boldsymbol\delta\,\mathbf{x}^{\top},\quad \frac{\partial L}{\partial\mathbf{b}}=\boldsymbol\delta,\quad \frac{\partial L}{\partial\mathbf{x}}=W^{\top}\boldsymbol\delta`,
      legend: [
        [String.raw`\boldsymbol\delta=\frac{\partial L}{\partial\mathbf{z}}`, "error signal arriving from the layer above"],
        [String.raw`\boldsymbol\delta\,\mathbf{x}^{\top}`, "outer product: same shape as W"],
        [String.raw`W^{\top}\boldsymbol\delta`, "error sent down to the previous layer"],
        [String.raw`\boldsymbol\delta\odot\phi'(\mathbf{z})`, "through an activation: multiply element-wise"],
      ],
      foot: "A batch of B examples: ∂L/∂W = ==ΔᵀX==, summing the outer products over the batch.",
      eqSize: 28,
      notes: "These three lines are all of backpropagation for an MLP, applied layer by layer from the top. The circle-dot symbol is element-wise multiplication, the Hadamard product. On Day 11 we will run these equations with numbers on a two-layer network. Ask students to verify the shapes for W of shape 3 by 4.",
    });
    d.code({
      title: "Autograd does exactly this: check it yourself",
      code: `import torch

x = torch.tensor(2.0)
w = torch.tensor(0.5, requires_grad=True)
b = torch.tensor(0.0, requires_grad=True)
y = torch.tensor(1.0)

z = w * x + b
y_hat = torch.sigmoid(z)
L = (y_hat - y) ** 2          # forward: 0.0723

L.backward()                  # reverse-mode autodiff
print(w.grad, b.grad)         # -0.2124, -0.1062

# Jacobian and Hessian of small functions
from torch.autograd.functional import jacobian, hessian
f = lambda v: torch.stack([v[0]**2 * v[1], 5*v[0] + torch.sin(v[1])])
print(jacobian(f, torch.tensor([1.0, 0.0])))   # [[0,1],[5,1]]
g = lambda v: v[0]**2 + 3*v[0]*v[1] + 2*v[1]**2
print(hessian(g, torch.tensor([1.0, 2.0])))    # [[2,3],[3,4]]`,
      points: [
        "requires_grad=True tells PyTorch to **record** the graph",
        "backward() runs the **reverse pass**; .grad matches our hand calculation",
        "jacobian / hessian helpers verify hand derivations on small examples",
        "Habit: test every hand-derived gradient against autograd before trusting it",
      ],
      fontSize: 12.5,
      notes: "Run this live and show that the numbers exactly match the computational-graph slide. Then show the Jacobian and Hessian helpers reproducing the worked examples. This builds trust in both directions: in your own derivations and in the framework.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\frac{\partial\mathcal{L}}{\partial\mathbf{h}^{(\ell)}}=\Big(\frac{\partial\mathbf{h}^{(\ell+1)}}{\partial\mathbf{h}^{(\ell)}}\Big)^{\!\top}\frac{\partial\mathcal{L}}{\partial\mathbf{h}^{(\ell+1)}}`, read: "The gradient at layer ℓ is the **transposed Jacobian** of the next layer times the gradient above it." },
        { eq: String.raw`\prod_{\ell=1}^{L}\Big\|\frac{\partial\mathbf{h}^{(\ell)}}{\partial\mathbf{h}^{(\ell-1)}}\Big\|`, read: "A product of Jacobian norms across depth: **vanishes** if each < 1, **explodes** if each > 1." },
        { eq: String.raw`\lambda_{\max}(\nabla^2\mathcal{L})\approx 2/\eta`, read: "During training, the sharpness rises until it hovers at **2/η**: the edge of stability.", src: "Cohen et al. 2021" },
        { eq: String.raw`\mathcal{L}(\theta)\approx\mathcal{L}(\theta_0)+\mathbf{g}^{\top}\Delta\theta+\tfrac12\Delta\theta^{\top}H\Delta\theta`, read: "A **second-order Taylor model** of the loss, used to analyse pruning, quantisation and learning rates." },
      ],
      notes: "Row 2 is the formal statement of the vanishing and exploding gradient problem. Row 4 appears in classic pruning papers such as Optimal Brain Damage and in modern quantisation papers like GPTQ, which use the Hessian to decide which weights matter most.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Write the Jacobian of f(x, y) = (xy, x + y, x²) and state its shape." },
        { lvl: "Warm-up", text: "Find the Hessian of f(x, y) = x² + 4xy + y². Is the origin a min, max or saddle?" },
        { lvl: "Core", text: "For y = Wx with W ∈ ℝ^{3×4}, x ∈ ℝ⁴ and upstream gradient g ∈ ℝ³, give the shapes of ∂L/∂W and ∂L/∂x and their formulas." },
        { lvl: "Core", text: "Draw the computational graph of L = (a·b + c)² with a = 1, b = 2, c = −1. Do forward and backward passes to get ∂L/∂a, ∂L/∂b, ∂L/∂c." },
        { lvl: "Code", text: "Verify problem 4 with torch.autograd. Then use torch.autograd.functional.hessian on f from problem 2." },
        { lvl: "Challenge", text: "Show that ∇_z log Σᵢ e^(zᵢ) = softmax(z). Then find its Jacobian (the softmax Jacobian) diag(p) − ppᵀ." },
      ],
      notes: "Answers: 1) [[y, x], [1, 1], [2x, 0]], 3 by 2. 2) H = [[2, 4], [4, 2]], eigenvalues 6 and -2, saddle. 3) dL/dW = g x transpose, 3 by 4; dL/dx = W transpose g, length 4. 4) u = ab + c = 1, L = 1; dL/du = 2; dL/da = 2b = 4, dL/db = 2a = 2, dL/dc = 2. 6) differentiate the log of the sum; the softmax Jacobian appears in every attention backward pass.",
    });
    d.recap({
      points: [
        "**Jacobian** J ∈ ℝ^{m×n}: the local linear map of a vector function (for Wx, J = W)",
        "**Hessian** = curvature; its eigenvalues classify min, max and saddle",
        "Taylor: f(x+δ) ≈ f + ∇fᵀδ + ½δᵀHδ is the optimiser's local model",
        "Dense layer backprop: ∂L/∂W = δxᵀ, ∂L/∂x = Wᵀδ; ==∂L/∂W has W's shape==",
        "**Reverse-mode autodiff** gives all gradients of one loss in one backward pass",
      ],
      next: "Probability I: reasoning under uncertainty",
      nextTopics: ["Random variables and distributions", "Expectation and variance", "Conditional probability", "Bayes' theorem"],
      notes: "This completes the calculus block. Tomorrow we change subject entirely: models output probabilities, losses are built from probability, and data is noisy. Probability is the language for all of that.",
    });
  },
};
