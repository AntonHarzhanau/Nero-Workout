<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261016231932 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE accounts.users (id UUID NOT NULL, name VARCHAR(100) NOT NULL, username VARCHAR(32) NOT NULL, email VARCHAR(254) NOT NULL, password_hash TEXT NOT NULL, role VARCHAR(16) NOT NULL, created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, PRIMARY KEY (id))');
        $this->addSql("ALTER TABLE accounts.users ADD CONSTRAINT chk_users_role CHECK (role IN ('standard', 'admin'))");
        $this->addSql('CREATE UNIQUE INDEX uniq_users_email ON accounts.users (email)');
        $this->addSql('CREATE UNIQUE INDEX uniq_users_username ON accounts.users (username)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE accounts.users');
    }
}
