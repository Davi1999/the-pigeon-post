FROM node:22

WORKDIR /the-pigeon-post

# Copy all package.json and lockfiles from root + workspaces
COPY package.json package-lock.json ./

# Copy entire repo (including source code)
COPY . .

# Install all dependencies for the monorepo
RUN npm install -g turbo && npm install

RUN npm install @next/swc-linux-x64-gnu --save-dev

# Run the build
RUN turbo run build

# Generate Prisma client
RUN npx prisma generate --data-proxy

# Disable native SWC to force WASM fallback (avoids your SWC errors)
ENV NEXT_DISABLE_SWC_NATIVE=true

EXPOSE 3000
EXPOSE 3001

# Run the development server
CMD ["npm", "run", "dev"]
