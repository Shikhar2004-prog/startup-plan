"""Plots for the Mathematics for AI decks, in Leapverse colours.

Run: python3 figures.py            (all figures)
     python3 figures.py d01 d02    (only figures whose name starts with these prefixes)
Writes fig/<name>.png at 200 dpi. build.js reads the pixel size to keep aspect ratios.
"""
import os
import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Ellipse

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fig")
os.makedirs(OUT, exist_ok=True)

NAVY, TEAL, GREEN, BLUE, GOLD = "#14254F", "#0F6E78", "#12A58A", "#1B7FC4", "#F2B32A"
MINT, CORAL, VIOLET, MUTED, GRID = "#7FE7C9", "#E0565F", "#6A5ACD", "#5A6475", "#E3E9F1"
CYCLE = [BLUE, CORAL, GREEN, VIOLET, GOLD, TEAL]

plt.rcParams.update({
    "font.family": ["Carlito", "DejaVu Sans"], "font.size": 15, "mathtext.fontset": "cm",
    "axes.edgecolor": MUTED, "axes.labelcolor": NAVY, "axes.titlecolor": NAVY, "axes.titleweight": "bold",
    "axes.titlesize": 16, "xtick.color": MUTED, "ytick.color": MUTED, "axes.grid": True, "grid.color": GRID,
    "axes.spines.top": False, "axes.spines.right": False, "axes.prop_cycle": matplotlib.cycler(color=CYCLE),
    "lines.linewidth": 3, "legend.frameon": False, "figure.facecolor": "white", "savefig.facecolor": "white",
})

REG = {}


def fig(name):
    def deco(f):
        REG[name] = f
        return f
    return deco


def save(f, name):
    f.savefig(os.path.join(OUT, name + ".png"), dpi=200, bbox_inches="tight", pad_inches=0.15)
    plt.close(f)


def arrow(ax, p, q, color=NAVY, lw=3, label=None, lpos=0.55, off=(0.1, 0.1), fs=18):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=22, lw=lw, color=color, shrinkA=0, shrinkB=0, zorder=5))
    if label:
        x = p[0] + (q[0] - p[0]) * lpos + off[0]
        y = p[1] + (q[1] - p[1]) * lpos + off[1]
        ax.text(x, y, label, color=color, fontsize=fs, zorder=6)


def plane(ax, lim=4, ticks=True):
    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_aspect("equal")
    ax.axhline(0, color=MUTED, lw=1.2, zorder=1); ax.axvline(0, color=MUTED, lw=1.2, zorder=1)
    if not ticks:
        ax.set_xticklabels([]); ax.set_yticklabels([])


# ------------------------------------------------------------------ Day 1
@fig("d01_functions")
def _():
    z = np.linspace(-4, 4, 400)
    fs = [
        ("Linear  $f(x)=2x+1$", 2 * z + 1, BLUE),
        ("Quadratic  $f(x)=x^2$", z ** 2, VIOLET),
        ("Exponential  $e^x$", np.exp(z), CORAL),
        ("Logarithm  $\\ln x$", None, GREEN),
        ("Sigmoid  $\\sigma(x)$", 1 / (1 + np.exp(-z)), TEAL),
        ("ReLU  $\\max(0,x)$", np.maximum(0, z), GOLD),
    ]
    f, axs = plt.subplots(2, 3, figsize=(12, 6.6))
    for ax, (t, y, c) in zip(axs.flat, fs):
        if y is None:
            x = np.linspace(0.02, 4, 300); ax.plot(x, np.log(x), color=c)
        else:
            ax.plot(z, y, color=c)
        ax.set_title(t, fontsize=17)
        ax.axhline(0, color=MUTED, lw=1); ax.axvline(0, color=MUTED, lw=1)
    axs[0, 2].set_ylim(-0.5, 8); axs[0, 0].set_ylim(-8, 9); axs[0, 1].set_ylim(-0.5, 10)
    f.tight_layout(h_pad=2)
    return f


@fig("d01_logscale")
def _():
    n = np.arange(1, 201)
    p = 0.9 ** n
    f, (a, b) = plt.subplots(1, 2, figsize=(11, 4.6))
    a.plot(n, p, color=CORAL); a.set_title("Product of probabilities  $0.9^n$"); a.set_xlabel("number of tokens $n$")
    b.plot(n, np.log(p), color=GREEN); b.set_title("Log of the product  $n\\,\\ln 0.9$"); b.set_xlabel("number of tokens $n$")
    a.annotate("vanishes to ~0\n(underflow)", xy=(150, 0.9 ** 150), xytext=(80, 0.45), color=NAVY, fontsize=14, arrowprops=dict(arrowstyle="->", color=NAVY))
    b.annotate("a clean straight line", xy=(120, 120 * np.log(0.9)), xytext=(20, -18), color=NAVY, fontsize=14, arrowprops=dict(arrowstyle="->", color=NAVY))
    f.tight_layout()
    return f



# ------------------------------------------------------------------ Day 2
@fig("d02_vectors")
def _():
    f, (a, b, c) = plt.subplots(1, 3, figsize=(13, 4.6))
    for ax in (a, b, c):
        plane(ax, 4.5)
        ax.set_xticks(range(-4, 5, 2)); ax.set_yticks(range(-4, 5, 2))
    arrow(a, (0, 0), (3, 2), BLUE, label=r"$\mathbf{v}=(3,2)$", off=(-1.6, 0.6))
    a.plot([3, 3], [0, 2], ls="--", color=MUTED, lw=1.5); a.plot([0, 3], [2, 2], ls="--", color=MUTED, lw=1.5)
    a.set_title("A vector: an arrow and a list")
    u, v = np.array([3, 1]), np.array([1, 2.5])
    arrow(b, (0, 0), tuple(u), BLUE, label=r"$\mathbf{u}$", off=(0, -0.7))
    arrow(b, tuple(u), tuple(u + v), CORAL, label=r"$\mathbf{v}$", off=(0.2, 0))
    arrow(b, (0, 0), tuple(u + v), GREEN, label=r"$\mathbf{u}+\mathbf{v}$", lpos=0.5, off=(-2.6, 0.2))
    b.set_title("Addition: tip to tail")
    w = np.array([1.5, 1])
    arrow(c, (0, 0), tuple(2 * w), VIOLET, label=r"$2\mathbf{w}$", off=(0.2, -0.4))
    arrow(c, (0, 0), tuple(w), BLUE, lw=4, label=r"$\mathbf{w}$", off=(-0.9, 0.2))
    arrow(c, (0, 0), tuple(-1 * w), CORAL, label=r"$-\mathbf{w}$", off=(-0.6, -0.9))
    c.set_title("Scaling: stretch or flip")
    f.tight_layout()
    return f


@fig("d02_dot")
def _():
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 5))
    for ax in (a, b):
        plane(ax, 4); ax.set_xlim(-1, 4.5); ax.set_ylim(-1, 4)
    u = np.array([3.5, 1]); vs = [(np.array([1.2, 3]), GREEN, r"$\theta<90^\circ$: $\mathbf{u}\cdot\mathbf{v}>0$")]
    arrow(a, (0, 0), tuple(u), BLUE, label=r"$\mathbf{u}$", off=(0, -0.5))
    arrow(a, (0, 0), (1.2, 3), GREEN, label=r"$\mathbf{v}$", off=(-0.5, 0))
    ang = np.linspace(np.arctan2(1, 3.5), np.arctan2(3, 1.2), 40)
    a.plot(0.9 * np.cos(ang), 0.9 * np.sin(ang), color=NAVY, lw=2); a.text(0.95, 0.75, r"$\theta$", fontsize=20, color=NAVY)
    a.set_title(r"$\mathbf{u}\cdot\mathbf{v}=\|\mathbf{u}\|\,\|\mathbf{v}\|\cos\theta$")
    # projection
    v = np.array([1.5, 3.0]); uh = u / np.linalg.norm(u); proj = (v @ uh) * uh
    arrow(b, (0, 0), tuple(u), BLUE, label=r"$\mathbf{u}$", off=(0.1, -0.5))
    arrow(b, (0, 0), tuple(v), GREEN, label=r"$\mathbf{v}$", off=(-0.55, 0))
    arrow(b, (0, 0), tuple(proj), CORAL, lw=5, label=r"$\mathrm{proj}_{\mathbf{u}}\mathbf{v}$", lpos=0.3, off=(0.1, -0.75))
    b.plot([v[0], proj[0]], [v[1], proj[1]], ls="--", color=MUTED, lw=2)
    b.set_title("Projection: the shadow of v on u")
    f.tight_layout()
    return f


@fig("d02_norms")
def _():
    f, ax = plt.subplots(figsize=(6.2, 6))
    t = np.linspace(0, 2 * np.pi, 400)
    ax.plot(np.cos(t), np.sin(t), color=BLUE, label=r"$L_2$: $\sqrt{x_1^2+x_2^2}=1$")
    ax.plot([1, 0, -1, 0, 1], [0, 1, 0, -1, 0], color=CORAL, label=r"$L_1$: $|x_1|+|x_2|=1$")
    ax.plot([1, 1, -1, -1, 1], [1, -1, -1, 1, 1], color=GREEN, label=r"$L_\infty$: $\max|x_i|=1$")
    plane(ax, 1.6)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.06), ncol=1, fontsize=15)
    ax.set_title("All vectors of length 1, under three norms")
    return f


@fig("d02_embed")
def _():
    words = {"king": (3.0, 3.2), "queen": (3.4, 1.4), "man": (0.8, 2.6), "woman": (1.2, 0.8),
             "Paris": (-2.6, 2.6), "France": (-3.2, 0.9), "Delhi": (-1.2, 3.1), "India": (-1.8, 1.4),
             "cat": (1.6, -2.4), "dog": (2.3, -2.0), "puppy": (2.9, -2.8), "kitten": (2.2, -3.2)}
    f, ax = plt.subplots(figsize=(8, 6))
    cols = {"king": BLUE, "queen": BLUE, "man": BLUE, "woman": BLUE, "Paris": GREEN, "France": GREEN, "Delhi": GREEN, "India": GREEN}
    for w, (x, y) in words.items():
        ax.scatter(x, y, s=90, color=cols.get(w, CORAL), zorder=5)
        ax.text(x + 0.12, y + 0.12, w, fontsize=16, color=NAVY)
    for a_, b_ in [("man", "woman"), ("king", "queen")]:
        arrow(ax, words[a_], words[b_], VIOLET, lw=2.2)
    for a_, b_ in [("France", "Paris"), ("India", "Delhi")]:
        arrow(ax, words[a_], words[b_], GOLD, lw=2.2)
    ax.set_xlim(-4, 4.3); ax.set_ylim(-3.8, 4); ax.set_xticklabels([]); ax.set_yticklabels([])
    ax.set_title("Embeddings: meaning becomes direction (2-D sketch)")
    return f


# ------------------------------------------------------------------ Day 3
def grid_lines(ax, M, color, n=4, lw=1.3, alpha=1.0):
    for k in range(-n, n + 1):
        p = np.array([[k, -n], [k, n]]) @ M.T; ax.plot(p[:, 0], p[:, 1], color=color, lw=lw, alpha=alpha)
        p = np.array([[-n, k], [n, k]]) @ M.T; ax.plot(p[:, 0], p[:, 1], color=color, lw=lw, alpha=alpha)


@fig("d03_transform")
def _():
    mats = [("Scale  $\\begin{bmatrix}2&0\\\\0&0.5\\end{bmatrix}$", np.array([[2, 0], [0, 0.5]])),
            ("Rotate 30°", np.array([[np.cos(np.pi / 6), -np.sin(np.pi / 6)], [np.sin(np.pi / 6), np.cos(np.pi / 6)]])),
            ("Shear  $\\begin{bmatrix}1&1\\\\0&1\\end{bmatrix}$", np.array([[1, 1], [0, 1]])),
            ("Squash (rank 1)", np.array([[1, 1], [0.5, 0.5]]))]
    titles = ["Scale (2, 0.5)", "Rotate 30°", "Shear", "Collapse to a line (rank 1)"]
    f, axs = plt.subplots(1, 4, figsize=(15, 4.3))
    for ax, (t, M), tt in zip(axs, mats, titles):
        grid_lines(ax, np.eye(2), GRID, 3)
        grid_lines(ax, M, BLUE, 3, alpha=0.55)
        e1, e2 = M @ np.array([1, 0]), M @ np.array([0, 1])
        arrow(ax, (0, 0), tuple(e1), CORAL); arrow(ax, (0, 0), tuple(e2), GREEN)
        ax.set_xlim(-3, 3); ax.set_ylim(-3, 3); ax.set_aspect("equal"); ax.set_title(tt); ax.grid(False)
        ax.set_xticks([]); ax.set_yticks([])
    f.tight_layout()
    return f


@fig("d03_det")
def _():
    f, (a, b) = plt.subplots(1, 2, figsize=(10, 4.8))
    for ax in (a, b):
        ax.set_xlim(-0.5, 3.6); ax.set_ylim(-0.5, 3.1); ax.set_aspect("equal")
    a.add_patch(plt.Polygon([[0, 0], [1, 0], [1, 1], [0, 1]], color=BLUE, alpha=0.25))
    arrow(a, (0, 0), (1, 0), CORAL); arrow(a, (0, 0), (0, 1), GREEN)
    a.text(0.3, 0.42, "area 1", fontsize=17, color=NAVY); a.set_title("Unit square")
    M = np.array([[2, 1], [0.5, 2]])
    P = np.array([[0, 0], [1, 0], [1, 1], [0, 1]]) @ M.T
    b.add_patch(plt.Polygon(P, color=VIOLET, alpha=0.25))
    arrow(b, (0, 0), tuple(M[:, 0]), CORAL); arrow(b, (0, 0), tuple(M[:, 1]), GREEN)
    b.text(1.15, 1.15, "area 3.5", fontsize=17, color=NAVY)
    b.set_title(r"After $A$ = [[2, 1], [0.5, 2]]:  $\det A=3.5$")
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 4
@fig("d04_eigen")
def _():
    A = np.array([[2, 1], [1, 2]])
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 5.6))
    th = np.linspace(0, 2 * np.pi, 13)[:-1]
    V = np.stack([np.cos(th), np.sin(th)], 1)
    for ax, M, t in ((a, np.eye(2), "Before: unit vectors"), (b, A, r"After $A=\begin{bmatrix}2&1\\1&2\end{bmatrix}$".replace(r"\begin{bmatrix}2&1\\1&2\end{bmatrix}", "A")) ):
        plane(ax, 3.4)
        c = np.linspace(0, 2 * np.pi, 200); circ = np.stack([np.cos(c), np.sin(c)], 1) @ M.T
        ax.plot(circ[:, 0], circ[:, 1], color=GRID if M is np.eye(2) else MUTED, lw=1.5)
        for v in V:
            w = M @ v
            eig = abs(abs(v[0]) - abs(v[1])) < 1e-6
            ax.add_patch(FancyArrowPatch((0, 0), tuple(w), arrowstyle="-|>", mutation_scale=14, lw=2, color=CORAL if eig else "#9AA8BC"))
        ax.set_title(t)
    b.plot([-3.4, 3.4], [-3.4, 3.4], ls="--", color=CORAL, lw=1.2); b.plot([-3.4, 3.4], [3.4, -3.4], ls="--", color=CORAL, lw=1.2)
    b.text(1.9, 2.5, r"$\lambda=3$", fontsize=18, color=CORAL); b.text(0.9, -1.4, r"$\lambda=1$", fontsize=18, color=CORAL)
    b.set_title("After A: red arrows only stretch")
    f.tight_layout()
    return f


@fig("d04_svd")
def _():
    A = np.array([[2.0, 1.2], [0.4, 1.4]])
    U, S, Vt = np.linalg.svd(A)
    c = np.linspace(0, 2 * np.pi, 200); C = np.stack([np.cos(c), np.sin(c)])
    stages = [("$\\mathbf{x}$", np.eye(2)), ("$V^\\top\\mathbf{x}$  (rotate)", Vt), ("$\\Sigma V^\\top\\mathbf{x}$  (stretch)", np.diag(S) @ Vt), ("$U\\Sigma V^\\top\\mathbf{x}=A\\mathbf{x}$  (rotate)", A)]
    f, axs = plt.subplots(1, 4, figsize=(15, 4.4))
    for ax, (t, M) in zip(axs, stages):
        P = M @ C; e1 = M @ Vt.T[:, 0]; e2 = M @ Vt.T[:, 1]
        ax.fill(P[0], P[1], color=BLUE, alpha=0.15); ax.plot(P[0], P[1], color=BLUE, lw=2)
        arrow(ax, (0, 0), tuple(e1), CORAL); arrow(ax, (0, 0), tuple(e2), GREEN)
        ax.set_xlim(-2.8, 2.8); ax.set_ylim(-2.8, 2.8); ax.set_aspect("equal"); ax.set_title(t, fontsize=16)
        ax.set_xticks([]); ax.set_yticks([])
    f.tight_layout()
    return f


def _smiley(n=120):
    y, x = np.mgrid[0:n, 0:n] / n
    img = 0.15 + 0.6 * x * (1 - y)
    img += 0.8 * ((x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.16)
    img -= 0.9 * ((x - 0.37) ** 2 + (y - 0.38) ** 2 < 0.004) + 0.9 * ((x - 0.63) ** 2 + (y - 0.38) ** 2 < 0.004)
    img -= 0.8 * ((np.abs(((x - 0.5) ** 2 + (y - 0.52) ** 2) ** 0.5 - 0.2) < 0.02) & (y > 0.58))
    for k in range(6):
        img += 0.25 * (np.abs(x - 0.08 - 0.15 * k) < 0.02) * (y > 0.9)
    return np.clip(img, 0, 1.2)


@fig("d04_lowrank")
def _():
    M = _smiley()
    U, S, Vt = np.linalg.svd(M)
    f, axs = plt.subplots(1, 5, figsize=(15, 3.9), gridspec_kw={"width_ratios": [1, 1, 1, 1, 1.25]})
    for ax, k in zip(axs[:4], [1, 5, 15, 120]):
        ax.imshow(U[:, :k] @ np.diag(S[:k]) @ Vt[:k], cmap="cividis"); ax.set_xticks([]); ax.set_yticks([]); ax.grid(False)
        ax.set_title(f"rank {k}" + ("  (original)" if k == 120 else ""))
    axs[4].semilogy(S, color=VIOLET); axs[4].set_title("singular values $\\sigma_i$"); axs[4].set_xlabel("$i$")
    f.tight_layout()
    return f


@fig("d04_pca")
def _():
    rng = np.random.default_rng(3)
    X = rng.multivariate_normal([0, 0], [[3, 1.6], [1.6, 1.3]], 300)
    C = np.cov(X.T); w, V = np.linalg.eigh(C)
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 5.2), gridspec_kw={"width_ratios": [1.2, 1]})
    a.scatter(X[:, 0], X[:, 1], s=14, color=BLUE, alpha=0.5)
    for i, c, n in ((1, CORAL, "PC1"), (0, GREEN, "PC2")):
        v = V[:, i] * 2 * np.sqrt(w[i]); arrow(a, (0, 0), tuple(v), c, lw=4, label=n, off=(0.1, 0.15))
    a.set_aspect("equal"); a.set_xlim(-5.5, 5.5); a.set_ylim(-4, 4); a.set_title("Data cloud and its principal axes")
    Z = X @ V[:, 1]
    b.hist(Z, bins=30, color=CORAL, alpha=0.8); b.set_title(f"Projected onto PC1: keeps {100*w[1]/w.sum():.0f}% of variance")
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 5
@fig("d05_tangent")
def _():
    g = lambda x: 0.5 * x ** 2 - x + 1.5
    x = np.linspace(-1, 4, 300); x0 = 1.8
    f, ax = plt.subplots(figsize=(8.5, 5.4))
    ax.plot(x, g(x), color=BLUE, label="$f(x)$")
    for h, c in ((1.6, "#B9C7DA"), (0.9, "#8EA3C0"), (0.35, VIOLET)):
        m = (g(x0 + h) - g(x0)) / h; ax.plot(x, g(x0) + m * (x - x0), color=c, lw=1.8)
        ax.scatter([x0 + h], [g(x0 + h)], color=c, zorder=5, s=40)
    m = x0 - 1; ax.plot(x, g(x0) + m * (x - x0), color=CORAL, lw=3, label="tangent: slope $f'(x_0)$")
    ax.scatter([x0], [g(x0)], color=NAVY, zorder=6, s=70); ax.text(x0 - 0.2, g(x0) - 0.6, "$x_0$", fontsize=20)
    ax.set_ylim(-0.5, 5); ax.set_xlim(-1, 4); ax.legend(loc="upper left", fontsize=15)
    ax.set_title("Secant lines approach the tangent as $h\\to 0$")
    return f


@fig("d05_surface")
def _():
    from mpl_toolkits.mplot3d import Axes3D  # noqa
    f = plt.figure(figsize=(8, 6))
    ax = f.add_subplot(111, projection="3d")
    x, y = np.meshgrid(np.linspace(-2, 2, 60), np.linspace(-2, 2, 60))
    z = x ** 2 + 0.6 * y ** 2
    ax.plot_surface(x, y, z, cmap="viridis", alpha=0.75, linewidth=0)
    yy = np.linspace(-2, 2, 50); ax.plot(np.full_like(yy, 1.0), yy, 1 + 0.6 * yy ** 2, color=CORAL, lw=3.5, label=r"fix $x=1$: slice in $y$")
    xx = np.linspace(-2, 2, 50); ax.plot(xx, np.full_like(xx, -1.0), xx ** 2 + 0.6, color=GOLD, lw=3.5, label=r"fix $y=-1$: slice in $x$")
    ax.set_xlabel("$x$"); ax.set_ylabel("$y$"); ax.set_zlabel("$f$"); ax.legend(loc="upper left", fontsize=14)
    ax.view_init(28, -55); ax.set_title(r"$f(x,y)=x^2+0.6y^2$")
    return f


@fig("d05_gradient")
def _():
    f, ax = plt.subplots(figsize=(8, 6.2))
    x, y = np.meshgrid(np.linspace(-3, 3, 200), np.linspace(-3, 3, 200))
    z = x ** 2 + 2 * y ** 2
    cs = ax.contour(x, y, z, levels=12, cmap="viridis"); ax.clabel(cs, fontsize=10)
    gx, gy = np.meshgrid(np.linspace(-2.5, 2.5, 9), np.linspace(-2.5, 2.5, 9))
    ax.quiver(gx, gy, 2 * gx, 4 * gy, color=CORAL, alpha=0.8, width=0.004)
    p = np.array([2.0, 1.5]); path = [p.copy()]
    for _ in range(12):
        p = p - 0.12 * np.array([2 * p[0], 4 * p[1]]); path.append(p.copy())
    path = np.array(path); ax.plot(path[:, 0], path[:, 1], "o-", color=NAVY, ms=6, lw=2.5, label="steps along $-\\nabla f$")
    ax.set_aspect("equal"); ax.legend(loc="lower left", fontsize=15, frameon=True, facecolor="white", framealpha=0.95)
    ax.set_title(r"Gradient arrows point uphill; descent goes the other way")
    return f



# ------------------------------------------------------------------ Day 6
@fig("d06_taylor")
def _():
    f_ = lambda x: np.exp(np.sin(x))
    x = np.linspace(-1.5, 3.5, 400); a = 1.0
    fa = f_(a); d1 = np.cos(a) * fa; d2 = (np.cos(a) ** 2 - np.sin(a)) * fa
    f, ax = plt.subplots(figsize=(9, 5.4))
    ax.plot(x, f_(x), color=BLUE, lw=3.5, label="$f(x)$")
    ax.plot(x, fa + d1 * (x - a), color=CORAL, lw=2.5, ls="--", label="1st order: $f(a)+f'(a)(x-a)$")
    ax.plot(x, fa + d1 * (x - a) + 0.5 * d2 * (x - a) ** 2, color=GREEN, lw=2.5, label="2nd order: $+\\frac{1}{2}f''(a)(x-a)^2$")
    ax.scatter([a], [fa], color=NAVY, s=80, zorder=6); ax.text(a + 0.05, fa - 0.35, "$a$", fontsize=20)
    ax.set_ylim(0, 3.5); ax.legend(loc="upper right", fontsize=14, frameon=True, facecolor="white")
    ax.set_title("Taylor: a line, then a parabola, hugging the curve near $a$")
    return f


@fig("d06_critical")
def _():
    f = plt.figure(figsize=(13, 4.4))
    x, y = np.meshgrid(np.linspace(-2, 2, 60), np.linspace(-2, 2, 60))
    cases = [("Minimum: $H$ positive definite", x ** 2 + y ** 2, "viridis"), ("Maximum: $H$ negative definite", -(x ** 2 + y ** 2), "magma"), ("Saddle: $H$ has $\\lambda>0$ and $\\lambda<0$", x ** 2 - y ** 2, "coolwarm")]
    for i, (t, z, cm) in enumerate(cases):
        ax = f.add_subplot(1, 3, i + 1, projection="3d")
        ax.plot_surface(x, y, z, cmap=cm, alpha=0.85, linewidth=0)
        ax.scatter([0], [0], [0], color=NAVY, s=60)
        ax.set_title(t, fontsize=15); ax.set_xticks([]); ax.set_yticks([]); ax.set_zticks([])
        ax.view_init(28, -50)
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 7
@fig("d07_dists")
def _():
    from math import comb, factorial
    f, axs = plt.subplots(1, 4, figsize=(15, 4.0))
    axs[0].bar(["0", "1"], [0.3, 0.7], color=[MUTED, BLUE]); axs[0].set_title("Bernoulli($p=0.7$)")
    axs[1].bar(["cat", "dog", "car", "sky"], [0.55, 0.3, 0.1, 0.05], color=CYCLE[:4]); axs[1].set_title("Categorical (softmax output)")
    k = np.arange(0, 11); axs[2].bar(k, [comb(10, i) * 0.3 ** i * 0.7 ** (10 - i) for i in k], color=GREEN); axs[2].set_title("Binomial($n=10,p=0.3$)")
    x = np.linspace(-4, 6, 400)
    for m, sd, c in ((0, 1, BLUE), (2, 0.6, CORAL), (1, 2, VIOLET)):
        axs[3].plot(x, np.exp(-(x - m) ** 2 / (2 * sd * sd)) / (sd * np.sqrt(2 * np.pi)), color=c, label=f"$\\mu={m},\\sigma={sd}$")
    axs[3].legend(fontsize=12); axs[3].set_title("Gaussian $\\mathcal{N}(\\mu,\\sigma^2)$")
    f.tight_layout()
    return f


@fig("d07_joint")
def _():
    rng = np.random.default_rng(1)
    X = rng.multivariate_normal([0, 0], [[1, 0.7], [0.7, 1]], 4000)
    f = plt.figure(figsize=(7, 6.2))
    gs = f.add_gridspec(4, 4, hspace=0.05, wspace=0.05)
    ax = f.add_subplot(gs[1:, :3]); ax.hexbin(X[:, 0], X[:, 1], gridsize=30, cmap="Blues", mincnt=1)
    ax.axvline(1.0, color=CORAL, lw=2.5); ax.text(1.08, -3.2, "condition on $x=1$", color=CORAL, fontsize=14)
    ax.set_xlabel("$x$"); ax.set_ylabel("$y$"); ax.set_xlim(-3.5, 3.5); ax.set_ylim(-3.5, 3.5)
    ax2 = f.add_subplot(gs[0, :3], sharex=ax); ax2.hist(X[:, 0], 40, color=GREEN, alpha=0.8); ax2.set_title("joint $p(x,y)$ with marginals $p(x)$, $p(y)$"); ax2.axis("off")
    ax3 = f.add_subplot(gs[1:, 3], sharey=ax); ax3.hist(X[:, 1], 40, orientation="horizontal", color=VIOLET, alpha=0.8); ax3.axis("off")
    return f


# ------------------------------------------------------------------ Day 8
@fig("d08_gauss2d")
def _():
    f, axs = plt.subplots(1, 3, figsize=(13, 4.4))
    rng = np.random.default_rng(0)
    for ax, C, t in zip(axs, [[[1, 0], [0, 1]], [[2.5, 0], [0, 0.4]], [[1, 0.85], [0.85, 1]]], ["$\\Sigma=I$ (independent)", "diagonal, unequal variances", "correlated, $\\rho=0.85$"]):
        X = rng.multivariate_normal([0, 0], C, 600); ax.scatter(X[:, 0], X[:, 1], s=8, color=BLUE, alpha=0.4)
        w, V = np.linalg.eigh(C)
        for k in (1, 2):
            ang = np.degrees(np.arctan2(V[1, 1], V[0, 1]))
            ax.add_patch(Ellipse((0, 0), 2 * k * np.sqrt(w[1]), 2 * k * np.sqrt(w[0]), angle=ang, fill=False, color=CORAL, lw=2))
        ax.set_xlim(-4.5, 4.5); ax.set_ylim(-4.5, 4.5); ax.set_aspect("equal"); ax.set_title(t)
    f.tight_layout()
    return f


@fig("d08_clt")
def _():
    rng = np.random.default_rng(2)
    f, axs = plt.subplots(1, 4, figsize=(15, 3.9))
    for ax, n in zip(axs, [1, 2, 5, 30]):
        m = rng.exponential(1.0, (20000, n)).mean(1)
        ax.hist(m, bins=60, density=True, color=GREEN, alpha=0.75)
        x = np.linspace(0, 4, 300); sd = 1 / np.sqrt(n)
        if n >= 5: ax.plot(x, np.exp(-(x - 1) ** 2 / (2 * sd * sd)) / (sd * np.sqrt(2 * np.pi)), color=CORAL, lw=2.5)
        ax.set_xlim(0, 4); ax.set_title(f"mean of $n={n}$ samples")
    f.tight_layout()
    return f


@fig("d08_mle")
def _():
    p = np.linspace(0.001, 0.999, 400); k, n = 7, 10
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 4.6))
    L = p ** k * (1 - p) ** (n - k)
    a.plot(p, L, color=BLUE); a.axvline(0.7, color=CORAL, ls="--", lw=2); a.set_title("Likelihood $L(p)=p^7(1-p)^3$"); a.set_xlabel("$p$")
    a.text(0.4, L.max() * 0.9, "$\\hat p=0.7$", color=CORAL, fontsize=18)
    b.plot(p, np.log(L), color=GREEN); b.axvline(0.7, color=CORAL, ls="--", lw=2); b.set_ylim(-20, 0); b.set_title("Log-likelihood: same peak, easier math"); b.set_xlabel("$p$")
    f.tight_layout()
    return f


@fig("d08_biasvar")
def _():
    rng = np.random.default_rng(4)
    x = np.sort(rng.uniform(0, 1, 15)); y = np.sin(2 * np.pi * x) + rng.normal(0, 0.25, 15)
    xs = np.linspace(0, 1, 300)
    f, axs = plt.subplots(1, 3, figsize=(14, 4.2))
    for ax, deg, t in zip(axs, [1, 4, 14], ["Underfit (degree 1): high bias", "Just right (degree 4)", "Overfit (degree 14): high variance"]):
        c = np.polyfit(x, y, deg); ax.plot(xs, np.sin(2 * np.pi * xs), color=MUTED, lw=1.5, ls="--")
        ax.plot(xs, np.polyval(c, xs), color=CORAL if deg != 4 else GREEN); ax.scatter(x, y, color=BLUE, zorder=5)
        ax.set_ylim(-1.8, 1.8); ax.set_title(t, fontsize=15)
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 9
@fig("d09_entropy")
def _():
    p = np.linspace(0.001, 0.999, 400); H = -p * np.log2(p) - (1 - p) * np.log2(1 - p)
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 4.6), gridspec_kw={"width_ratios": [1, 1.2]})
    a.plot(p, H, color=VIOLET); a.set_xlabel("$p$ = P(heads)"); a.set_title("Entropy of a coin $H(p)$ in bits")
    a.annotate("max surprise: 1 bit\nat a fair coin", xy=(0.5, 1), xytext=(0.55, 0.45), fontsize=14, color=NAVY, arrowprops=dict(arrowstyle="->", color=NAVY))
    dists = {"peaked": [0.94, 0.02, 0.02, 0.02], "medium": [0.5, 0.3, 0.15, 0.05], "uniform": [0.25] * 4}
    xs = np.arange(4); w = 0.26
    for i, (k, v) in enumerate(dists.items()):
        v = np.array(v); h = -(v * np.log2(v)).sum()
        b.bar(xs + (i - 1) * w, v, w, color=[CORAL, GOLD, GREEN][i], label=f"{k}: H = {h:.2f} bits")
    b.set_xticks(xs); b.set_xticklabels(["A", "B", "C", "D"]); b.legend(fontsize=13); b.set_title("Flatter distribution = higher entropy")
    f.tight_layout()
    return f


@fig("d09_kl")
def _():
    x = np.linspace(-6, 8, 600)
    N = lambda m, s: np.exp(-(x - m) ** 2 / (2 * s * s)) / (s * np.sqrt(2 * np.pi))
    p = 0.5 * N(-1.5, 0.8) + 0.5 * N(2.5, 0.8)
    f, axs = plt.subplots(1, 2, figsize=(13, 4.4))
    axs[0].fill_between(x, p, color=BLUE, alpha=0.25); axs[0].plot(x, p, color=BLUE, label="data $p$")
    axs[0].plot(x, N(0.5, 2.2), color=CORAL, label="$q$ fitted by forward KL$(p\\|q)$"); axs[0].set_title("Forward KL: mean-seeking, covers both modes"); axs[0].legend(fontsize=13)
    axs[1].fill_between(x, p, color=BLUE, alpha=0.25); axs[1].plot(x, p, color=BLUE, label="data $p$")
    axs[1].plot(x, 0.5 * N(2.5, 0.8) * 2, color=GREEN, label="$q$ fitted by reverse KL$(q\\|p)$"); axs[1].set_title("Reverse KL: mode-seeking, picks one mode"); axs[1].legend(fontsize=13)
    f.tight_layout()
    return f


@fig("d09_temp")
def _():
    z = np.array([2.0, 1.0, 0.5, -1.0]); labels = ["Paris", "Lyon", "Nice", "Rome"]
    f, axs = plt.subplots(1, 3, figsize=(13, 3.9), sharey=True)
    for ax, T, c in zip(axs, [0.5, 1.0, 2.0], [CORAL, BLUE, GREEN]):
        p = np.exp(z / T); p /= p.sum(); ax.bar(labels, p, color=c)
        for i, v in enumerate(p): ax.text(i, v + 0.02, f"{v:.2f}", ha="center", fontsize=13, color=NAVY)
        ax.set_title(f"temperature $T={T}$"); ax.set_ylim(0, 1)
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 10
@fig("d10_convex")
def _():
    x = np.linspace(-2.5, 2.5, 400)
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 4.4))
    a.plot(x, x ** 2 + 0.3, color=GREEN); a.plot([-2, 1.5], [4.3, 2.55], color=CORAL, lw=2, ls="--"); a.scatter([-2, 1.5], [4.3, 2.55], color=CORAL, zorder=5)
    a.set_title("Convex: chord stays above, one global minimum")
    y = 0.15 * x ** 4 - 0.8 * x ** 2 + 0.25 * x + 1.5
    b.plot(x, y, color=CORAL); i1 = np.argmin(np.where(x < 0, y, 9)); i2 = np.argmin(np.where(x > 0, y, 9))
    b.scatter([x[i1]], [y[i1]], color=GREEN, s=80, zorder=5); b.text(x[i1] - 0.5, y[i1] + 0.3, "global min", fontsize=14, color=GREEN)
    b.scatter([x[i2]], [y[i2]], color=GOLD, s=80, zorder=5); b.text(x[i2] - 0.4, y[i2] + 0.3, "local min", fontsize=14, color=NAVY)
    b.set_title("Non-convex (neural nets): many valleys")
    f.tight_layout()
    return f


@fig("d10_lr")
def _():
    g = lambda x: x ** 2; dg = lambda x: 2 * x
    x = np.linspace(-3.2, 3.2, 300)
    f, axs = plt.subplots(1, 3, figsize=(14, 4.2))
    for ax, eta, t in zip(axs, [0.05, 0.3, 1.02], ["$\\eta=0.05$: too slow", "$\\eta=0.3$: just right", "$\\eta=1.02$: diverges"]):
        ax.plot(x, g(x), color=MUTED, lw=2)
        p = 2.8; pts = [p]
        for _ in range(8): p = p - eta * dg(p); pts.append(p)
        pts = np.array(pts); pts = pts[np.abs(pts) < 3.3]
        ax.plot(pts, g(pts), "o-", color=[BLUE, GREEN, CORAL][[0.05, 0.3, 1.02].index(eta)], ms=8, lw=2)
        ax.set_title(t); ax.set_ylim(-0.5, 11)
    f.tight_layout()
    return f


@fig("d10_optim")
def _():
    A = np.array([1.0, 12.0])
    loss = lambda p: 0.5 * (A * p ** 2).sum(); grad = lambda p: A * p
    def run(kind, steps=60):
        p = np.array([-4.0, 1.6]); v = np.zeros(2); m = np.zeros(2); s = np.zeros(2); P = [p.copy()]
        for t in range(1, steps + 1):
            g = grad(p)
            if kind == "sgd": p = p - 0.155 * g
            elif kind == "mom": v = 0.75 * v + g; p = p - 0.035 * v
            else:
                m = 0.9 * m + 0.1 * g; s = 0.999 * s + 0.001 * g * g
                mh = m / (1 - 0.9 ** t); sh = s / (1 - 0.999 ** t); p = p - 0.12 * mh / (np.sqrt(sh) + 1e-8)
            P.append(p.copy())
        return np.array(P)
    x, y = np.meshgrid(np.linspace(-4.5, 1.5, 200), np.linspace(-2, 2, 200))
    f, ax = plt.subplots(figsize=(11, 5.2))
    ax.contour(x, y, 0.5 * (x ** 2 + 12 * y ** 2), levels=14, colors=GRID, linewidths=1.5)
    for k, c, n in (("sgd", CORAL, "Gradient descent"), ("mom", BLUE, "Momentum"), ("adam", GREEN, "Adam")):
        P = run(k); ax.plot(P[:, 0], P[:, 1], "o-", color=c, ms=4, lw=2, label=n)
    ax.scatter([0], [0], marker="*", s=300, color=GOLD, zorder=6); ax.legend(fontsize=14, loc="upper right", frameon=True, facecolor="white")
    ax.set_aspect("equal"); ax.set_title("Same start, same budget: an elongated valley")
    return f


@fig("d10_sched")
def _():
    T = 1000; w = 60; t = np.arange(T)
    lr = np.where(t < w, t / w, 0.5 * (1 + np.cos(np.pi * (t - w) / (T - w))))
    f, ax = plt.subplots(figsize=(9, 4.4))
    ax.plot(t, 3e-4 * lr, color=VIOLET); ax.axvspan(0, w, color=GOLD, alpha=0.2); ax.text(8, 3.1e-4, "warm-up", fontsize=14, color=NAVY)
    ax.text(400, 2.3e-4, "cosine decay", fontsize=15, color=NAVY); ax.set_xlabel("training step"); ax.set_ylabel("learning rate")
    ax.set_title("Warm-up + cosine schedule (typical for transformers)")
    return f


@fig("d10_lagrange")
def _():
    x, y = np.meshgrid(np.linspace(-0.5, 3, 300), np.linspace(-0.5, 3, 300))
    f, ax = plt.subplots(figsize=(6.5, 6.2))
    cs = ax.contour(x, y, x * y, levels=[0.5, 1, 1.5, 2.25, 3, 4], cmap="viridis"); ax.clabel(cs, fontsize=11)
    xx = np.linspace(-0.5, 3, 10); ax.plot(xx, 3 - xx, color=CORAL, lw=3, label="constraint $x+y=3$")
    ax.scatter([1.5], [1.5], color=NAVY, s=90, zorder=6); ax.text(1.6, 1.62, "optimum (1.5, 1.5)", fontsize=14)
    arrow(ax, (1.5, 1.5), (2.1, 2.1), GREEN, lw=2.5, label="$\\nabla f \\parallel \\nabla g$", off=(0.05, 0.05), fs=15)
    ax.set_xlim(-0.2, 3); ax.set_ylim(-0.2, 3); ax.set_aspect("equal"); ax.legend(loc="upper right", fontsize=13, frameon=True, facecolor="white")
    ax.set_title("Maximise $xy$ subject to $x+y=3$")
    return f


if __name__ == "__main__":
    pre = sys.argv[1:]
    for name, fn in REG.items():
        if pre and not any(name.startswith(p) for p in pre):
            continue
        save(fn(), name)
        print("fig", name)
