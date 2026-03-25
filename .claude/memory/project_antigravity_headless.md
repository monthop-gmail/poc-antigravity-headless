---
name: Antigravity Headless Docker Project
description: Headless Antigravity IDE via Docker + noVNC — working, signed in, exploring LINE Bot integration
type: project
---

## Project: Antigravity Headless via Docker + noVNC

Goal: Run Google Antigravity GUI inside a Docker container, accessible via browser (noVNC).

**Why:** User wants to use Antigravity AI (Gemini) for free via OAuth, without third-party proxy tools.

**How to apply:** Always use official Google sources. No spoofing, no internal APIs.

## Architecture
- Stack: Debian bookworm-slim + Xvfb + x11vnc + Fluxbox + noVNC + Chromium + supervisord
- Antigravity installed from official APT repo
- Access: noVNC at port 6080, VNC at port 5900
- Repo: https://github.com/monthop-gmail/poc-antigravity-headless (private, renamed)

## Current State (2026-03-25)
- **Working** — built, tested, Antigravity signed in with Google, AI usable via noVNC
- Fixes applied: noVNC path (websockify), dbus, --user-data-dir, Chromium for OAuth, Fluxbox toolbar hidden, autorestart=false

## Explored but Blocked
- `antigravity serve-web` / `antigravity tunnel` — need `antigravity-tunnel` binary which is **proprietary and missing from APT package**, no download available
- Language server CLI (`-cli -agent_mode`) — exists but **OAuth token sync fails** outside GUI context
- opencode-antigravity-auth (NoeFabris) — works but **violates Google ToS, risk of account ban**

## Next Steps (on hold)
- User wants to use Antigravity AI from **LINE Bot** — no safe programmatic API found yet
- Options considered: Gemini API Free Tier, Ollama self-host, OpenRouter, GUI automation via xdotool
- User is thinking of new ideas

## Official Antigravity APT Repo (user-verified)
```
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" > /etc/apt/sources.list.d/antigravity.list
```
