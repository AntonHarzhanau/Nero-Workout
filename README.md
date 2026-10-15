cp .env.example .env
docker compose up -d --build --wait postgres

cd services/account-service
cp .env.example .env.dev
composer install

php bin/console dbal:run-sql \
  'SELECT current_user, current_database(), current_schema()'