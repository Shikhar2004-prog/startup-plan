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



# ------------------------------------------------------------------ Day 11
@fig("d11_activations")
def _():
    from math import erf
    z = np.linspace(-4, 4, 400)
    sig = 1 / (1 + np.exp(-z)); th = np.tanh(z); relu = np.maximum(0, z)
    Phi = 0.5 * (1 + np.vectorize(erf)(z / np.sqrt(2))); gelu = z * Phi
    f, (a, b) = plt.subplots(1, 2, figsize=(13, 4.6))
    for y, c, n in ((sig, TEAL, "sigmoid"), (th, VIOLET, "tanh"), (relu, GOLD, "ReLU"), (gelu, CORAL, "GELU")):
        a.plot(z, y, color=c, label=n)
    a.set_ylim(-1.5, 3); a.legend(fontsize=14); a.set_title("Activation $\\phi(z)$")
    dg = np.gradient(gelu, z)
    for y, c, n in ((sig * (1 - sig), TEAL, "sigmoid′ (max 0.25)"), (1 - th ** 2, VIOLET, "tanh′"), ((z > 0).astype(float), GOLD, "ReLU′"), (dg, CORAL, "GELU′")):
        b.plot(z, y, color=c, label=n)
    b.set_ylim(-0.2, 1.3); b.legend(fontsize=14); b.set_title("Derivative $\\phi'(z)$: what backprop multiplies by")
    f.tight_layout()
    return f


@fig("d11_init")
def _():
    rng = np.random.default_rng(0)
    L, n = 20, 512
    x0 = rng.normal(size=(1000, n))
    f, ax = plt.subplots(figsize=(9, 4.8))
    for scale, c, lab in ((0.5, CORAL, "std = 0.5·√(2/n): signal vanishes"), (1.0, GREEN, "He init std = √(2/n): stable"), (1.5, VIOLET, "std = 1.5·√(2/n): signal explodes")):
        h = x0.copy(); stds = [h.std()]
        for _ in range(L):
            W = rng.normal(0, scale * np.sqrt(2 / n), size=(n, n)); h = np.maximum(0, h @ W); stds.append(h.std())
        ax.semilogy(stds, color=c, label=lab, marker="o", ms=4)
    ax.set_xlabel("layer"); ax.set_ylabel("activation std (log)"); ax.legend(fontsize=13)
    ax.set_title("20-layer ReLU network: initial scale decides everything")
    return f


@fig("d11_boundary")
def _():
    rng = np.random.default_rng(1)
    n = 300; r = np.r_[rng.normal(1, 0.15, n), rng.normal(2.2, 0.2, n)]; t = rng.uniform(0, 2 * np.pi, 2 * n)
    X = np.c_[r * np.cos(t), r * np.sin(t)]; y = np.r_[np.zeros(n), np.ones(n)]
    # logistic regression
    w = np.zeros(2); b = 0.0
    for _ in range(500):
        p = 1 / (1 + np.exp(-(X @ w + b))); w -= 0.5 * X.T @ (p - y) / len(y); b -= 0.5 * (p - y).mean()
    # 2-layer MLP
    H = 16; W1 = rng.normal(0, 1, (2, H)); b1 = np.zeros(H); W2 = rng.normal(0, 0.5, H); b2 = 0.0
    for _ in range(3000):
        z1 = X @ W1 + b1; h = np.tanh(z1); p = 1 / (1 + np.exp(-(h @ W2 + b2)))
        d2 = (p - y) / len(y); gW2 = h.T @ d2; gb2 = d2.sum(); dh = np.outer(d2, W2) * (1 - h ** 2)
        gW1 = X.T @ dh; gb1 = dh.sum(0)
        for P_, G in ((W1, gW1), (b1, gb1), (W2, gW2)): P_ -= 1.0 * G
        b2 -= 1.0 * gb2
    xx, yy = np.meshgrid(np.linspace(-3, 3, 300), np.linspace(-3, 3, 300)); G = np.c_[xx.ravel(), yy.ravel()]
    f, axs = plt.subplots(1, 2, figsize=(12, 5.4))
    P1 = (1 / (1 + np.exp(-(G @ w + b)))).reshape(xx.shape)
    P2 = (1 / (1 + np.exp(-(np.tanh(G @ W1 + b1) @ W2 + b2)))).reshape(xx.shape)
    for ax, Pm, t_ in ((axs[0], P1, "Logistic regression: a straight line fails"), (axs[1], P2, "MLP with 16 hidden units: bends the boundary")):
        ax.contourf(xx, yy, Pm, levels=20, cmap="RdBu_r", alpha=0.35); ax.contour(xx, yy, Pm, levels=[0.5], colors=NAVY, linewidths=2.5)
        ax.scatter(X[y == 0, 0], X[y == 0, 1], s=8, color=BLUE); ax.scatter(X[y == 1, 0], X[y == 1, 1], s=8, color=CORAL)
        ax.set_aspect("equal"); ax.set_title(t_, fontsize=15); ax.set_xticks([]); ax.set_yticks([])
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 12
@fig("d12_scaling")
def _():
    rng = np.random.default_rng(0)
    f, (a, b) = plt.subplots(1, 2, figsize=(13, 4.4))
    ds = [4, 16, 64, 256, 1024]
    stds = [np.std((rng.normal(size=(5000, d)) * rng.normal(size=(5000, d))).sum(1)) for d in ds]
    a.plot(ds, stds, "o-", color=CORAL, label="std of $\\mathbf{q}\\cdot\\mathbf{k}$"); a.plot(ds, np.sqrt(ds), "--", color=MUTED, label="$\\sqrt{d}$")
    a.plot(ds, np.array(stds) / np.sqrt(ds), "o-", color=GREEN, label="std of $\\mathbf{q}\\cdot\\mathbf{k}/\\sqrt{d}$")
    a.set_xscale("log", base=2); a.legend(fontsize=13); a.set_xlabel("$d_k$"); a.set_title("Dot products grow like $\\sqrt{d_k}$")
    s = rng.normal(size=8) * np.sqrt(512)
    p1 = np.exp(s - s.max()); p1 /= p1.sum(); s2 = s / np.sqrt(512); p2 = np.exp(s2 - s2.max()); p2 /= p2.sum()
    xs = np.arange(8); b.bar(xs - 0.2, p1, 0.4, color=CORAL, label="unscaled: one-hot, gradients ≈ 0"); b.bar(xs + 0.2, p2, 0.4, color=GREEN, label="scaled by $1/\\sqrt{d_k}$: soft")
    b.legend(fontsize=13); b.set_title("Softmax over 8 keys, $d_k=512$"); b.set_xlabel("key")
    f.tight_layout()
    return f


@fig("d12_posenc")
def _():
    T, d = 64, 64
    pos = np.arange(T)[:, None]; i = np.arange(d // 2)[None]
    ang = pos / (10000 ** (2 * i / d)); PE = np.zeros((T, d)); PE[:, 0::2] = np.sin(ang); PE[:, 1::2] = np.cos(ang)
    f, (a, b) = plt.subplots(1, 2, figsize=(13, 4.6), gridspec_kw={"width_ratios": [1.3, 1]})
    im = a.imshow(PE, cmap="RdBu_r", aspect="auto"); a.set_xlabel("embedding dimension"); a.set_ylabel("position"); a.set_title("Sinusoidal position encodings"); a.grid(False)
    for k, c in ((0, CORAL), (4, BLUE), (16, GREEN)):
        b.plot(PE[:, 2 * k], color=c, label=f"dim {2*k}: wavelength {2*np.pi*10000**(2*k/d):.0f}")
    b.set_xlabel("position"); b.set_ylim(-1.15, 1.9); b.legend(fontsize=12, loc="upper center", ncol=3, framealpha=0.95, handlelength=1.2, columnspacing=0.8); b.set_title("Each pair of dims is a clock at its own speed")
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 13
def _swiss(n, rng):
    t = 1.5 * np.pi * (1 + 2 * rng.random(n)); return np.c_[t * np.cos(t), t * np.sin(t)] / 6


@fig("d13_diffusion")
def _():
    rng = np.random.default_rng(0)
    x0 = _swiss(1500, rng)
    T = 1000; betas = np.linspace(1e-4, 0.02, T); abar = np.cumprod(1 - betas)
    f, axs = plt.subplots(1, 5, figsize=(15, 3.4))
    for ax, t in zip(axs, [0, 50, 150, 400, 999]):
        xt = np.sqrt(abar[t]) * x0 + np.sqrt(1 - abar[t]) * rng.normal(size=x0.shape)
        ax.scatter(xt[:, 0], xt[:, 1], s=3, color=VIOLET, alpha=0.6); ax.set_xlim(-3.2, 3.2); ax.set_ylim(-3.2, 3.2); ax.set_aspect("equal")
        ax.set_title(f"$t={t}$" + ("  (data)" if t == 0 else "  (noise)" if t == 999 else "") + f"\n$\\sqrt{{\\bar\\alpha_t}}={np.sqrt(abar[t]):.2f}$", fontsize=14)
        ax.set_xticks([]); ax.set_yticks([])
    f.tight_layout()
    return f


@fig("d13_gan")
def _():
    x = np.linspace(-4, 6, 500)
    N = lambda m, s: np.exp(-(x - m) ** 2 / (2 * s * s)) / (s * np.sqrt(2 * np.pi))
    f, axs = plt.subplots(1, 3, figsize=(14, 3.9))
    pdata = N(2, 0.7)
    for ax, (m, s), t in zip(axs, [(-1.5, 1.0), (0.8, 0.9), (2, 0.7)], ["start", "training", "equilibrium"]):
        pg = N(m, s); D = pdata / (pdata + pg + 1e-12)
        ax.fill_between(x, pdata, color=BLUE, alpha=0.25, label="$p_{data}$"); ax.plot(x, pg, color=GREEN, label="$p_G$")
        ax2 = ax.twinx(); ax2.plot(x, D, color=CORAL, ls="--", lw=2, label="$D^*(x)$"); ax2.set_ylim(0, 1.05); ax2.grid(False)
        ax.set_title(t); ax.set_yticks([])
        if t == "start":
            ax.legend(loc="upper left", fontsize=12); ax2.legend(loc="upper right", fontsize=12)
    f.tight_layout()
    return f


@fig("d13_flow")
def _():
    rng = np.random.default_rng(0)
    z = rng.normal(size=20000)
    x = np.exp(0.6 * z)  # x = f(z)
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 4.2))
    a.hist(z, 80, density=True, color=BLUE, alpha=0.7); a.set_title("$z\\sim\\mathcal{N}(0,1)$")
    b.hist(x, 120, range=(0, 5), density=True, color=VIOLET, alpha=0.7)
    xs = np.linspace(0.01, 5, 400); zz = np.log(xs) / 0.6; px = np.exp(-zz ** 2 / 2) / np.sqrt(2 * np.pi) / (0.6 * xs)
    b.plot(xs, px, color=CORAL, lw=2.5, label="$p_z(f^{-1}(x))\\,|df^{-1}/dx|$"); b.legend(fontsize=14); b.set_title("$x=f(z)=e^{0.6z}$: density squeezed and stretched")
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 14
@fig("d14_grid")
def _():
    H, W = 4, 5; goal = (0, 4); pit = (1, 4); wall = {(1, 1), (2, 3)}
    gamma = 0.9; V = np.zeros((H, W)); acts = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for _ in range(100):
        Vn = V.copy()
        for i in range(H):
            for j in range(W):
                if (i, j) in (goal, pit) or (i, j) in wall: continue
                best = -1e9
                for di, dj in acts:
                    ni, nj = i + di, j + dj
                    if not (0 <= ni < H and 0 <= nj < W) or (ni, nj) in wall: ni, nj = i, j
                    r = 1 if (ni, nj) == goal else -1 if (ni, nj) == pit else -0.04
                    best = max(best, r + gamma * (0 if (ni, nj) in (goal, pit) else V[ni, nj]))
                Vn[i, j] = best
        V = Vn
    f, ax = plt.subplots(figsize=(7.6, 6.2))
    M = np.ma.array(V, mask=np.zeros_like(V, bool))
    ax.imshow(V, cmap="RdYlGn", vmin=-0.4, vmax=1); ax.grid(False)
    for i in range(H):
        for j in range(W):
            if (i, j) in wall: ax.add_patch(plt.Rectangle((j - .5, i - .5), 1, 1, color="#444")); continue
            if (i, j) == goal: ax.add_patch(plt.Rectangle((j - .5, i - .5), 1, 1, color=GREEN)); ax.text(j, i, "GOAL\n+1", ha="center", va="center", fontsize=15, color="white", weight="bold"); continue
            if (i, j) == pit: ax.add_patch(plt.Rectangle((j - .5, i - .5), 1, 1, color=CORAL)); ax.text(j, i, "PIT\n−1", ha="center", va="center", fontsize=15, color="white", weight="bold"); continue
            best, bd = -1e9, None
            for di, dj in acts:
                ni, nj = i + di, j + dj
                if not (0 <= ni < H and 0 <= nj < W) or (ni, nj) in wall: continue
                r = 1 if (ni, nj) == goal else -1 if (ni, nj) == pit else -0.04
                q = r + gamma * (0 if (ni, nj) in (goal, pit) else V[ni, nj])
                if q > best: best, bd = q, (di, dj)
            ax.text(j, i + 0.28, f"{V[i,j]:.2f}", ha="center", va="center", fontsize=13, color=NAVY)
            ax.annotate("", xy=(j + 0.3 * bd[1], i - 0.1 + 0.3 * bd[0]), xytext=(j - 0.05 * bd[1], i - 0.1 - 0.05 * bd[0]), arrowprops=dict(arrowstyle="-|>", color=NAVY, lw=2.2))
    ax.set_xticks([]); ax.set_yticks([]); ax.set_title("Value iteration: $V^*(s)$ and the greedy policy ($\\gamma=0.9$)")
    return f


@fig("d14_ppo")
def _():
    r = np.linspace(0, 2, 400); eps = 0.2
    f, axs = plt.subplots(1, 2, figsize=(12, 4.2))
    for ax, A, t in ((axs[0], 1, "Advantage $A>0$: good action"), (axs[1], -1, "Advantage $A<0$: bad action")):
        ax.plot(r, r * A, color=MUTED, ls="--", lw=2, label="unclipped $rA$")
        ax.plot(r, np.minimum(r * A, np.clip(r, 1 - eps, 1 + eps) * A), color=VIOLET, lw=3.5, label="PPO objective")
        ax.axvline(1, color=GRID); ax.axvspan(1 - eps, 1 + eps, color=GOLD, alpha=0.15)
        ax.set_xlabel("probability ratio $r=\\pi_\\theta/\\pi_{old}$"); ax.set_title(t); ax.legend(fontsize=13, loc="upper left" if A > 0 else "lower left")
    f.tight_layout()
    return f


# ------------------------------------------------------------------ Day 15
@fig("d15_roc")
def _():
    rng = np.random.default_rng(3)
    yt = np.r_[np.ones(200), np.zeros(1800)]
    sA = np.r_[rng.normal(1.6, 1, 200), rng.normal(0, 1, 1800)]; sB = np.r_[rng.normal(0.8, 1, 200), rng.normal(0, 1, 1800)]
    f, (a, b) = plt.subplots(1, 2, figsize=(12, 5))
    for s, c, n in ((sA, GREEN, "model A"), (sB, CORAL, "model B")):
        th = np.sort(s)[::-1]; P = yt.sum(); Nn = len(yt) - P
        tp = np.cumsum(yt[np.argsort(-s)]); fp = np.cumsum(1 - yt[np.argsort(-s)])
        tpr, fpr = tp / P, fp / Nn; prec = tp / (tp + fp)
        auc = np.trapezoid(tpr, fpr) if hasattr(np, "trapezoid") else np.trapz(tpr, fpr)
        a.plot(fpr, tpr, color=c, label=f"{n}: AUC = {auc:.2f}"); b.plot(tpr, prec, color=c, label=n)
    a.plot([0, 1], [0, 1], ls="--", color=MUTED, lw=1.5, label="random"); a.set_xlabel("false positive rate"); a.set_ylabel("true positive rate (recall)"); a.legend(fontsize=13); a.set_title("ROC curve")
    b.axhline(0.1, ls="--", color=MUTED, lw=1.5, label="random = positive rate 10%"); b.set_xlabel("recall"); b.set_ylabel("precision"); b.legend(fontsize=13); b.set_title("Precision–recall (better for rare positives)")
    f.tight_layout()
    return f


@fig("d15_seeds")
def _():
    rng = np.random.default_rng(7)
    A = 84.0 + rng.normal(0, 0.45, 5); B = 84.4 + rng.normal(0, 0.45, 5); C = 85.6 + rng.normal(0, 0.45, 5)
    f, ax = plt.subplots(figsize=(8, 4.8))
    for i, (v, c, n) in enumerate(((A, MUTED, "baseline"), (B, CORAL, "method X"), (C, GREEN, "method Y"))):
        ax.scatter(np.full(5, i) + rng.uniform(-0.08, 0.08, 5), v, color=c, s=60, zorder=5)
        ax.errorbar(i + 0.25, v.mean(), yerr=1.96 * v.std(ddof=1) / np.sqrt(5), fmt="o", color=NAVY, capsize=8, ms=9, lw=2.5)
    ax.set_xticks([0, 1, 2]); ax.set_xticklabels(["baseline", "method X\n(+0.4)", "method Y\n(+1.6)"]); ax.set_ylabel("accuracy (%)")
    ax.set_title("5 seeds each: dots = runs, bars = 95% CI of the mean"); ax.set_xlim(-0.5, 2.6)
    return f


@fig("d15_scaling")
def _():
    C = np.logspace(17, 24, 30)
    L = 1.7 + (C / 1e10) ** -0.12 * 9
    rng = np.random.default_rng(1); Lo = L * np.exp(rng.normal(0, 0.01, len(C)))
    f, (a, b) = plt.subplots(1, 2, figsize=(13, 4.6))
    a.plot(C, Lo, "o", color=BLUE, ms=6); a.plot(C, L, color=CORAL, lw=2.5, label="$L(C)=E+A\\,C^{-\\alpha}$")
    a.set_xscale("log"); a.set_xlabel("training compute $C$ (FLOPs)"); a.set_ylabel("validation loss"); a.axhline(1.7, ls="--", color=MUTED, lw=1.5); a.text(1e17, 1.75, "irreducible $E$ (entropy of text, Day 9)", fontsize=13, color=MUTED)
    a.legend(fontsize=14); a.set_title("Loss falls as a power law in compute")
    a2 = b; a2.loglog(C, Lo - 1.7, "o", color=BLUE, ms=6); a2.loglog(C, L - 1.7, color=CORAL, lw=2.5)
    a2.set_xlabel("compute $C$"); a2.set_ylabel("$L-E$"); a2.set_title("On log–log axes a power law is a straight line, slope $-\\alpha$")
    f.tight_layout()
    return f


if __name__ == "__main__":
    pre = sys.argv[1:]
    for name, fn in REG.items():
        if pre and not any(name.startswith(p) for p in pre):
            continue
        save(fn(), name)
        print("fig", name)
