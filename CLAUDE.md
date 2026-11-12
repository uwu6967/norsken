# Norsken — rules for Claude

- Push finished work straight to `main` (fast-forward). No PRs, no side branches left behind.
- Every push to `main` makes a GitHub Release (`.github/workflows/release.yml`) with
  `Norsken.zip` + `bokmerker.html`. Release notes = commit messages, so write them for Danny:
  plain subject saying what changed, short body listing what was done.
- Every commit: author AND committer `uwu6967 <22033341+uwu6967@users.noreply.github.com>`.
  No co-author lines. Check: `git log --format='%an <%ae> | %cn <%ce>'`.
- NDA: never commit guest names, phone numbers, emails, or any photos.
- Edit `src/` or `resdiary/`, then ALWAYS run `python3 tools/build.py` and commit the output
  (`index.html`, `bokmerker.html`). The user never builds: the repo must be download-and-use.
- Context: `docs/HANDOFF.md`. Keep replies short and just build.
