# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Copy all dependencies from builder (includes .prisma/client generated above)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema (needed for migrations)
COPY --from=builder /app/prisma ./prisma

# Copy compiled application
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
