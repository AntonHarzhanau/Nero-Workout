FROM dunglas/frankenphp:1.13.4-php8.4.27-bookworm@sha256:81ba601edfb650d1df63f54dafdedc021d9d1fb37517850a4e93278ab19cced1 AS base

WORKDIR /app

RUN install-php-extensions pdo_pgsql intl zip

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf '%s\n' \
        'display_errors=Off' \
        'display_startup_errors=Off' \
        'log_errors=On' \
        'expose_php=Off' \
        > "$PHP_INI_DIR/conf.d/zz-production.ini"

ENV SERVER_NAME=":8080"



FROM base AS dependencies

COPY --from=composer:2.10.3@sha256:b6dcd72ca98fa19d0e5b8476de179859704891fad06dd9e0b96833d4c430a5fc /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock symfony.lock ./
RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --no-dev --classmap-authoritative



FROM base AS runtime

ENV APP_ENV=prod \
    APP_DEBUG=0

COPY --from=dependencies /app ./

RUN echo "APP_ENV=prod" > .env \
    &&  DB_HOST=127.0.0.1 \
        DB_PORT=5432 \
        DB_NAME=build \
        DB_USER=build \
        DB_PASSWORD=build \
        DEFAULT_URI=http://localhost \
        php bin/console cache:warmup

RUN useradd --system --no-create-home --shell /usr/sbin/nologin app \
    && setcap -r /usr/local/bin/frankenphp \
    && chown -R app:app var /data/caddy /config/caddy

USER app

EXPOSE 8080

CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile", "--adapter", "caddyfile"]
