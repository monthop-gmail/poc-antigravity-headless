---
name: Antigravity Headless Docker Project
description: Headless Antigravity IDE via Docker + noVNC — working, exploring programmatic AI access via internal gRPC API
type: project
---

## Project: Antigravity Headless via Docker + noVNC

Goal: Run Antigravity AI for free via OAuth, eventually integrate with LINE Bot.

## Current State (2026-03-25)
- **Docker noVNC**: Working — Antigravity signed in, AI usable via browser
- **Repo**: https://github.com/monthop-gmail/poc-antigravity-headless (public)

## Key Discovery: Internal gRPC API (Connect Protocol)

### Working
- **Protocol**: Connect (gRPC over HTTP/JSON)
- **CSRF Header**: `x-codeium-csrf-token` (found in extension.js)
- **Working calls**: Heartbeat, GetStatus, GetAllCascadeTrajectories, GenerateCommitMessage, GetAgentScripts
- Auth works — LS has OAuth token when started from Antigravity GUI

### How to find CSRF + ports
```bash
# From LS process args:
ps aux | grep language_server | grep -v grep
# --csrf_token = for calling LS API
# HTTP port from log: grep "for HTTP" in Antigravity.log
```

### Blocked: SendUserCascadeMessage crashes (SIGSEGV)
- Even `{}` empty request causes segfault in Go code
- Crash at `rpcs_cascade.go:515` — nil pointer dereference
- LS expects internal state that only GUI client provides
- This is the ONLY chat-send endpoint available as unary RPC

### Proto Schema (decoded from extension.js base64)
- `SendUserCascadeMessage`: needs metadata, cascade_id, items[{text}]
- `StartChatClientRequestStream`: bidirectional stream (can't use with curl)
- `AddCascadeInputRequest`: items (TextOrScopeItem), images, media
- `TextOrScopeItem`: oneof chunk { text (string), item (ContextScopeItem) }

### MCP Endpoint
- Chrome DevTools MCP at `http://127.0.0.1:<port>/mcp` (browser automation only, not chat)

## Antigravity Server (REH)
- Auto-installed by Antigravity Windows SSH at `~/.antigravity-server/`
- Also downloadable from: `https://edgedl.me.gvt1.com/edgedl/release2/j0qc3/antigravity/stable/{VERSION}-{COMMIT}/linux-x64/Antigravity-reh.tar.gz`
- Current: VERSION=1.20.6, COMMIT=135ccf460c67c4b900dc10aa71c978f27d78601c
- Local copy at `antigravity-reh/` (409MB, gitignored)

## Next Steps
- **Option A**: Use bidirectional streaming (StartChatClientRequestStream) with a proper gRPC client (not curl)
- **Option B**: GUI automation via xdotool in Docker container
- **Option C**: Gemini API Free Tier for LINE Bot (simplest, safest)
- **Option D**: Intercept/proxy the extension server auth flow to run LS standalone with valid token

## Official APT Repo
```
curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg
echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" > /etc/apt/sources.list.d/antigravity.list
```
