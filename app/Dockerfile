FROM oven/bun as builder
LABEL stage=builder
WORKDIR /app
COPY . .
RUN bun i

RUN bun --bun run build

FROM nginx:alpine as runtime
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]