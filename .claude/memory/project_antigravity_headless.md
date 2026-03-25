---
name: Antigravity Headless Docker Project
description: Headless Antigravity IDE via Docker + noVNC — working, signed in, exploring LINE Bot integration via internal gRPC API
type: project
---

## Project: Antigravity Headless via Docker + noVNC

Goal: Run Google Antigravity GUI inside a Docker container, accessible via browser (noVNC). Use AI for free via OAuth.

**Why:** User wants free Antigravity AI (Gemini) without third-party proxy tools.

**How to apply:** Always use official Google sources. No spoofing, no internal APIs from third parties.

## Architecture
- Stack: Debian bookworm-slim + Xvfb + x11vnc + Fluxbox + noVNC + Chromium + supervisord
- Antigravity installed from official APT repo
- Access: noVNC at port 6080, VNC at port 5900
- Repo: https://github.com/monthop-gmail/poc-antigravity-headless (public)

## Current State (2026-03-25)
- **Working** — built, tested, Antigravity signed in with Google, AI usable via noVNC

## Key Discovery: Internal gRPC API

The Antigravity Language Server exposes a **Connect protocol (gRPC over HTTP/JSON)** API:

- **CSRF Header**: `x-codeium-csrf-token` (found in extension.js source)
- **Working endpoints** (tested on LS HTTP port inside container):
  - `exa.language_server_pb.LanguageServerService/Heartbeat` — returns heartbeat timestamp
  - `exa.language_server_pb.LanguageServerService/GenerateCommitMessage` — works (needs repo)
  - `exa.language_server_pb.LanguageServerService/GetAgentScripts` — returns {}
  - `exa.language_server_pb.LanguageServerService/SendActionToChatPanel` — returns {}
  - `exa.language_server_pb.LanguageServerService/GetTokenBase` — needs model param
  - `exa.chat_client_server_pb.ChatClientServerService/StartChatClientRequestStream` — streaming, format TBD
  - `exa.language_server_pb.LanguageServerService/StreamAgentStateUpdates` — streaming

- **Auth flow**: LS gets OAuth token from Antigravity GUI via `--extension_server_port` + `--extension_server_csrf_token` at startup. Once running, LS has token cached — API calls work without 401.

- **How to get CSRF token + port**: from LS process args (`ps aux | grep language_server`)

## Antigravity Server (REH) Download
- URL: `https://edgedl.me.gvt1.com/edgedl/release2/j0qc3/antigravity/stable/{VERSION}-{COMMIT}/linux-x64/Antigravity-reh.tar.gz`
- Current: VERSION=1.20.6, COMMIT=135ccf460c67c4b900dc10aa71c978f27d78601c
- Saved locally at `antigravity-reh/` (409MB, gitignored)

## Next Steps
- **Find correct request format for chat/agent gRPC calls** — this would enable LINE Bot integration
- Decode proto schema from the binary or reverse-engineer from extension.js
- Build a bridge: LINE Bot → gRPC call to LS → response back to LINE

## Official Antigravity APT Repo (user-verified)
```
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" > /etc/apt/sources.list.d/antigravity.list
```
