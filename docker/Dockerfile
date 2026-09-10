FROM node:20-slim AS builder
WORKDIR /app
COPY packages/core/package.json packages/core/package-lock.json* ./
COPY packages/cli/package.json packages/cli/package-lock.json* ./
COPY package.json package-lock.json ./
RUN npm ci --workspace=@opentrustbench/core --workspace=@opentrustbench/cli
COPY packages/core/ ./packages/core/
COPY packages/cli/ ./packages/cli/
COPY tsconfig.base.json ./
RUN npm run build

FROM node:20-slim AS runtime
RUN npm install -g @opentrustbench/cli
WORKDIR /workspace
ENTRYPOINT ["opentrustbench"]
CMD ["--help"]
