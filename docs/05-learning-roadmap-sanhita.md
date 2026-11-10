# Learning roadmap: Sanhita

Two goals: use web development to build the product, and grow into an AI scientist. Written 10 November 2026.

## Part 1: web development for the startup

You already know web development, so you can skip the no-code stage sooner than planned.

**Month 1: landing page and signups**
- One-page site: who it's for, what students build, price, signup form, testimonials.
- Stack: Next.js on Vercel (free tier), Tailwind CSS, a form that writes to Supabase or Google Sheets.
- Payments: Razorpay payment links or Razorpay Checkout.
- Basics that matter: fast loading, works well on phones (most students will visit on mobile), simple analytics (for example Plausible or Google Analytics).

**Months 2 to 6: student dashboard**
- Login with Supabase Auth (Google sign-in).
- Each team's project page: milestones, mentor comments, final report and demo links.
- Public showcase pages of finished student projects (your best marketing and SEO).

**Later: what makes the product special**
- Live demos of student models in the browser (Hugging Face Spaces, Gradio, or running small models in the browser with Transformers.js / ONNX Runtime Web).
- An AI helper that gives first-pass feedback on code and report drafts.
- A shared leaderboard for course benchmarks.

## Part 2: becoming an AI scientist

The path from web developer to AI researcher is: use AI, then build with AI, then understand it deeply, then do new research.

1. **Use and build (months 1 to 2).** Build LLM apps: chatbots, RAG over documents, simple agents. Course: the free Hugging Face courses. This also helps the website directly.
2. **Foundations (months 2 to 5).** Python for data (NumPy, pandas), then fast.ai "Practical Deep Learning for Coders", then Andrej Karpathy's "Neural Networks: Zero to Hero". Learn the maths alongside (see Shikhar's roadmap, which you can share).
3. **Reproduce a paper (months 5 to 7).** Pick one document-AI or vision paper with public code and reproduce its main result. Write it up as a blog post or video.
4. **Your own research (months 7 onwards).** Combine your strengths: web and AI. Ideas: human-in-the-loop tools for labelling Indian documents, browser-based document AI, user studies of AI tools in education. Aim for a workshop paper.
5. **Co-author with students.** Mentoring student projects gives you research experience and papers too.

## Habits
- Read 2 papers a week; write a 5-line summary of each in a shared Notion page.
- Join one reading group (at your institute or online).
- Present your learning at your own webinars. Teaching makes knowledge stick, and you already present well.
