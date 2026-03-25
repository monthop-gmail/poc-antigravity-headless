# POC: Antigravity Headless via Docker + noVNC

Run Google Antigravity IDE inside a Docker container, accessible via browser (noVNC).
Use Antigravity AI (Gemini) for free via Google OAuth — no third-party proxy tools.

## Quick Start

```bash
cp .env.example .env    # edit password/resolution as needed
docker compose up -d --build
```

Open browser: `http://<server-ip>:6080` (VNC password: see `.env`)

## Architecture

```
Browser (any device)
    |
    v
noVNC (:6080)  ──>  x11vnc (:5900)  ──>  Xvfb (virtual display)
                                               |
                                          Fluxbox (WM)
                                               |
                                          Antigravity IDE
                                               |
                                          Gemini AI (free via OAuth)
```

**Stack:** Debian bookworm-slim, Xvfb, x11vnc, Fluxbox, noVNC (websockify), Chromium (for OAuth), supervisord

## What Works

- Antigravity GUI via noVNC in browser
- Google OAuth sign-in (Chromium handles the OAuth flow)
- Gemini AI chat, Agent Manager, Playground
- Full IDE features (editor, terminal, extensions)
- Accessible from any device with a browser

## Explored but Blocked

### `antigravity serve-web` / `antigravity tunnel`
- Need `antigravity-tunnel` binary — proprietary, missing from Linux APT package
- No standalone download available

### Language Server CLI (`-cli -agent_mode`)
- Binary exists at `extensions/antigravity/bin/language_server_linux_x64`
- Supports `-cli` and `-agent_mode` flags (stdin/stdout REPL)
- **Blocked:** OAuth token sync fails outside GUI context — LS gets token via `--extension_server_port` from Antigravity GUI process, standalone = `401 UNAUTHENTICATED`

### Antigravity Server (REH) — Downloaded Successfully
- **Antigravity-reh.tar.gz** is downloadable from Google CDN
- URL: `https://edgedl.me.gvt1.com/edgedl/release2/j0qc3/antigravity/stable/{VERSION}-{COMMIT}/linux-x64/Antigravity-reh.tar.gz`
- Current: `VERSION=1.20.6`, `COMMIT=135ccf460c67c4b900dc10aa71c978f27d78601c`
- Contains: `antigravity-server`, language server with CLI mode, all built-in extensions
- Saved locally at `antigravity-reh/` (409MB, gitignored)
- **Same problem:** CLI mode needs OAuth token that only GUI can provide

### opencode-antigravity-auth (third-party)
- Repo: https://github.com/NoeFabris/opencode-antigravity-auth
- Uses Antigravity OAuth client ID/secret to call Gemini API directly
- **Risk:** Violates Google ToS — accounts have been banned/shadow-banned

## Open Questions

- How to pass OAuth token to language server CLI mode?
- Can `gcloud auth` tokens work with the Cloud Code Assist API?
- Is there a way to intercept the extension server port auth flow?

## Files

```
Dockerfile              # Container image definition
docker-compose.yml      # Service configuration
supervisord.conf        # Process manager config
start-antigravity.sh    # Antigravity launch script with container flags
.env.example            # Environment variables template
antigravity-reh/        # Server binary (gitignored, 409MB)
```

## Re-downloading Antigravity REH

If `antigravity-reh/` is lost:

```bash
COMMIT="135ccf460c67c4b900dc10aa71c978f27d78601c"
VERSION="1.20.6"
curl -fSL -o Antigravity-reh.tar.gz \
  "https://edgedl.me.gvt1.com/edgedl/release2/j0qc3/antigravity/stable/$VERSION-$COMMIT/linux-x64/Antigravity-reh.tar.gz"
mkdir -p antigravity-reh && tar xzf Antigravity-reh.tar.gz -C antigravity-reh
```
