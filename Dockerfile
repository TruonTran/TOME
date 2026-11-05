# Image chạy API (NestJS) cho Railway / VPS. Build từ GỐC repo (không đặt Root Directory).
FROM node:22-slim

# Prisma cần OpenSSL
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# cài thư viện trước để Docker cache được
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --ignore-scripts

COPY apps/api apps/api
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
  && npm run build -w apps/api

ENV NODE_ENV=production
WORKDIR /app/apps/api

# mỗi lần khởi động: áp migration mới (nếu có) rồi chạy API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
