FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/test-framework/package.json ./packages/test-framework/

# Install dependencies efficiently in workspace mode
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --workspace-root

# Copy project files
COPY tsconfig.json ./
COPY packages/test-framework ./packages/test-framework

# Install Playwright browsers
RUN pnpm --filter test-framework exec npx playwright install chromium

# Set up environment
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# The command will be provided by docker-compose
