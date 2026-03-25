---
name: Always verify official sources
description: User corrected APT repo config to use official commands from antigravity.google — always verify and use official sources
type: feedback
---

Always use official installation sources and verify them before writing to Dockerfile or scripts.

**Why:** User caught that the APT repo setup I found from a third-party blog was slightly different from the official one at antigravity.google/download/linux. The official version uses `/etc/apt/keyrings/` path and different .list format.

**How to apply:** When writing installation steps, prefer the user-provided or official documentation commands over blog/tutorial sources. If unsure, ask the user to verify against official docs before proceeding.
