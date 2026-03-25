FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:0 \
    DISPLAY_WIDTH=1920 \
    DISPLAY_HEIGHT=1080 \
    VNC_PASSWORD=antigravity

# Base packages: VNC stack + deps for Antigravity
RUN apt-get update && apt-get install -y --no-install-recommends \
    # VNC / display
    xvfb x11vnc fluxbox xterm \
    # noVNC
    novnc websockify \
    # Process manager
    supervisor \
    # Antigravity deps
    curl gpg ca-certificates \
    libgtk-3-0 libnotify4 libnss3 libxss1 libsecret-1-0 \
    libgbm1 libasound2 libdrm2 libatk-bridge2.0-0 \
    fonts-noto-cjk fonts-noto-color-emoji \
    # Utilities
    net-tools dbus dbus-x11 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Antigravity from official APT repo
# Ref: https://antigravity.google/download/linux
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://us-central1-apt.pkg.dev/doc/repo-signing-key.gpg \
      | gpg --dearmor --yes -o /etc/apt/keyrings/antigravity-repo-key.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/antigravity-repo-key.gpg] https://us-central1-apt.pkg.dev/projects/antigravity-auto-updater-dev/ antigravity-debian main" \
      > /etc/apt/sources.list.d/antigravity.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends antigravity \
    && rm -rf /var/lib/apt/lists/*

# Setup noVNC
RUN ln -sf /usr/share/novnc/vnc_lite.html /usr/share/novnc/index.html

# Setup VNC password
RUN mkdir -p /root/.vnc && \
    x11vnc -storepasswd "${VNC_PASSWORD}" /root/.vnc/passwd

# Copy configs
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start-antigravity.sh /opt/scripts/start-antigravity.sh
RUN chmod +x /opt/scripts/start-antigravity.sh

# Data persistence
VOLUME ["/root/.config/antigravity"]

# Ports: 6080=noVNC(browser), 5900=VNC(native client)
EXPOSE 6080 5900

CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
