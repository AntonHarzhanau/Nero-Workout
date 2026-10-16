<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20261016235001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE accounts.sessions (id UUID NOT NULL, refresh_token_hash CHAR(64) NOT NULL, expires_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, revoked_at TIMESTAMP(0) WITH TIME ZONE DEFAULT NULL, created_at TIMESTAMP(0) WITH TIME ZONE NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_sessions_refresh_token_hash ON accounts.sessions (refresh_token_hash)');
        $this->addSql('CREATE INDEX IDX_246334E0A76ED395 ON accounts.sessions (user_id)');
        $this->addSql('ALTER TABLE accounts.sessions ADD CONSTRAINT FK_246334E0A76ED395 FOREIGN KEY (user_id) REFERENCES accounts.users (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE accounts.sessions DROP CONSTRAINT FK_246334E0A76ED395');
        $this->addSql('DROP TABLE accounts.sessions');
    }
}
