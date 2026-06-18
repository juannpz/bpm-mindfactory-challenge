FROM node:24-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ARG NEXT_PUBLIC_MOCK_AUTH=true
ARG NEXT_PUBLIC_AZURE_CLIENT_ID=
ARG NEXT_PUBLIC_AZURE_TENANT_ID=
ARG API_INTERNAL_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MOCK_AUTH=$NEXT_PUBLIC_MOCK_AUTH
ENV NEXT_PUBLIC_AZURE_CLIENT_ID=$NEXT_PUBLIC_AZURE_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_TENANT_ID=$NEXT_PUBLIC_AZURE_TENANT_ID
ENV API_INTERNAL_URL=$API_INTERNAL_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
