# ---- Build Stage ----
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build Next.js app
RUN npm run build

# ---- Run Stage ----
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set environment for production
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app ./

# Expose port
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]