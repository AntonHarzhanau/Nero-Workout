\set ON_ERROR_STOP on

\getenv account_password ACCOUNT_DB_PASSWORD
\getenv workout_password WORKOUT_DB_PASSWORD
\getenv statistics_password STATISTICS_DB_PASSWORD

CREATE ROLE account_app
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'account_password';

CREATE ROLE workout_app
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'workout_password';

CREATE ROLE statistics_app
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'statistics_password';

CREATE SCHEMA accounts AUTHORIZATION account_app;
CREATE SCHEMA workouts AUTHORIZATION workout_app;
CREATE SCHEMA statistics AUTHORIZATION statistics_app;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

ALTER ROLE account_app IN DATABASE nero
    SET search_path = accounts, public;

ALTER ROLE workout_app IN DATABASE nero
    SET search_path = workouts, public;

ALTER ROLE statistics_app IN DATABASE nero
    SET search_path = statistics, public;