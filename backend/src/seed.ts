import "dotenv/config";
import * as argon2 from "argon2";
import { DataSource } from "typeorm";
import { PasswordResetTokenEntity } from "./auth/authentication/entities/password-reset-token.entity";
import { RefreshTokenEntity } from "./auth/authentication/entities/refresh-token.entity";
import { Role } from "./auth/authorization/enum/roles.enum";
import { DocumentFileEntity } from "./features/document/document-file/entities/document-file.entity";
import { ExtractedDocumentQueueEntity } from "./features/document/extracted-document-queue/entities/extracted-document-queue.entity";
import { IncomingDocumentStatusHistoryEntity } from "./features/document/incoming/entities/incoming-document-status-history-entity";
import { IncomingDocumentEntity } from "./features/document/incoming/entities/incoming-document-entity";
import { OutgoingDocumentEntity } from "./features/document/outgoing/entities/outgoing-document-entity";
import { UserManagementPermissionsEntity } from "./features/permissions/entities/user-management-permissions-entity";
import { UserPermissionsEntity } from "./features/permissions/entities/user-permissions-entity";
import { DivisionEntity } from "./features/user/entities/division.entity";
import { RoleEntity } from "./features/user/entities/role.entity";
import { UserEntity } from "./features/user/entities/user.entity";

/*
 * Seed the static data an empty database needs before anyone can log in:
 *
 *   1. the four role rows referenced by `users.role_id` (FK, onDelete RESTRICT)
 *   2. one active SuperAdmin, since user creation itself requires an
 *      authenticated SuperAdmin (no public registration endpoint).
 *
 * Safe to run more than once: roles are upserted by id and the SuperAdmin is
 * only created when that email does not already exist.
 *
 * Usage (from the backend directory):
 *   SEED_SUPERADMIN_EMAIL=you@example.com SEED_SUPERADMIN_PASSWORD=secret npm run seed
 */

/*
 * Role names are the raw snake_case strings the API returns as `user.role.name`
 * and the frontend maps to display labels (see frontend mapRole.ts), so they
 * must match that convention.
 */
const ROLE_NAMES: Record<number, string> = {
  [Role.SuperAdmin]: "super_admin",
  [Role.Admin]: "admin",
  [Role.ReceiverOfficer]: "receiver_officer",
  [Role.Division]: "division",
};

const dataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [
    PasswordResetTokenEntity,
    RefreshTokenEntity,
    DocumentFileEntity,
    ExtractedDocumentQueueEntity,
    IncomingDocumentStatusHistoryEntity,
    IncomingDocumentEntity,
    OutgoingDocumentEntity,
    UserManagementPermissionsEntity,
    UserPermissionsEntity,
    DivisionEntity,
    RoleEntity,
    UserEntity,
  ],
  synchronize: false,
});

async function seedRoles(dataSource: DataSource): Promise<void> {
  const rows = Object.entries(ROLE_NAMES).map(
    ([id, name]) => [Number(id), name] as const,
  );

  /*
   * `roles.id` is a generated primary key, so TypeORM's upsert would ignore the
   * explicit ids we need and let the sequence assign new ones. A raw
   * INSERT ... ON CONFLICT (id) honors the fixed ids and stays re-runnable.
   */
  for (const [id, name] of rows) {
    await dataSource.query(
      `INSERT INTO roles (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [id, name],
    );
  }

  /*
   * Advance the sequence past the highest seeded id so any future
   * auto-generated insert does not collide (the app never creates roles today,
   * but this keeps things sane).
   */
  await dataSource.query(
    "SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT MAX(id) FROM roles))",
  );

  console.log(`Seeded roles: ${rows.map(([id, name]) => `${id}=${name}`).join(", ")}`);
}

async function seedSuperAdmin(dataSource: DataSource): Promise<void> {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD not set; " +
        "skipping SuperAdmin creation.",
    );
    return;
  }

  const userRepository = dataSource.getRepository(UserEntity);

  const existing = await userRepository.findOne({ where: { email } });

  if (existing) {
    console.log(`SuperAdmin <${email}> already exists; skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(password);

  await userRepository.save(
    userRepository.create({
      role_id: Role.SuperAdmin as unknown as string,
      full_name:
        process.env.SEED_SUPERADMIN_FULL_NAME ?? "Super Admin",
      position: process.env.SEED_SUPERADMIN_POSITION ?? null,
      email,
      password: passwordHash,
      is_active: true,
    }),
  );

  console.log(`Created SuperAdmin <${email}>.`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  await dataSource.initialize();

  try {
    await seedRoles(dataSource);
    await seedSuperAdmin(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
