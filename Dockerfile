# Multi-stage Dockerfile for ClipForge
FROM node:20-bookworm-slim AS base

# Install FFmpeg and FFprobe
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build Client
FROM base AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build Server
FROM base AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV UPLOAD_DIR=/app/uploads
ENV OUTPUT_DIR=/app/outputs
ENV THUMBNAIL_DIR=/app/thumbnails

# Create storage directories
RUN mkdir -p /app/uploads /app/outputs /app/thumbnails

COPY server/package*.json ./
RUN npm install --only=production

COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
