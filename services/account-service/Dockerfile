FROM dunglas/frankenphp:1-php8.4 AS base

WORKDIR /app

RUN install-php-extensions pdo_pgsql intl opcache zip

ENV SERVER_NAME=":8080"

EXPOSE 8080


FROM base AS dev

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV APP_ENV=dev