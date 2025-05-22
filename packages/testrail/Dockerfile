FROM node:20-slim

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/testrail/package.json ./packages/testrail/
COPY packages/test-framework/package.json ./packages/test-framework/

# Install dependencies efficiently in workspace mode
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --workspace-root

# Copy project files
COPY tsconfig.json ./
COPY packages/testrail ./packages/testrail
COPY packages/test-framework ./packages/test-framework

# Set up environment
ENV TESTRAIL_HOST=${TESTRAIL_HOST:-"https://testrail.example.com"}

# The command will be provided by docker-compose
