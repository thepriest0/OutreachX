# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Expose port
EXPOSE 10000

# Start the application using tsx
CMD ["npm", "start"]
