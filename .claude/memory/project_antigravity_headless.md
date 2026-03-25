---
name: Antigravity Headless Docker Project
description: Building a safe headless setup for Google Antigravity IDE using Docker + noVNC, avoiding third-party proxy tools
type: project
---

## Project: Antigravity Headless via Docker + noVNC

Goal: Run Google Antigravity GUI inside a Docker container, accessible via browser (noVNC), instead of using third-party proxy tools like lbjlaq/antigravity-manager.

**Why:** User tried Gemini CLI but found it lacking. Wanted headless Antigravity but lbjlaq/antigravity-manager has security concerns (version spoofing, TLS fingerprint emulation, uses Google internal v1internal API, risk of ToS violation/account ban). Building our own safe alternative that runs the real Antigravity GUI.

**How to apply:** Always use official Google sources. No spoofing, no internal APIs, no third-party wrappers.

## Architecture Decision
- Chose **Option A** (VNC/noVNC) over Option B (Gemini API direct) and Option C (official API proxy)
- Stack: Debian bookworm-slim + Xvfb + x11vnc + Fluxbox + noVNC + supervisord
- Antigravity installed from **official APT repo** (user verified the correct repo commands)
- Access via browser at port 6080 (noVNC), optional VNC client at port 5900

## Current State (2026-03-25)
- Initial commit pushed to GitHub: https://github.com/monthop-gmail/test-antigravity-headless (private)
- NOT yet built/tested — user's local network is unstable, will continue on server
- Next step: `docker compose up -d --build` on the server and test

## Official Antigravity APT Repo (user-verified)
```
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" > /etc/apt/sources.list.d/antigravity.list
```
