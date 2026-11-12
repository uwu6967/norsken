# Norsken — rules for Claude

- Push finished work straight to `main` (fast-forward). No PRs, no side branches left behind.
- Every commit: author AND committer `uwu6967 <22033341+uwu6967@users.noreply.github.com>`.
  No co-author lines. Check: `git log --format='%an <%ae> | %cn <%ce>'`.
- NDA: never commit guest names, phone numbers, emails, or any photos.
- Edit `src/`, then rebuild the single-file app: `python3 tools/build.py` (writes `index.html`).
- Context: `docs/HANDOFF.md`. Keep replies short and just build.
