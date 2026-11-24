// Day 9 — Information theory
module.exports = {
  day: 9,
  short: "Information theory",
  file: "Day-09-Information-Theory-Entropy-and-KL",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Information Theory: Entropy, Cross-Entropy and KL",
      subtitle: "Measuring surprise and the distance between distributions: the theory behind the loss every LLM is trained on",
      topics: ["Surprise", "Entropy", "Cross-entropy", "KL divergence", "Softmax", "Perplexity"],
      eq: String.raw`H(p,q)=H(p)+D_{\mathrm{KL}}(p\,\|\,q)`,
      notes: "Claude Shannon founded information theory in 1948 to study communication. It turns out to be the natural language of machine learning. Today we define information as surprise, entropy as average surprise, cross-entropy as the cost of using the wrong distribution, and KL divergence as the extra cost. The equation of the day ties them together and explains why minimising cross-entropy makes a model match the data distribution.",
    });
    d.objectives({
      goals: [
        "Define the **information content** (surprise) of an event in bits and nats",
        "Compute **entropy** and explain it as uncertainty",
        "Derive the **cross-entropy loss** and connect it to MLE (Day 8)",
        "Use **KL divergence** and know its asymmetry (forward vs reverse)",
        "Implement a **numerically stable softmax**, use temperature, and read **perplexity**",
      ],
      why: "Cross-entropy trains classifiers and LLMs; ==KL divergence== appears in VAEs, knowledge distillation, RLHF and DPO; perplexity is the standard language-model metric.",
      prereq: "Day 1 (logs), Day 7 (distributions, expectation), Day 8 (MLE).",
      notes: "Everything today is a few lines of algebra on top of logs and expectations, but the ideas run through most of modern AI research.",
    });

    d.section("Surprise and entropy");
    d.concept({
      title: "Information = surprise",
      intuition: [
        "A certain event (p = 1) tells you **nothing new**: 0 information",
        "A rare event is **surprising**: lots of information",
        "Independent events should **add** their information, so we use a log",
        "Base 2 → **bits**; natural log → **nats** (what PyTorch uses)",
      ],
      def: String.raw`I(x)=-\log_2 p(x)\qquad\begin{aligned}p=1&\Rightarrow I=0\text{ bits}\\ p=\tfrac12&\Rightarrow I=1\text{ bit}\\ p=\tfrac18&\Rightarrow I=3\text{ bits}\end{aligned}`,
      defNote: "Why the log? For independent events p(x, y) = p(x)p(y), so I(x, y) = I(x) + I(y). Only the log turns products into sums (Day 1).",
      notes: "A fair coin flip carries one bit: one yes/no question resolves it. Guessing a number from 1 to 8 takes three yes/no questions, three bits. A one-in-a-million event carries about 20 bits. In language modelling, the loss on a token is exactly the surprise, in nats, of the true token under the model.",
    });
    d.equation({
      title: "Entropy: the average surprise of a distribution",
      eq: String.raw`H(p)=\mathbb{E}_{x\sim p}\big[-\log p(x)\big]=-\sum_{x}p(x)\log p(x)`,
      legend: [
        [String.raw`H=0`, "no uncertainty: one outcome has probability 1"],
        [String.raw`H=\log K`, "maximum: uniform over K outcomes"],
        [String.raw`0\log 0:=0`, "impossible outcomes contribute nothing"],
        [String.raw`H(p)\ \text{bits}`, "minimum average bits per symbol to encode samples of p"],
      ],
      foot: "Entropy is the ==limit of lossless compression==: no code can use fewer bits on average (Shannon, 1948).",
      notes: "Entropy measures uncertainty and also the best possible compression. English text has an entropy of roughly 1 bit per character, which is why it compresses so well. In ML, entropy appears as an exploration bonus in reinforcement learning and as a measure of how confident a model's predictions are.",
    });
    d.figure({
      title: "Entropy in pictures",
      fig: F("d09_entropy"),
      points: [
        { icon: "dice", text: "A fair coin is maximally uncertain: **1 bit**" },
        { icon: "target", text: "A peaked distribution is predictable: **low entropy**" },
        { icon: "layers", text: "Uniform over 4 outcomes: **log₂4 = 2 bits**" },
      ],
      notes: "Left: binary entropy is zero when the coin always lands one way and peaks at 1 bit for a fair coin. Right: three distributions over 4 outcomes. The peaked one, like a confident classifier, has entropy 0.42 bits; the uniform one has the maximum 2 bits. A language model that is unsure about the next token has a high-entropy output distribution.",
    });
    d.example({
      title: "Worked example: entropy of a model's prediction",
      problem: "A classifier outputs p = (0.5, 0.25, 0.125, 0.125) over 4 classes. Compute its entropy in bits and compare with the maximum.",
      steps: [
        { eq: String.raw`-0.5\log_2 0.5=0.5\times1=0.5`, note: "class 1" },
        { eq: String.raw`-0.25\log_2 0.25=0.25\times2=0.5`, note: "class 2" },
        { eq: String.raw`2\times(-0.125\log_2 0.125)=2\times0.375=0.75`, note: "classes 3, 4" },
        { eq: String.raw`H=0.5+0.5+0.75=1.75\ \text{bits}<\log_2 4=2`, note: "total" },
      ],
      answer: "H = 1.75 bits. An optimal code uses codewords of length ==1, 2, 3, 3 bits== (e.g. 0, 10, 110, 111)",
      notes: "This example is chosen so the logs are integers. The code lengths equal the surprises, minus log2 p, and the average code length equals the entropy exactly. This is the bridge between probability and compression: a good probabilistic model of data is a good compressor, a view that has recently been used to explain why large language models generalise.",
    });

    d.section("Cross-entropy and KL divergence");
    d.equation({
      title: "Cross-entropy: the cost of using q when the truth is p",
      eq: String.raw`H(p,q)=\mathbb{E}_{x\sim p}\big[-\log q(x)\big]=-\sum_x p(x)\log q(x)`,
      legend: [
        [String.raw`p`, "true distribution (data, or one-hot label)"],
        [String.raw`q`, "model's predicted distribution"],
        [String.raw`H(p,q)\ge H(p)`, "using the wrong code always costs extra"],
        [String.raw`p=\text{one-hot}(y)`, "then H(p, q) = −log q(y): the classification loss"],
      ],
      foot: "With one-hot labels, cross-entropy = −log(probability of the true class) = ==the NLL from Day 8==.",
      notes: "Two derivations meet here. From statistics (Day 8): maximum likelihood with a categorical model gives minus log q of the true class. From information theory: the average code length when the data comes from p but we use a code designed for q. Same formula. In PyTorch, nn.CrossEntropyLoss takes raw logits and does the softmax and log internally for stability.",
    });
    d.example({
      title: "Worked example: cross-entropy loss for one image",
      problem: "True label: 'dog'. The model's softmax output over (cat, dog, car) is q = (0.2, 0.7, 0.1). Compute the loss, then for a worse model q′ = (0.6, 0.3, 0.1).",
      steps: [
        { eq: String.raw`p=(0,1,0)\ \Rightarrow\ H(p,q)=-\log q_{\text{dog}}`, note: "one-hot label" },
        { eq: String.raw`-\ln 0.7\approx0.357\ \text{nats}`, note: "good model" },
        { eq: String.raw`-\ln 0.3\approx1.204\ \text{nats}`, note: "worse model" },
        { eq: String.raw`-\ln 0.01\approx4.6,\quad -\ln 10^{-9}\approx20.7`, note: "confidently wrong" },
      ],
      answer: "The loss punishes ==confident mistakes== heavily; it is 0 only if q(dog) = 1",
      notes: "Highlight the asymmetry: being slightly unsure costs little, being confidently wrong costs a lot. This is why classifiers trained with cross-entropy are pushed toward calibrated probabilities, and why label smoothing, which replaces the one-hot target by 0.9 and spreads 0.1 over other classes, is used to prevent over-confidence.",
    });
    d.equation({
      title: "KL divergence: how different are two distributions?",
      eq: String.raw`D_{\mathrm{KL}}(p\,\|\,q)=\sum_x p(x)\log\frac{p(x)}{q(x)}=H(p,q)-H(p)\ \ge 0`,
      legend: [
        [String.raw`D_{\mathrm{KL}}=0`, "if and only if p = q"],
        [String.raw`D_{\mathrm{KL}}(p\|q)\neq D_{\mathrm{KL}}(q\|p)`, "not symmetric: not a true distance"],
        [String.raw`q(x)=0,\ p(x)>0`, "KL = ∞: q must cover everything p can do"],
        [String.raw`\min_q H(p,q)`, "same as min KL, since H(p) is fixed by the data"],
      ],
      foot: "Training with cross-entropy = ==minimising KL from the data distribution to the model==.",
      eqSize: 30,
      notes: "Rearranging the equation of the day: KL is the extra cost beyond the unavoidable entropy of the data. Since the data entropy does not depend on the model, minimising cross-entropy and minimising KL give the same model. KL is always non-negative, a result known as Gibbs' inequality, which follows from Jensen's inequality.",
    });
    const bar = html(
      `<div style="width:1080px;font-size:20px;color:${P.navy}">
        <div style="display:flex;align-items:center;margin-bottom:22px"><div style="width:240px;font-weight:700">Entropy H(p)</div><div style="width:480px;height:56px;background:${P.green};border-radius:10px;color:white;display:flex;align-items:center;justify-content:center">unavoidable uncertainty of the data</div></div>
        <div style="display:flex;align-items:center;margin-bottom:22px"><div style="width:240px;font-weight:700">Cross-entropy H(p,q)</div><div style="width:480px;height:56px;background:${P.green};border-radius:10px 0 0 10px;color:white;display:flex;align-items:center;justify-content:center">H(p)</div><div style="width:300px;height:56px;background:${P.coral};border-radius:0 10px 10px 0;color:white;display:flex;align-items:center;justify-content:center">+ KL(p ‖ q): the model's fault</div></div>
        <div style="display:flex;align-items:center"><div style="width:240px;font-weight:700">After training</div><div style="width:480px;height:56px;background:${P.green};border-radius:10px 0 0 10px;color:white;display:flex;align-items:center;justify-content:center">H(p)</div><div style="width:60px;height:56px;background:${P.coral};border-radius:0 10px 10px 0"></div><div style="margin-left:16px;color:${P.muted}">KL shrinks; H(p) is the floor</div></div>
      </div>`,
      { w: 11.25 }
    );
    d.diagram({
      title: "Cross-entropy = entropy + KL: what training can and cannot reduce",
      diag: bar,
      chips: [
        ["The floor", "A validation loss cannot go below the data's own entropy (noise, ambiguity)."],
        ["The gap", "Everything above the floor is KL: room for a better model."],
        ["Scaling laws", "LLM loss curves flatten toward an irreducible term: the entropy of text (Day 15)."],
      ],
      notes: "This picture helps students interpret loss curves. A loss of 2.0 nats per token does not mean the model is bad; part of it is the irreducible entropy of language, since many next words are genuinely plausible. Scaling-law papers such as Chinchilla fit loss as an irreducible constant plus terms that shrink with model size and data, exactly this decomposition.",
    });
    d.figure({
      title: "Forward vs reverse KL: covering vs choosing",
      fig: F("d09_kl"),
      wide: true,
      caption: "Fitting a single Gaussian q to a two-peaked p. Forward KL(p‖q) punishes q for missing any mass, so q spreads over both peaks. Reverse KL(q‖p) punishes q for putting mass where p has none, so q locks onto one peak.",
      notes: "The asymmetry has practical consequences. Maximum likelihood minimises forward KL, which is mass-covering: models trained this way spread probability over all plausible outputs, sometimes producing blurry averages. Variational inference in VAEs minimises reverse KL, which is mode-seeking. RLHF penalises the reverse KL between the fine-tuned policy and the reference model to stop it drifting too far.",
    });

    d.section("Softmax, temperature and perplexity");
    d.concept({
      title: "Softmax: turning logits into a distribution",
      intuition: [
        "A network outputs raw scores (**logits**) z ∈ ℝᴷ, any real numbers",
        "exp makes them positive; dividing by the sum makes them **add to 1**",
        "Adding a constant to all logits changes nothing: use this for **stability**",
        "Temperature T rescales logits: ==T < 1 sharper, T > 1 flatter==",
      ],
      def: String.raw`\begin{aligned}\mathrm{softmax}(\mathbf{z})_i&=\frac{e^{z_i/T}}{\sum_{j}e^{z_j/T}}\\[4pt]\log\textstyle\sum_j e^{z_j}&=m+\log\textstyle\sum_j e^{z_j-m},\ \ m=\max_j z_j\end{aligned}`,
      defNote: "The second line is the **log-sum-exp trick**: subtract the max before exponentiating so e^(1000) never overflows.",
      notes: "Without the trick, a logit of 1000 overflows float32 to infinity and the softmax becomes NaN. Subtracting the maximum makes the largest exponent e to the 0 = 1, perfectly safe, and the result is mathematically identical. Every framework implements softmax and cross-entropy this way. This is the second numerical-methods lesson after Day 1's log-probabilities.",
    });
    d.figure({
      title: "Temperature: the creativity knob of a language model",
      fig: F("d09_temp"),
      wide: true,
      caption: "Logits (2.0, 1.0, 0.5, −1.0) for the next word after 'The capital of France is'. Low T makes the top choice dominant; high T spreads probability, increasing diversity and the risk of errors.",
      notes: "Same logits, three temperatures. At T = 0.5 Paris gets 84 percent; at T = 2 it falls to 43 percent and Rome becomes plausible. Temperature 0 is greedy decoding, always the top token. Temperature also appears in knowledge distillation, where a high temperature reveals the teacher's dark knowledge about similar classes, and in contrastive losses like CLIP's InfoNCE.",
    });
    d.example({
      title: "Worked example: a stable softmax and its perplexity",
      problem: "Logits z = (1000, 999, 997). Compute the softmax safely. Then: a language model assigns the true tokens of a 4-token text probabilities 0.5, 0.25, 0.5, 0.125. Find its perplexity.",
      steps: [
        { eq: String.raw`\mathbf{z}-\max\mathbf{z}=(0,-1,-3)`, note: "shift by m = 1000" },
        { eq: String.raw`e^{(0,-1,-3)}=(1,\,0.368,\,0.050)\Rightarrow\mathbf{p}=(0.705,\,0.259,\,0.035)`, note: "normalise" },
        { eq: String.raw`\bar\ell=-\tfrac14(\ln0.5+\ln0.25+\ln0.5+\ln0.125)=\ln 2^{7/4}`, note: "mean NLL per token" },
        { eq: String.raw`\mathrm{PPL}=e^{\bar\ell}=2^{7/4}\approx3.36`, note: "perplexity" },
      ],
      answer: "Perplexity 3.4: on average the model is as unsure as ==choosing among ≈ 3.4 equally likely tokens==",
      notes: "Perplexity is the exponential of the average cross-entropy per token. Interpretation: an effective branching factor. A perfect model has perplexity 1; a uniform guess over a 50,000-token vocabulary has perplexity 50,000. Modern LLMs reach single-digit perplexities on typical web text. Compare perplexities only between models with the same tokenizer.",
    });
    d.concept({
      title: "Mutual information: how much does X tell us about Y?",
      intuition: [
        "Uncertainty about Y **before** seeing X minus uncertainty **after**",
        "I(X; Y) = 0 exactly when X and Y are **independent**",
        "Symmetric, unlike KL: X tells as much about Y as Y about X",
        "Contrastive learning (CLIP, SimCLR) maximises a ==lower bound on mutual information== between two views",
      ],
      def: String.raw`\begin{aligned}I(X;Y)&=H(Y)-H(Y\mid X)\\&=D_{\mathrm{KL}}\big(p(x,y)\,\|\,p(x)p(y)\big)\ \ge 0\end{aligned}`,
      defNote: "Decision trees choose splits by **information gain**, which is mutual information between a feature and the label.",
      notes: "Mutual information measures any kind of dependence, not just linear correlation. The KL form says: how far is the joint distribution from what it would be if X and Y were independent. It is hard to estimate in high dimensions, so research uses bounds such as InfoNCE, the loss behind CLIP, which treats matching image-text pairs as positives and all other pairs in the batch as negatives.",
    });
    d.code({
      title: "Information theory in PyTorch",
      code: `import torch, torch.nn.functional as F

logits = torch.tensor([[2.0, 1.0, 0.1]])   # (batch, classes)
target = torch.tensor([0])

# cross-entropy takes LOGITS (softmax+log inside, stable)
loss = F.cross_entropy(logits, target)     # 0.417

p = F.softmax(logits, dim=-1)
entropy = -(p * p.log()).sum(-1)           # in nats

# stable log-softmax uses log-sum-exp
logp = logits - torch.logsumexp(logits, -1, keepdim=True)

# KL(p || q): note the argument order in PyTorch!
q_log = F.log_softmax(torch.tensor([[1., 1., 1.]]), -1)
kl = F.kl_div(q_log, p, reduction="batchmean")  # KL(p||q)

# perplexity of a language model on a batch
token_nll = torch.tensor([0.69, 1.39, 0.69, 2.08])
ppl = token_nll.mean().exp()               # ~3.36

# temperature sampling
probs = F.softmax(logits / 0.7, dim=-1)
torch.multinomial(probs, num_samples=1)`,
      points: [
        "Pass **logits**, not probabilities, to cross_entropy",
        "kl_div expects **log q** first and p second: a classic source of bugs",
        "Perplexity = exp(mean token NLL)",
        "Dividing logits by T before softmax implements ==temperature==",
      ],
      fontSize: 11.5,
      notes: "Two bugs worth warning about. First, applying softmax before cross_entropy double-applies it and silently hurts training. Second, kl_div's argument order is the reverse of the math notation. Always test such code on a tiny example where you know the answer.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathcal{L}_{\text{KD}}=T^2\,D_{\mathrm{KL}}\big(\mathrm{softmax}(\mathbf{z}_t/T)\,\|\,\mathrm{softmax}(\mathbf{z}_s/T)\big)`, read: "**Distillation**: the student matches the teacher's softened output distribution.", src: "Hinton et al. 2015" },
        { eq: String.raw`\max_\pi\ \mathbb{E}[r(x,y)]-\beta\,D_{\mathrm{KL}}\big(\pi(\cdot|x)\,\|\,\pi_{\text{ref}}(\cdot|x)\big)`, read: "**RLHF**: maximise reward but stay close (in KL) to the original model.", src: "InstructGPT 2022" },
        { eq: String.raw`\mathcal{L}=-\log\frac{e^{\mathrm{sim}(\mathbf{u}_i,\mathbf{v}_i)/\tau}}{\sum_j e^{\mathrm{sim}(\mathbf{u}_i,\mathbf{v}_j)/\tau}}`, read: "**InfoNCE / CLIP**: cross-entropy where the correct 'class' is the matching pair in the batch." },
        { eq: String.raw`\mathrm{PPL}=\exp\Big(-\tfrac1T\sum_{t=1}^{T}\log p_\theta(w_t\mid w_{<t})\Big)`, read: "**Perplexity**: exponentiated average token cross-entropy." },
      ],
      notes: "Each formula now reads as a combination of today's pieces. The T squared factor in distillation keeps gradient magnitudes comparable across temperatures. The RLHF objective returns on Day 14. InfoNCE combines cosine similarity from Day 2, temperature from today and cross-entropy.",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "Compute the entropy in bits of a fair 8-sided die and of p = (0.9, 0.1)." },
        { lvl: "Warm-up", text: "True class 2 of 3; model outputs q = (0.1, 0.6, 0.3). Compute the cross-entropy loss in nats." },
        { lvl: "Core", text: "For p = (0.5, 0.5) and q = (0.9, 0.1), compute KL(p‖q) and KL(q‖p). Comment on the asymmetry." },
        { lvl: "Core", text: "Show that softmax(z + c) = softmax(z) for any constant c. Why does this make the log-sum-exp trick valid?" },
        { lvl: "Code", text: "Compute the perplexity of GPT-2 (Hugging Face) on a paragraph of English and on the same words shuffled. Explain the difference." },
        { lvl: "Challenge", text: "Prove KL(p‖q) ≥ 0 using Jensen's inequality, 𝔼[log X] ≤ log 𝔼[X]." },
      ],
      notes: "Answers: 1) 3 bits; 0.469 bits. 2) minus ln 0.6 = 0.511. 3) KL(p||q) = 0.5 ln(0.5/0.9) + 0.5 ln(0.5/0.1) = 0.511 nats; KL(q||p) = 0.9 ln 1.8 + 0.1 ln 0.2 = 0.368 nats. 4) e to the c cancels in numerator and denominator. 5) shuffled text has much higher perplexity because word order carries information. 6) minus KL = expectation of log(q/p) under p, at most log of the sum of q = log 1 = 0.",
    });
    d.recap({
      points: [
        "Surprise I(x) = −log p(x); **entropy** = average surprise = best compression",
        "**Cross-entropy** H(p, q) with one-hot p is −log q(y): the classification and LLM loss",
        "**KL**(p‖q) = H(p, q) − H(p) ≥ 0; asymmetric: forward covers, reverse chooses",
        "Stable **softmax** with log-sum-exp; ==temperature== trades accuracy for diversity",
        "**Perplexity** = exp(mean token NLL); mutual information measures dependence",
      ],
      next: "Optimization: how models actually learn",
      nextTopics: ["Convexity", "SGD, momentum, Adam", "Learning-rate schedules", "Regularisation and constraints"],
      notes: "We now have all the ingredients of a loss function. Tomorrow we study the algorithms that minimise it, from plain gradient descent to Adam, and the practical knobs of learning rate, batch size and schedules.",
    });
  },
};
