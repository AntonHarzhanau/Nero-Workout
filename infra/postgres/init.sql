\set ON_ERROR_STOP on

\getenv db_name POSTGRES_DB

\getenv account_user ACCOUNT_DB_USER
\getenv account_password ACCOUNT_DB_PASSWORD

\getenv workout_user WORKOUT_DB_USER
\getenv workout_password WORKOUT_DB_PASSWORD

BEGIN;

CREATE ROLE :"account_user"
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'account_password';

CREATE ROLE :"workout_user"
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'workout_password';

CREATE SCHEMA accounts AUTHORIZATION :"account_user";
CREATE SCHEMA workouts AUTHORIZATION :"workout_user";

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

ALTER ROLE :"account_user" IN DATABASE :"db_name"
    SET search_path = accounts, public;

ALTER ROLE :"workout_user" IN DATABASE :"db_name"
    SET search_path = workouts, public;

COMMIT;
