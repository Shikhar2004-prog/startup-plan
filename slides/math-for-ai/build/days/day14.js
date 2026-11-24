// Day 14 — Reinforcement learning
module.exports = {
  day: 14,
  short: "Reinforcement learning",
  file: "Day-14-Reinforcement-Learning-MDPs-to-RLHF",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Reinforcement Learning: from MDPs to RLHF",
      subtitle: "Returns, value functions, the Bellman equations, Q-learning, policy gradients, PPO and aligning language models with preferences",
      topics: ["MDPs", "Returns", "Bellman", "Q-learning", "Policy gradient", "PPO", "RLHF and DPO"],
      eq: String.raw`V^*(s)=\max_a\,\mathbb{E}\big[r+\gamma V^*(s')\big]`,
      notes: "So far the right answer was given to the model: a label, the next token, the clean image. In reinforcement learning the model only receives a reward, often delayed, and must work out which of its actions caused it. This is how AlphaGo learned, how robots learn to walk, and how ChatGPT-style models were tuned to follow instructions.",
    });
    d.objectives({
      goals: [
        "Model a problem as an **MDP** and compute **discounted returns**",
        "Write and use the **Bellman equations** for V and Q",
        "Run **value iteration** and a **Q-learning** update by hand",
        "Derive the **policy gradient** with the log-derivative trick",
        "Read the **PPO**, **RLHF** and **DPO** objectives used for LLMs",
      ],
      why: "RLHF and its successors (DPO, GRPO for reasoning models) are how ==every major chat model is aligned==. Their papers are short, but every line is RL math.",
      prereq: "Day 5 (gradients), Day 7 (expectations, conditional probability), Day 9 (KL), Day 10 (SGD), Day 12 (softmax policies over tokens).",
      notes: "The day splits in two: value-based methods (Bellman, Q-learning) and policy-based methods (policy gradient, PPO). We finish by showing that RLHF is policy-gradient RL where the 'environment' is a reward model trained on human preferences.",
    });

    d.section("Markov decision processes");
    const loop = D.graph({
      W: 1100, H: 340,
      nodes: [
        { id: "ag", x: 220, y: 170, w: 240, h: 110, label: "Agent", sub: "policy π(a | s)", fill: P.soft.violet, stroke: "violet", fs: 26, sfs: 18 },
        { id: "env", x: 880, y: 170, w: 240, h: 110, label: "Environment", sub: "p(s′, r | s, a)", fill: P.soft.green, stroke: "green", fs: 26, sfs: 18 },
      ],
      edges: [
        { a: "ag", b: "env", color: "navy", bend: -110, width: 3, label: "action  $a_t$", lfs: 20, lofs: [0, -16] },
        { a: "env", b: "ag", color: "gold", bend: -70, width: 3, label: "reward  $r_{t+1}$", lfs: 20, lofs: [0, 14] },
        { a: "env", b: "ag", color: "teal", bend: -150, width: 3, label: "next state  $s_{t+1}$", lfs: 20, lofs: [0, 16] },
      ],
    });
    d.diagram({
      title: "The agent–environment loop",
      diag: loop,
      chips: [
        ["Examples", "Chess: board → move → win/lose. Robot: sensors → torques → distance walked. LLM: prompt → reply → human rating."],
        ["Markov property", "The next state depends only on the current state and action, not the whole history."],
        ["Goal", "Choose actions to maximise the total (discounted) reward, not the immediate one."],
      ],
      notes: "Walk round the loop once with a concrete example. At time t the agent sees state s_t, samples an action from its policy, the environment returns a reward and a new state. The trajectory s0, a0, r1, s1, a1, r2 and so on is the data RL learns from. The hard part is credit assignment: a reward now may be due to an action many steps ago.",
    });
    d.equation({
      title: "MDPs and the discounted return",
      eq: String.raw`\mathcal{M}=(\mathcal{S},\mathcal{A},p,r,\gamma),\qquad G_t=r_{t+1}+\gamma r_{t+2}+\gamma^2r_{t+3}+\dots=\sum_{k=0}^{\infty}\gamma^k r_{t+k+1}=r_{t+1}+\gamma\,G_{t+1}`,
      legend: [
        [String.raw`\mathcal{S},\mathcal{A}`, "sets of states and actions"],
        [String.raw`p(s'\mid s,a)`, "transition probabilities (Day 7): the world can be random"],
        [String.raw`\gamma\in[0,1)`, "discount: a reward k steps away is worth γᵏ now"],
        [String.raw`G_t=r_{t+1}+\gamma G_{t+1}`, "the recursion that every RL algorithm is built on"],
      ],
      foot: "With rewards bounded by R, the return is at most ==R / (1 − γ)==: γ = 0.99 means an effective horizon of about 100 steps.",
      eqSize: 20,
      notes: "Discounting does three jobs: it keeps infinite sums finite (geometric series, Day 1), it encodes a preference for sooner rewards, and it makes the maths contract nicely. The last form, G_t = r plus gamma G_t+1, is the seed of the Bellman equation on the next slides.",
    });
    d.example({
      title: "Worked example: computing a return two ways",
      problem: "An episode gives rewards r₁ = 1, r₂ = 0, r₃ = 2, r₄ = 5, then ends. Discount γ = 0.9. Find G₀.",
      problemEq: String.raw`G_t=r_{t+1}+\gamma\,G_{t+1}`,
      steps: [
        { eq: String.raw`G_0=1+0.9\cdot0+0.81\cdot2+0.729\cdot5`, note: "direct sum" },
        { eq: String.raw`=1+0+1.62+3.645=6.265`, note: "evaluate" },
        { eq: String.raw`G_3=5,\ \ G_2=2+0.9\cdot5=6.5`, note: "backwards" },
        { eq: String.raw`G_1=0+0.9\cdot6.5=5.85,\ \ G_0=1+0.9\cdot5.85=6.265`, note: "same answer" },
      ],
      answer: "G₀ = ==6.265==. Computing backwards from the end is how REINFORCE code calculates returns",
      notes: "The backward recursion is O(T) and is exactly the loop students will write in code. Ask: what is G0 with gamma = 0? Just 1, the immediate reward: a totally short-sighted agent. With gamma = 1: 8, every reward counts equally.",
    });

    d.section("Value functions and Bellman");
    d.equation({
      title: "Value functions and the Bellman equations",
      eq: String.raw`V^\pi(s)=\mathbb{E}_\pi\big[G_t\mid s_t=s\big],\qquad Q^*(s,a)=\sum_{s'}p(s'\mid s,a)\Big[r+\gamma\max_{a'}Q^*(s',a')\Big]`,
      legend: [
        [String.raw`V^\pi(s)`, "how good is it to be in state s, then follow π"],
        [String.raw`Q^\pi(s,a)`, "how good is action a in state s, then follow π"],
        [String.raw`Q^*`, "optimal values: the Bellman optimality equation (a fixed point)"],
        [String.raw`\pi^*`, "π*(s) = argmax_a Q*(s, a): once Q* is known, acting is just argmax"],
      ],
      foot: "Bellman = take one real step, then trust your estimate for the rest: ==value now = reward + γ · value next==.",
      eqSize: 22,
      notes: "Take the expectation of the recursion G_t = r + gamma G_t+1 and you get the Bellman equations. They turn an infinite-horizon problem into a set of local consistency conditions between neighbouring states. The optimality version has a max inside, which makes it non-linear, but the Bellman operator is a gamma-contraction, so repeated application converges to a unique fixed point.",
    });
    d.example({
      title: "Worked example: one Bellman backup",
      problem: "In state s, γ = 0.9. Action a₁: reward 0, always moves to a state worth V = 10. Action a₂: reward 2, then 50% to a state worth 10 and 50% to a state worth 0.",
      problemEq: String.raw`Q(s,a)=\sum_{s'}p(s'\mid s,a)\big[r+\gamma V(s')\big]`,
      steps: [
        { eq: String.raw`Q(s,a_1)=0+0.9\cdot10=9`, note: "safe action" },
        { eq: String.raw`Q(s,a_2)=2+0.9\,(0.5\cdot10+0.5\cdot0)=6.5`, note: "expected value" },
        { eq: String.raw`V(s)=\max(9,\ 6.5)=9`, note: "Bellman max" },
        { eq: String.raw`\pi(s)=a_1`, note: "greedy policy" },
      ],
      answer: "The bigger immediate reward loses: a₁ is better because of ==what it leads to==",
      notes: "This is the whole idea of planning in one calculation. A greedy agent that only looks at immediate reward would choose a2 and be wrong. Value iteration simply applies this backup to every state, over and over, until nothing changes.",
    });
    d.figure({
      title: "Value iteration on a grid world",
      fig: F("d14_grid"),
      points: [
        { icon: "target", text: "+1 at the goal, −1 in the pit, walls in grey, γ = 0.9" },
        { icon: "cog", text: "Repeat for every state: V(s) ← max_a Σ p(s′|s,a)[r + γV(s′)]" },
        { icon: "compass", text: "Arrows = **argmax**: the optimal policy falls out of V*" },
        { icon: "check", text: "Converges because the Bellman operator is a ==γ-contraction==" },
      ],
      notes: "Values decay by roughly a factor of gamma per step away from the goal, slightly more because moves are noisy, so the agent sometimes slips sideways. Note the cell next to the pit: its best action points away from the pit even though the goal is close, because slipping into the pit costs minus 1. Value iteration needs the model p; Q-learning on the next slide does not.",
    });
    d.equation({
      title: "Q-learning: learn Q* from experience, no model needed",
      eq: String.raw`Q(s,a)\ \leftarrow\ Q(s,a)+\alpha\Big[\underbrace{r+\gamma\max_{a'}Q(s',a')}_{\text{TD target}}-Q(s,a)\Big]`,
      legend: [
        [String.raw`(s,a,r,s')`, "one observed transition: no transition probabilities required"],
        [String.raw`\alpha`, "learning rate (Day 10): a running average of targets"],
        [String.raw`\delta=\text{target}-Q`, "temporal-difference (TD) error: the surprise"],
        [String.raw`\varepsilon\text{-greedy}`, "explore: random action with probability ε, else argmax Q"],
      ],
      foot: "Example: Q = 2, r = 1, γ = 0.9, max Q(s′, ·) = 5, α = 0.1: target 5.5, TD error 3.5, new Q = ==2.35==.",
      eqSize: 23,
      notes: "Q-learning replaces the expectation over next states in the Bellman equation by a single sample, and averages many samples through the learning rate. It is off-policy: it learns the greedy policy's values while behaving epsilon-greedily. DQN (Mnih et al. 2015) used a neural network for Q, plus a replay buffer and a target network, to play Atari from pixels.",
    });

    d.section("Policy gradients and PPO");
    d.equation({
      title: "The policy gradient: the log-derivative trick",
      eq: String.raw`J(\theta)=\mathbb{E}_{\tau\sim\pi_\theta}\big[G(\tau)\big],\qquad \nabla_\theta J=\mathbb{E}_{\tau\sim\pi_\theta}\Big[\sum_{t}\nabla_\theta\log\pi_\theta(a_t\mid s_t)\,\big(G_t-b(s_t)\big)\Big]`,
      legend: [
        [String.raw`\nabla p=p\,\nabla\log p`, "the trick: lets the gradient sit inside an expectation we can sample"],
        [String.raw`\nabla\log\pi_\theta(a\mid s)`, "direction that makes action a more likely"],
        [String.raw`G_t-b`, "advantage: was this better than usual? b is a baseline, often V(s)"],
        [String.raw`\text{REINFORCE}`, "sample episodes, weight log-prob gradients by advantage, step"],
      ],
      foot: "Intuition: ==push up== log-probabilities of actions that did better than expected, ==push down== the rest.",
      eqSize: 20,
      notes: "Derivation: J = sum over trajectories of p_theta(tau) G(tau). Its gradient is sum of grad p times G. Replace grad p by p times grad log p, which turns it back into an expectation. The environment's transition probabilities do not depend on theta, so only the policy terms survive in grad log p(tau). Subtracting a baseline does not change the expectation but reduces variance a lot.",
    });
    d.example({
      title: "Worked example: one REINFORCE update",
      problem: "Two actions, softmax policy with logits θ = (0, 0), so π = (0.5, 0.5). We sample a₁ and observe advantage G − b = 2. Learning rate α = 0.1.",
      problemEq: String.raw`\nabla_{\boldsymbol\theta}\log\mathrm{softmax}(\boldsymbol\theta)_{a}=\mathbf{e}_a-\boldsymbol\pi`,
      steps: [
        { eq: String.raw`\nabla_{\boldsymbol\theta}\log\pi(a_1)=(1,0)-(0.5,0.5)=(0.5,-0.5)`, note: "score function" },
        { eq: String.raw`\Delta\boldsymbol\theta=\alpha\cdot2\cdot(0.5,-0.5)=(0.1,-0.1)`, note: "scale by advantage" },
        { eq: String.raw`\boldsymbol\theta\leftarrow(0.1,\ -0.1)`, note: "update" },
        { eq: String.raw`\pi(a_1)=\frac{e^{0.1}}{e^{0.1}+e^{-0.1}}=\sigma(0.2)=0.550`, note: "new policy" },
      ],
      answer: "A good outcome raised π(a₁) from 0.50 to ==0.55==. A negative advantage would have lowered it",
      notes: "The gradient of log softmax is one-hot minus probabilities, the same expression as the cross-entropy gradient from Day 11. In fact REINFORCE is cross-entropy training on your own samples, weighted by advantage. For an LLM, each token is an action and the policy is the softmax over the vocabulary.",
    });
    d.equation({
      title: "PPO: take a policy step, but not too big",
      eq: String.raw`r_t(\theta)=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\theta_{\text{old}}}(a_t\mid s_t)},\qquad L^{\text{CLIP}}(\theta)=\mathbb{E}_t\Big[\min\big(r_t\hat A_t,\ \mathrm{clip}(r_t,1-\epsilon,1+\epsilon)\,\hat A_t\big)\Big]`,
      legend: [
        [String.raw`r_t(\theta)`, "probability ratio: how much the new policy changed this action's probability"],
        [String.raw`\hat A_t`, "advantage estimate (often GAE using a learned V)"],
        [String.raw`\mathrm{clip}(r,1\pm\epsilon)`, "ε ≈ 0.2: no extra credit for moving the ratio beyond ±20%"],
        [String.raw`\min(\cdot,\cdot)`, "pessimistic bound: the objective never rewards over-shooting"],
      ],
      foot: "Lets you reuse one batch of samples for several gradient steps ==without the policy collapsing==.",
      eqSize: 20,
      notes: "Plain policy gradients can take a step so large that the policy becomes terrible and never recovers, because the next data are collected with that bad policy. PPO (Schulman et al. 2017) keeps the update in a trust region around the old policy cheaply, using clipping instead of TRPO's second-order constraint.",
    });
    d.figure({
      title: "What the clip does to the objective",
      fig: F("d14_ppo"), wide: true,
      points: [
        { icon: "check", text: "A > 0: objective rises with r only until **1 + ε**, then goes flat (no gradient)" },
        { icon: "warn", text: "A < 0: lowering r helps only down to **1 − ε**" },
        { icon: "balance", text: "Shaded band = trust region where the ==plain surrogate rA applies==" },
      ],
      notes: "Read each panel. For a good action, increasing its probability ratio increases the objective, but only up to 1.2; beyond that the min selects the clipped, flat term, so the gradient is zero and the optimiser stops pushing. For a bad action the mirror image holds. The dashed line is the unclipped objective, which would keep rewarding ever larger changes.",
    });

    d.section("Aligning language models");
    const rlhf = D.graph({
      W: 1200, H: 340,
      nodes: [
        { id: "pt", x: 100, y: 130, w: 170, h: 80, label: "Pretrained LM", sub: "next-token loss (Day 12)", fill: P.soft.blue, stroke: "blue", fs: 19 },
        { id: "sft", x: 360, y: 130, w: 170, h: 80, label: "SFT model", sub: "fine-tune on demos", fill: P.soft.violet, stroke: "violet", fs: 19 },
        { id: "rm", x: 640, y: 130, w: 210, h: 80, label: "Reward model $r_\\phi$", sub: "humans pick better of 2", fill: P.soft.gold, stroke: "gold", fs: 19 },
        { id: "ppo", x: 950, y: 130, w: 230, h: 80, label: "RL with PPO", sub: "max r − β·KL(π ‖ π_SFT)", fill: P.soft.green, stroke: "green", fs: 19 },
        { id: "al", x: 950, y: 290, w: 230, h: 64, label: "Aligned policy $\\pi_\\theta$", fill: "white", stroke: "navy", fs: 19 },
      ],
      edges: [
        { a: "pt", b: "sft", color: "navy" }, { a: "sft", b: "rm", color: "navy" }, { a: "rm", b: "ppo", color: "navy" }, { a: "ppo", b: "al", color: "navy" },
        { a: "sft", b: "al", color: "coral", bend: 70, dash: true, width: 3, label: "DPO: skip the reward model and RL", lfs: 17, lofs: [0, 12] },
      ],
    });
    d.diagram({
      title: "RLHF: reinforcement learning from human feedback",
      diag: rlhf,
      chips: [
        ["Reward model", "Bradley–Terry: P(y_w ≻ y_l) = σ(r(x, y_w) − r(x, y_l)), trained with BCE."],
        ["RL step", "Each reply is an episode, each token an action; the KL term stops reward hacking."],
        ["DPO", "Rewrites the same objective as a classification loss directly on preference pairs."],
      ],
      notes: "InstructGPT (Ouyang et al. 2022) introduced this three-stage recipe. The reward model turns pairwise human choices into a scalar score using the Bradley-Terry model, which is logistic regression on the reward difference. The KL penalty to the SFT model is the Day 9 KL divergence; without it the policy finds weird text that fools the reward model.",
    });
    d.equation({
      title: "From preferences to a loss: Bradley–Terry and DPO",
      eq: String.raw`\mathcal{L}_{\text{DPO}}=-\log\sigma\Big(\beta\log\frac{\pi_\theta(y_w\mid x)}{\pi_{\text{ref}}(y_w\mid x)}-\beta\log\frac{\pi_\theta(y_l\mid x)}{\pi_{\text{ref}}(y_l\mid x)}\Big)`,
      legend: [
        [String.raw`y_w,\ y_l`, "preferred and rejected replies; DPO starts from max E[r] − β·KL(π ‖ π_ref)"],
        [String.raw`\pi^*\propto\pi_{\text{ref}}\,e^{r/\beta}`, "closed-form optimum of the KL-regularised objective"],
        [String.raw`\beta\log\frac{\pi_\theta}{\pi_{\text{ref}}}`, "the implicit reward: invert the optimum to express r through π"],
        [String.raw`-\log\sigma(\cdot)`, "Bradley–Terry likelihood: binary cross-entropy on the reward gap"],
      ],
      foot: "Worked check: implicit rewards 2.0 and 0.5 give σ(1.5) = 0.818 and loss −log 0.818 = ==0.201==.",
      eqSize: 22,
      notes: "This derivation is short and worth doing on the board. The KL-regularised objective has the closed-form solution pi star proportional to pi_ref times exp of r over beta (a Gibbs distribution). Solve for r: r = beta log of pi star over pi_ref plus a term that depends only on x. Substitute into the Bradley-Terry likelihood; the x-only term cancels in the difference, leaving the DPO loss. No reward model and no sampling are needed.",
    });
    d.code({
      title: "Tabular Q-learning in a few lines",
      code: `import numpy as np
rng = np.random.default_rng(0)
# corridor: states 0..5, reward +1 at 5; actions 0=left, 1=right
nS, nA, goal = 6, 2, 5
Q = np.zeros((nS, nA)); alpha, gamma, eps = 0.5, 0.9, 0.1

for episode in range(200):
    s = 0
    while s != goal:
        explore = rng.random() < eps
        a = rng.integers(nA) if explore else Q[s].argmax()
        s2 = max(0, s - 1) if a == 0 else s + 1
        r = 1.0 if s2 == goal else 0.0
        target = r + gamma * Q[s2].max() * (s2 != goal)
        Q[s, a] += alpha * (target - Q[s, a])
        s = s2

print(Q.max(1).round(3))   # [0.656 0.729 0.81  0.9   1.    0.   ]`,
      points: [
        "ε-greedy: **explore** sometimes, exploit otherwise",
        "(s2 != goal) zeroes the bootstrap at the **terminal** state",
        "Learned values are ==γ^(distance − 1)==: 0.9⁴ = 0.656",
        "Swap the table for a network and you have **DQN**",
      ],
      fontSize: 12,
      notes: "The printed values match the analytic answer: the state next to the goal is worth 1, then 0.9, 0.81 and so on, the same geometric decay as on the grid-world slide. Ask students to change gamma to 0.5 and predict the new values before running.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`Q^*(s,a)=\mathbb{E}_{s'}\big[r+\gamma\max_{a'}Q^*(s',a')\mid s,a\big]`, read: "The **Bellman optimality** equation that DQN regresses towards.", src: "Mnih et al. 2015" },
        { eq: String.raw`\nabla_\theta J(\theta)=\mathbb{E}_{\pi_\theta}\big[\nabla_\theta\log\pi_\theta(a|s)\,Q^{\pi_\theta}(s,a)\big]`, read: "The **policy gradient theorem**: score function times value.", src: "Sutton et al. 2000" },
        { eq: String.raw`L^{\text{CLIP}}=\hat{\mathbb{E}}_t\big[\min(r_t\hat A_t,\mathrm{clip}(r_t,1\!-\!\epsilon,1\!+\!\epsilon)\hat A_t)\big]`, read: "**PPO**: a clipped surrogate keeps each step in a trust region.", src: "Schulman et al. 2017" },
        { eq: String.raw`\hat A_i=\frac{r_i-\mathrm{mean}(r_{1..G})}{\mathrm{std}(r_{1..G})}`, read: "**GRPO**: sample G answers per prompt; the group average is the baseline, no value network.", src: "Shao et al. 2024" },
      ],
      notes: "GRPO is used to train reasoning models with verifiable rewards, for example whether a maths answer is correct. It is REINFORCE with a baseline equal to the mean reward of a group of samples for the same prompt, standardised as a z-score (Day 8), plus PPO-style clipping and a KL penalty.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Rewards (0, 0, 0, 10), γ = 0.5. Compute G₀ both directly and with the backward recursion." },
        { lvl: "Warm-up", text: "Do one Q-learning update: Q = 0, r = −1, γ = 0.9, max Q(s′, ·) = 4, α = 0.5." },
        { lvl: "Core", text: "Derive ∇_θ J = E[∇_θ log π_θ(a|s) G] for a one-step problem using ∇p = p∇log p." },
        { lvl: "Core", text: "Show that subtracting a constant baseline b leaves the policy gradient unbiased: E[∇log π · b] = 0." },
        { lvl: "Code", text: "Extend the Q-learning code to the 4×5 grid world with walls and a pit. Compare your V with the value-iteration figure." },
        { lvl: "Research", text: "Starting from max E[r] − β KL(π ‖ π_ref), derive π* ∝ π_ref · exp(r/β) and then the DPO loss." },
      ],
      notes: "Answers: 1) 10 times 0.125 = 1.25; backwards: G3 = 10, G2 = 5, G1 = 2.5, G0 = 1.25. 2) target = -1 + 3.6 = 2.6, Q = 0 + 0.5 times 2.6 = 1.3. 3) J = sum_a pi(a) r(a); gradient = sum_a grad pi(a) r(a) = sum_a pi(a) grad log pi(a) r(a). 4) E[grad log pi] = sum_a grad pi(a) = grad of 1 = 0. 6) Lagrangian with normalisation constraint, Gibbs solution, invert for r, substitute into Bradley-Terry.",
    });
    d.recap({
      points: [
        "MDP + discount: return **Gₜ = r + γ·Gₜ₊₁**",
        "Bellman: ==value now = reward + γ · value next==; solve by value iteration",
        "Q-learning: TD update towards r + γ max Q(s′, ·), no model needed",
        "Policy gradient: ∇J = E[∇log π · advantage]; **PPO clips** the ratio",
        "RLHF = reward model + PPO with KL; **DPO** turns it into a classification loss",
      ],
      next: "Research math, experiments and evaluation",
      nextTopics: ["Metrics, ROC and PR curves", "Confidence intervals and significance", "Seeds, ablations and scaling laws", "Writing the math in your own paper"],
      notes: "Tomorrow is the final day and turns everything towards doing research: how to measure a model properly, how to know whether an improvement is real, and how to write the mathematics in your own paper.",
    });
  },
};
