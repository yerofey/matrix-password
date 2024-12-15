# Use Node.js LTS as the base image
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and lock file for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application files
COPY . .

# Expose the application's port
EXPOSE 3001

# Start the Node.js application
CMD ["node", "index.js"]
