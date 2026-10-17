\set ON_ERROR_STOP on

\getenv account_user ACCOUNT_DB_USER
\getenv account_password ACCOUNT_DB_PASSWORD

\getenv workout_user WORKOUT_DB_USER
\getenv workout_password WORKOUT_DB_PASSWORD

\getenv statistics_user STATISTICS_DB_USER
\getenv statistics_password STATISTICS_DB_PASSWORD

CREATE ROLE :"account_user"
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'account_password';

CREATE ROLE :"workout_user"
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'workout_password';

CREATE ROLE :"statistics_user"
    LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
    PASSWORD :'statistics_password';

CREATE SCHEMA accounts AUTHORIZATION :"account_user";
CREATE SCHEMA workouts AUTHORIZATION :"workout_user";
CREATE SCHEMA statistics AUTHORIZATION :"statistics_user";

REVOKE CREATE ON SCHEMA public FROM PUBLIC;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

ALTER ROLE :"account_user" IN DATABASE nero
    SET search_path = accounts, public;

ALTER ROLE :"workout_user" IN DATABASE nero
    SET search_path = workouts, public;

ALTER ROLE :"statistics_user" IN DATABASE nero
    SET search_path = statistics, public;