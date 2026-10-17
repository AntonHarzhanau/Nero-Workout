FROM dunglas/frankenphp:1-php8.4 AS base

WORKDIR /app

RUN install-php-extensions pdo_pgsql intl opcache zip

ENV SERVER_NAME=":8080"



FROM base AS dependencies

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --no-dev --classmap-authoritative



FROM base AS runtime

ENV APP_ENV=prod \
    APP_DEBUG=0

COPY --from=dependencies /app ./

RUN echo "APP_ENV=prod" > .env \
    && DATABASE_URL="postgresql://build:build@localhost:5432/build?serverVersion=17&charset=utf8" \
       DEFAULT_URI="http://localhost" \
       php bin/console cache:warmup

RUN useradd --system --no-create-home --shell /usr/sbin/nologin app \
    && setcap -r /usr/local/bin/frankenphp \
    && chown -R app:app var /data/caddy /config/caddy

USER app

EXPOSE 8080

CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile", "--adapter", "caddyfile"]
