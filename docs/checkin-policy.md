# Check-in Policy Enforcement

Use both CI checks and branch protection so policy is not optional.

## 1. Enable required status checks on `main`
In GitHub repository settings:
- Go to `Settings -> Branches -> Add branch protection rule`
- Branch name pattern: `main`
- Enable:
  - Require a pull request before merging
  - Require approvals (recommended: 1+)
  - Dismiss stale approvals when new commits are pushed
  - Require review from Code Owners
  - Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Include administrators (recommended)

Select these required checks:
- `Validate Tool Policies`
- `Enforce Changelog and Version on Tool Changes`
- `Check Markdown Links`
- `Enforce Tool README Sections`

## 2. Keep CODEOWNERS strict
Update `.github/CODEOWNERS` with real GitHub usernames/teams.

## 3. No direct pushes to main
Enable "Do not allow bypassing the above settings" if your plan supports it.

## 4. Optional hardening
- Require signed commits
- Restrict who can push to matching branches
- Enable merge queue for busy repos

## Local command
Contributors can run locally before pushing:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-tools.ps1
```
