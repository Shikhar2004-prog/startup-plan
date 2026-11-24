// Day 15 — Research math: experiments, evaluation and writing
module.exports = {
  day: 15,
  short: "Research math and experiments",
  file: "Day-15-Research-Math-Experiments-and-Evaluation",
  build(d, { F, D, html }) {
    const P = D.P;
    d.section("Opening");
    d.title({
      title: "Research Math: Experiments and Evaluation",
      subtitle: "Metrics, ROC and PR curves, confidence intervals, significance tests, seeds, ablations, scaling laws, and how to write the math in your own paper",
      topics: ["Metrics", "ROC and PR", "Confidence intervals", "Paired tests", "Ablations", "Scaling laws", "Writing"],
      eq: String.raw`\bar x\ \pm\ t_{n-1}\,\frac{s}{\sqrt n}`,
      notes: "The last day turns from models to the scientific method. A new model is only a research result if we can measure it fairly, show the improvement is real and not noise, explain which part caused it, and write it so others can check it. All of this uses Day 7 and Day 8 statistics. By the end, students should be ready to start the capstone project.",
    });
    d.objectives({
      goals: [
        "Choose the right **metric**: precision, recall, F1, ROC-AUC, PR-AUC",
        "Report results with **confidence intervals** over seeds",
        "Decide whether an improvement is real with a **paired test** or the **bootstrap**",
        "Design **ablations** and read **scaling laws** on log–log axes",
        "Write paper math with **clean notation** and a **reproducibility** checklist",
      ],
      why: "Reviewers reject papers for ==single-seed results, missing baselines and undefined notation== far more often than for weak ideas. This day is the difference between a demo and a publishable result.",
      prereq: "Day 7 (probability), Day 8 (mean, variance, standard error, MLE), Day 9 (log scales), Days 11–14 (the models we evaluate).",
      notes: "Ask the class: you train a new model once and it beats the baseline by 0.4 points. Is it better? By the end of today they should answer: we cannot tell yet, and here is exactly how to find out.",
    });

    d.section("Measuring performance");
    const cm = html(
      D.row([
        D.grid({ vals: [[40, 10], [20, 930]], max: 120, fmt: (v) => ({ 40: "TP = 40", 10: "FN = 10", 20: "FP = 20", 930: "TN = 930" })[v], color: "teal", rowLabels: ["actual +", "actual −"], colLabels: ["predicted +", "predicted −"], title: "Confusion matrix, 1000 cases (5% positive)", cell: 150, fs: 22, hi: [[0, 0]] }),
        `<div style="font-size:30px;color:${P.navy};margin-left:50px;line-height:2.0">
          $\\text{accuracy}=\\frac{40+930}{1000}=0.97$<br>
          $\\text{precision}=\\frac{TP}{TP+FP}=\\frac{40}{60}=0.667$<br>
          $\\text{recall}=\\frac{TP}{TP+FN}=\\frac{40}{50}=0.80$<br>
          $F_1=\\frac{2PR}{P+R}=\\frac{2(0.667)(0.8)}{1.467}=0.727$
        </div>`,
      ], { gap: 10 }),
      { w: 12 }
    );
    d.diagram({
      title: "Worked example: the confusion matrix and its metrics",
      diag: cm,
      chips: [
        ["The trap", "A model that always says 'negative' scores 95% accuracy and finds no positives at all."],
        ["Precision", "Of the cases we flagged, how many were right? Matters when false alarms are costly."],
        ["Recall", "Of the real positives, how many did we find? Matters when misses are costly (disease, fraud)."],
      ],
      notes: "Fill in the matrix together, then compute each metric. Emphasise the base-rate trap: with 5 percent positives, accuracy is dominated by the true negatives. F1 is the harmonic mean, which is pulled towards the smaller of precision and recall. In medical or document-forgery detection papers, reviewers expect precision, recall and F1, not accuracy alone.",
    });
    d.figure({
      title: "Threshold-free evaluation: ROC and precision–recall curves",
      fig: F("d15_roc"), wide: true,
      points: [
        { icon: "chart", text: "ROC: true-positive rate vs false-positive rate as the threshold moves" },
        { icon: "dice", text: "AUC = ==P(score of a random positive > score of a random negative)==" },
        { icon: "filter", text: "With rare positives, **PR curves** show differences ROC hides; random PR = base rate" },
      ],
      notes: "Each point on a curve is one threshold, each with its own confusion matrix. The probabilistic meaning of AUC (equal to the Mann-Whitney U statistic) is the one to remember: 0.5 is random ranking, 1.0 is perfect ranking. On the right, with 10 percent positives, model A's advantage over B is much more visible; that is why imbalanced problems report PR-AUC or average precision.",
    });

    d.section("Is the improvement real?");
    d.equation({
      title: "Confidence intervals: report the mean and its uncertainty",
      eq: String.raw`\bar x=\frac1n\sum_{i=1}^n x_i,\qquad s^2=\frac{1}{n-1}\sum_{i=1}^n(x_i-\bar x)^2,\qquad \mathrm{CI}_{95\%}=\bar x\pm t_{n-1,\,0.975}\,\frac{s}{\sqrt n}`,
      legend: [
        [String.raw`x_i`, "the metric from run i (different random seed, same everything else)"],
        [String.raw`n-1`, "Bessel's correction: unbiased variance from a sample (Day 8)"],
        [String.raw`s/\sqrt n`, "standard error of the mean: shrinks like 1/√n"],
        [String.raw`t_{n-1}`, "Student-t quantile: 2.776 for n = 5, 2.262 for n = 10, → 1.96 for large n"],
      ],
      foot: "Seeds change initialisation, data order and dropout; a result that does not survive ==3–5 seeds== is not a result.",
      eqSize: 20,
      notes: "The t quantile replaces 1.96 because with few runs we also estimate the standard deviation, which adds uncertainty. Note the meaning of a 95 percent interval: if we repeated the whole experiment many times, 95 percent of such intervals would contain the true mean. It is not a 95 percent probability statement about this one interval in the frequentist view.",
    });
    d.example({
      title: "Worked example: a 95% confidence interval from 5 seeds",
      problem: "Five seeds of the same model give accuracy (%) 84.1, 84.5, 83.9, 84.6, 84.4.",
      problemEq: String.raw`\bar x\pm t_{4,0.975}\,\frac{s}{\sqrt5}`,
      steps: [
        { eq: String.raw`\bar x=\tfrac15(421.5)=84.30`, note: "mean" },
        { eq: String.raw`\textstyle\sum(x_i-\bar x)^2=0.04+0.04+0.16+0.09+0.01=0.34`, note: "squared deviations" },
        { eq: String.raw`s=\sqrt{0.34/4}=0.292,\quad s/\sqrt5=0.130`, note: "std and SE" },
        { eq: String.raw`2.776\times0.130=0.362`, note: "half-width" },
        { eq: String.raw`\mathrm{CI}_{95\%}=[83.94,\ 84.66]`, note: "report" },
      ],
      answer: "Write it as ==84.3 ± 0.4== (mean ± 95% CI, 5 seeds), and say which it is: std, SE or CI",
      notes: "Many papers write plus-minus without saying whether it is a standard deviation, a standard error or a confidence interval; these differ by factors of root n and t. Insist that students always state it in the caption.",
    });
    d.figure({
      title: "Seeds in practice: dots are runs, bars are 95% CIs",
      fig: F("d15_seeds"),
      points: [
        { icon: "eye", text: "**Always plot the individual runs**, not just the mean" },
        { icon: "warn", text: "Method X: +0.4 on average, but its CI ==overlaps== the baseline's: not convincing" },
        { icon: "check", text: "Method Y: +1.6, intervals well separated: a real improvement" },
        { icon: "random", text: "One lucky seed of X (85.0) would have looked like a win" },
      ],
      notes: "This is simulated data with a realistic seed spread. If you had run each method once, you might have picked the lucky X seed and claimed +1.1. Overlapping intervals do not prove there is no difference, and non-overlap is a conservative check; the paired test on the next slides is the proper tool.",
    });
    d.compare({
      title: "Three tools for deciding if a difference is real",
      cols: [
        { head: "Paired t-test", icon: "balance", eq: String.raw`t=\frac{\bar d}{s_d/\sqrt n}`, items: ["Pair runs that share a seed or data split", "d_i = new − baseline per pair", "Removes shared noise: far more powerful than unpaired"] },
        { head: "Bootstrap", icon: "random", eq: String.raw`\hat\theta^{*(b)}=\hat\theta\big(\text{resample}\big)`, items: ["Resample the **test set** with replacement, B = 1000 times", "Recompute the metric each time", "CI = 2.5th to 97.5th percentile; no normality needed"] },
        { head: "Many comparisons", icon: "filter", eq: String.raw`\alpha'=\alpha/m`, items: ["Testing m variants at α = 0.05: about 5% false wins **each**", "Bonferroni: use α/m", "Or report all results, including the losers"] },
      ],
      notes: "The bootstrap (Efron 1979) is the workhorse for metrics like F1, BLEU or AUC whose sampling distribution has no simple formula. A p-value is the probability, if there were truly no difference, of seeing a difference at least this large. It is not the probability that the method works. With 20 hyperparameter variants, one will look significant at 0.05 by chance.",
    });
    d.example({
      title: "Worked example: a paired t-test over 5 seeds",
      problem: "Same 5 seeds for baseline and new method. Per-seed improvements dᵢ = new − baseline: 0.6, 0.4, 0.8, 0.2, 0.5 points.",
      problemEq: String.raw`t=\frac{\bar d}{s_d/\sqrt n},\ \ \text{df}=n-1`,
      steps: [
        { eq: String.raw`\bar d=\tfrac15(2.5)=0.50`, note: "mean gain" },
        { eq: String.raw`\textstyle\sum(d_i-\bar d)^2=0.01+0.01+0.09+0.09+0=0.20`, note: "spread" },
        { eq: String.raw`s_d=\sqrt{0.20/4}=0.224,\quad s_d/\sqrt5=0.10`, note: "standard error" },
        { eq: String.raw`t=0.50/0.10=5.0,\quad \text{df}=4`, note: "test statistic" },
        { eq: String.raw`p\approx0.007\ (\text{two-sided})<0.05`, note: "decision" },
      ],
      answer: "Gain ==+0.50 ± 0.28== (95% CI), p ≈ 0.007: consistent across seeds, so the improvement is real",
      notes: "Half-width is 2.776 times 0.10 = 0.28. The key insight is pairing: the baseline and the new method each vary by around 0.3 between seeds, but the per-seed difference varies much less, because the shared seed affects both. An unpaired test on the same numbers would be much weaker.",
    });

    d.section("Designing experiments");
    d.table({
      title: "Ablations: remove one piece at a time",
      head: ["Variant", "Accuracy (%) mean ± 95% CI, 5 seeds", "Δ vs full", "What it tells you"],
      rows: [
        ["**Full model**", "**85.6 ± 0.2**", "—", "reference"],
        ["− component A (e.g. new loss term)", "84.9 ± 0.3", "−0.7", "A contributes most of the gain"],
        ["− component B (e.g. data augmentation)", "85.4 ± 0.3", "−0.2", "B helps a little; within noise? test it"],
        ["− A and − B (= baseline)", "83.9 ± 0.2", "−1.7", "the effects are roughly additive (0.7 + 0.2 < 1.7: some interaction)"],
        ["Baseline + more compute only", "84.1 ± 0.3", "−1.5", "the gain is not just from training longer"],
      ],
      colW: [3.4, 3.3, 1.3, 4.13],
      fontSize: 15,
      foot: "Rule: change ==one thing at a time==, same seeds, same compute budget, and include a 'more compute' control.",
      notes: "An ablation answers the question every reviewer asks: which part of your method is responsible? The interaction in row 4 is worth discussing: removing both costs more than the sum of removing each, so A and B help each other. The last row guards against the most common hidden confound: the new method simply trained for longer or had more parameters.",
    });
    d.figure({
      title: "Scaling laws: performance as a power law in compute",
      fig: F("d15_scaling"), wide: true,
      points: [
        { icon: "chart", text: "L(C) = E + A·C^(−α): an irreducible floor E plus a power-law term" },
        { icon: "ruler", text: "log(L − E) = log A − α·log C: a **straight line** on log–log axes, slope −α" },
        { icon: "rocket", text: "Fit on small runs, ==extrapolate== to decide what to train at scale" },
      ],
      notes: "Kaplan et al. 2020 and Hoffmann et al. 2022 (Chinchilla) fitted laws like this for loss versus parameters, data and compute. Taking logs turns the power law into a line, so alpha is just the slope from linear regression (Day 8). Chinchilla's finding: for a fixed compute budget, parameters and training tokens should grow together, about 20 tokens per parameter. The irreducible loss E is linked to the entropy of text from Day 9.",
    });

    d.section("Writing the math");
    d.table({
      title: "Writing math in your paper: conventions reviewers expect",
      head: ["Do", "Example", "Avoid"],
      rows: [
        ["Define **every symbol** at first use", "“Let x ∈ ℝᵈ be the input and y ∈ {1,…,K} its label.”", "symbols that appear without definition"],
        ["Scalars italic, **vectors bold**, matrices capital", "x, **x**, W, and 𝒟 for a dataset", "the same letter for two things"],
        ["Number the equations you refer to", "“Minimising Eq. (3) gives …”", "“the equation above”"],
        ["State shapes and assumptions", "“Q, K ∈ ℝⁿˣᵈ; we assume i.i.d. samples.”", "silent broadcasting"],
        ["Put the **objective** in one display line", "θ* = argmin_θ 𝔼[ℓ(f_θ(x), y)] + λ‖θ‖²", "a loss spread over a paragraph"],
        ["Report uncertainty and n", "“84.3 ± 0.4 (95% CI, 5 seeds)”", "single runs, unexplained ±"],
      ],
      colW: [3.6, 5.1, 3.43],
      fontSize: 16,
      notes: "Show students the notation section of a well-written paper, for example the Deep Learning book's notation page or the DDPM paper. A good test: a reader should be able to re-implement the method from the equations and the hyperparameter table alone. Encourage everyone to keep a personal notation.tex file with macros so notation stays consistent.",
    });
    d.rows({
      title: "Reproducibility checklist before you submit",
      cols: 2,
      rows: [
        ["code", "Code and configs", "Release code with the exact config for every table row; pin library versions."],
        ["random", "Seeds", "Fix and report seeds; run 3–5 per setting; report mean ± CI."],
        ["table", "Data", "Exact splits, preprocessing and any filtering; no test-set peeking during tuning."],
        ["cog", "Hyperparameters", "Full table, including those of baselines, and the search budget used for each."],
        ["bolt", "Compute", "GPU type, hours and parameter count, so others can judge the cost."],
        ["balance", "Fair baselines", "Same data, same budget, tuned as carefully as your own method."],
        ["search", "Ablations", "One change at a time, same seeds; include a 'more compute' control."],
        ["paper", "Claims", "Every claim in the abstract points to a table, figure or theorem."],
      ],
      notes: "Many conferences (NeurIPS, ICML, ACL) now require a checklist very like this. Treat it as part of the research, not paperwork: most failed reproductions come from undocumented preprocessing or untuned baselines, not from the main idea.",
    });
    d.rows({
      title: "Capstone: reproduce, then extend, one paper",
      rows: [
        ["book", "Week 1: read", "Pick a short paper from Days 11–14 (e.g. DDPM, DPO, ViT on a small dataset). Rewrite its key equations in your own notation."],
        ["flask", "Week 2: reproduce", "Implement it from the equations. Match one reported number within its CI, using 3 seeds."],
        ["bulb", "Week 3: extend", "Change one thing (a loss term, an initialisation, a schedule). Run a paired comparison and an ablation."],
        ["paper", "Week 4: write", "4-page report: notation, method, results with CIs, ablation table, reproducibility checklist."],
      ],
      notes: "The capstone turns 15 days of math into a research artefact. Encourage pairs. Each team presents their ablation table and confidence intervals in a final session. Good reports can be extended into workshop papers; this is the bridge to Leapverse's mentored research programme.",
    });

    d.section("Reading papers");
    d.paper({
      rows: [
        { eq: String.raw`\mathrm{AUC}=P\big(s(\mathbf{x}^+)>s(\mathbf{x}^-)\big)`, read: "AUC is a **ranking probability**, not an accuracy." },
        { eq: String.raw`84.3\pm0.4\ \ (\text{mean}\pm95\%\ \mathrm{CI},\ n=5)`, read: "Mean over **5 seeds** with a stated interval type." },
        { eq: String.raw`L(N,D)=E+\frac{A}{N^{\alpha}}+\frac{B}{D^{\beta}}`, read: "Loss vs **parameters N and tokens D**: a floor plus two power laws.", src: "Hoffmann et al. 2022" },
        { eq: String.raw`p<0.01\ \ (\text{paired }t\text{-test, }n=5)`, read: "Unlikely to be **seed noise**, with the test named." },
      ],
      notes: "Use this slide to practise reading results sections critically. For any table, ask: how many seeds, what is the plus-minus, is there a paired test, are the baselines tuned, and does the ablation isolate the claimed contribution?",
    });
    d.exercises({
      items: [
        { lvl: "Warm-up", text: "A classifier finds 30 of 60 positives and raises 90 alarms in total. Compute precision, recall and F1." },
        { lvl: "Warm-up", text: "Ten seeds give mean 72.0 and s = 0.8. Compute the 95% CI (t₉ = 2.262)." },
        { lvl: "Core", text: "Per-seed gains are (0.3, −0.1, 0.4, 0.2, 0.0). Run a paired t-test. Is the gain significant at 0.05?" },
        { lvl: "Core", text: "Loss follows L = 1.7 + 10·C^(−0.05). By what factor must compute grow to halve L − E?" },
        { lvl: "Code", text: "Write a bootstrap CI for F1 on a test set of 2000 examples (B = 1000). Compare its width with a 5-seed CI." },
        { lvl: "Research", text: "Pick a recent paper. Audit it with today's checklist: seeds, interval type, tests, ablations, notation. Write one page." },
      ],
      notes: "Answers: 1) precision 30/90 = 0.333, recall 30/60 = 0.5, F1 = 0.4. 2) 72.0 plus or minus 2.262 times 0.8/root 10 = 0.572, so [71.43, 72.57]. 3) mean 0.16, s = 0.207, SE = 0.093, t = 1.73 with df 4 (critical 2.776): not significant. 4) need C^(-0.05) to halve: C grows by 2^(1/0.05) = 2^20, about a million times. That is why scaling is expensive.",
    });
    d.recap({
      points: [
        "Pick metrics for the problem: **precision/recall/F1**, ROC-AUC, PR-AUC for rare positives",
        "Report ==mean ± 95% CI over seeds== and say which interval you used",
        "Decide with **paired tests** or the **bootstrap**; beware many comparisons",
        "Ablate one thing at a time; read **scaling laws** as lines on log–log axes",
        "Write math a reader can implement; ship a **reproducibility** checklist",
      ],
      next: "Your research journey",
      nextTopics: ["Capstone: reproduce and extend one paper", "Read one paper a week with the 'say it out loud' method", "Revisit Days 1–15 as a reference", "Write up and share your results"],
      notes: "Close the programme by returning to Day 1: the five building blocks of AI math (vectors, matrices, derivatives, probability, optimisation) have now carried us to transformers, diffusion, RLHF and research methodology. Congratulate the class and launch the capstone.",
    });
  },
};
