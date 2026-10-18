#!/bin/sh
set -eu

umask 077

private=/generated/private/jwt_private.pem
public=/generated/public/jwt_public.pem
token=/generated/internal/internal_api_token

mkdir -p \
    /generated/private \
    /generated/public \
    /generated/internal

temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT

if [ ! -e "$private" ] && [ -e "$public" ]; then
    echo "Error: public JWT key exists without private key." >&2
    exit 1
fi

if [ ! -e "$private" ]; then
    openssl genpkey \
        -algorithm RSA \
        -pkeyopt rsa_keygen_bits:2048 \
        -out "$temporary/private.pem"

    mv "$temporary/private.pem" "$private"
fi

openssl rsa \
    -in "$private" \
    -passin pass: \
    -check \
    -noout

openssl pkey \
    -in "$private" \
    -passin pass: \
    -pubout \
    -out "$temporary/public.pem"

if [ -e "$public" ]; then
    openssl pkey \
        -pubin \
        -in "$public" \
        -pubout \
        -out "$temporary/existing-public.pem"

    if ! cmp -s "$temporary/public.pem" "$temporary/existing-public.pem"; then
        echo "Error: JWT keys do not match." >&2
        exit 1
    fi
else
    mv "$temporary/public.pem" "$public"
fi

if [ ! -e "$token" ]; then
    openssl rand -hex 32 > "$temporary/internal_api_token"
    mv "$temporary/internal_api_token" "$token"
fi

if [ ! -s "$token" ]; then
    echo "Error: internal API token is empty." >&2
    exit 1
fi

chmod 755 /generated/private /generated/public /generated/internal
chmod 644 "$private" "$public" "$token"

echo "Secrets are ready."