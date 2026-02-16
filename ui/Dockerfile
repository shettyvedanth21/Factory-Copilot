FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build production app
RUN npm run build

# Expose preview server port
EXPOSE 5173

# Run production preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]