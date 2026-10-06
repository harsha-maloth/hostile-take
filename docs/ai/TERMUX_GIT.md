# Git + GitHub from Termux (owner works on Android)

Owner pushes from Termux. When giving git instructions, use these commands and
update this file if the workflow changes. Never put tokens in this file.

## One-time setup
```
pkg update && pkg upgrade -y
pkg install git unzip gh -y
termux-setup-storage            # allow storage access when prompted
git config --global user.name "YOUR NAME"
git config --global user.email "YOU@EXAMPLE.COM"
gh auth login                   # GitHub.com > HTTPS > Login with a web browser
```

## First push (from the zip in Downloads)
```
cd ~
unzip ~/storage/downloads/hostile-take.zip
cd hostile-take
git init -b main
git add .
git commit -m "Initial commit: Hostile Take scaffold"
gh repo create hostile-take --public --source=. --push
```
Repo must be public for free GitHub Pages.

## Enable Pages + add secrets (once)
```
gh api -X POST repos/OWNER/hostile-take/pages -f build_type=workflow
gh secret set VITE_SUPABASE_URL      # paste value when prompted
gh secret set VITE_SUPABASE_ANON_KEY # paste value when prompted
gh workflow run deploy.yml
```
Replace OWNER with the GitHub username. If the Pages call errors, set
Settings > Pages > Source to "GitHub Actions" in the browser instead.

## Every later push
```
cd ~/hostile-take
git add .
git commit -m "Short message about the change"
git push
```

## Replacing files with a newer zip from the AI
```
cd ~
unzip -o ~/storage/downloads/hostile-take.zip     # overwrites files in ~/hostile-take
cd hostile-take && git status
git add . && git commit -m "Update from AI session" && git push
```
Note: unzip -o overwrites files but does not delete removed ones. Check `git status`.

## Common errors
- `Permission denied (storage)`: run `termux-setup-storage` again, restart Termux.
- `fatal: not a git repository`: you are in the wrong folder, `cd ~/hostile-take`.
- `rejected (non-fast-forward)`: run `git pull --rebase` then `git push`.
- Auth failed: run `gh auth status`, then `gh auth login` again.

## This owner's repo (empty repo already created on GitHub)
```
cd ~/hostile-take
gh auth setup-git                      # lets plain `git push` use the gh login
git remote add origin https://github.com/harsha-maloth/hostile-take.git
git push -u origin main
```
If `remote origin already exists`: `git remote set-url origin https://github.com/harsha-maloth/hostile-take.git`
Pages: `gh api -X POST repos/harsha-maloth/hostile-take/pages -f build_type=workflow`
