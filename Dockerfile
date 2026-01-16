# Use the official Node.js Alpine image for a small footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (adjust if your app uses a different port like 5000)
EXPOSE 3000

# Command to run the app in development mode
# This assumes you have a 'dev' script in your package.json
CMD ["npm", "run", "dev"]