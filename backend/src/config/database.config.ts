import type { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

/*
 * Schema creation:
 * - local/dev: `synchronize` stays on so the schema tracks the entities.
 * - production: it is off by default (never let TypeORM mutate a live schema).
 *   Because this project has no migrations yet, the first production deploy
 *   needs the schema created once. Set `DB_SYNCHRONIZE=true` for that single
 *   deploy to auto-create the tables, then remove it and rely on migrations.
 */
const isProduction = process.env.NODE_ENV === "production";

const synchronize = process.env.DB_SYNCHRONIZE
  ? process.env.DB_SYNCHRONIZE === "true"
  : !isProduction;

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: "postgres",
  url: config.get<string>("DATABASE_URL"),
  autoLoadEntities: true,
  synchronize,
  logging: !isProduction,
});
