FROM alpine:3.22

RUN apk add --no-cache openssl

COPY generate.sh /usr/local/bin/generate-secrets

ENTRYPOINT ["sh", "/usr/local/bin/generate-secrets"]