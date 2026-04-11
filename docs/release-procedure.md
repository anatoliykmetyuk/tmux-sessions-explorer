# Release procedure

This document describes how to publish a new version of **Tmux Explorer** to GitHub Releases.

## How releases are triggered

Pushing a **Git** tag that matches **`v*.*.*`** (semantic version, e.g. `v0.1.0`) runs the **Release** workflow (`.github/workflows/release.yml`). That workflow builds macOS installers and creates a GitHub Release with the built assets attached.

Tags that do not match this pattern do **not** trigger the workflow.

## Before you tag

1. **Merge or push** the commits you want in this release to the default branch (e.g. `main`) on GitHub.
2. **Optional but recommended:** run checks locally so CI is unlikely to fail mid-release:
   - `npm ci`
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`
3. **Optional:** set `"version"` in `package.json` to the same semver as the tag (without the leading `v`) so the repo version matches the release name.
4. **macOS signing:** the app is currently configured for **unsigned** builds (`identity: null` in `electron-builder`). Users may see Gatekeeper warnings. Code signing and notarization are separate follow-up work.

## Steps to cut a release

1. Update your local default branch and ensure it matches what you want released:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Choose a version (semver), e.g. `v0.1.0`.

3. Create an **annotated** tag on the release commit:

   ```bash
   git tag -a v0.1.0 -m "v0.1.0"
   ```

4. Push **only the tag** to `origin` (this starts the Release workflow):

   ```bash
   git push origin v0.1.0
   ```

5. In GitHub, open **Actions** and watch the **Release** workflow until it finishes.

6. In GitHub, open **Releases** and verify:
   - the new version and release notes (notes are auto-generated),
   - attached **`.dmg`** and **`.zip`** files for both **arm64** and **x64** (four assets total).

## What the workflow does

| Job | Runner | Output |
|------------|-----------|---------------------------------------------|
| `build-arm64` | `macos-14` (arm64) | `release/*.dmg`, `release/*.zip` (arm64)   |
| `build-x64`   | `macos-15-intel`   | `release/*.dmg`, `release/*.zip` (x64)     |
| `publish`     | Ubuntu             | Creates the GitHub Release; uploads assets |

Each build job runs `npm ci`, lint, typecheck, unit tests, `npm run build` (electron-vite), then `electron-builder` for the given architecture. Intel/x64 uses the `macos-15-intel` runner label because GitHub retired the old `macos-13` image.

## If something goes wrong

- **Fix the failure** in the repo, push the fix, then either:
  - delete the remote tag and re-tag the correct commit, or
  - bump to a patch tag (e.g. `v0.1.1`) and push that tag.
- **Delete a remote tag** (use with care):

  ```bash
  git push origin --delete v0.1.0
  ```

- **Delete a local tag:**

  ```bash
  git tag -d v0.1.0
  ```

- If GitHub already created a **Release** for a tag you removed, delete that release manually on the **Releases** page if you want it gone entirely.
