# e2b.Dockerfile
FROM node:21-slim

# Basic tools (no cache kept)
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /home/user/app

# Scaffold the app WITHOUT installing deps (keeps layers tiny)
# --no-install prevents node_modules from ever being created
RUN npx --yes create-next-app@15.3.3 . \
  --yes \
  --no-git \
  --no-install

# Initialize shadcn WITHOUT installing deps (we’ll still strip if it does)
# Some versions don’t honor skip flags consistently, so we hard-clean after.
RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force || true \
  && npx --yes shadcn@2.6.3 add --all --yes || true \
  && rm -rf node_modules .next .cache \
  && npm cache clean --force || true \
  && rm -rf /root/.npm /root/.cache /usr/local/share/.cache

# Default workdir where E2B expects files
WORKDIR /home/user

# Move the scaffolded app to /home/user (no node_modules present)
RUN mkdir -p /home/user/nextjs-app && \
    shopt -s dotglob || true; \
    mv /home/user/app/* /home/user/nextjs-app/ 2>/dev/null || true; \
    rm -rf /home/user/app

# Keep your compile script
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh
