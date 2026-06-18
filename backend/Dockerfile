FROM node:20-alpine

# Run as non-root user for security
RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup \
    && apk add --no-cache su-exec

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R appuser:appgroup /app

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
