# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and tsconfig, then compile to ./dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Cloud Run injects PORT at runtime; default to 8080 for local docker run
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
