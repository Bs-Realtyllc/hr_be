import { DataTypes, Model, ModelAttributes } from 'sequelize';

// Every table-backed model gets: id, created_at, updated_at, created_by, updated_by.
//
// created_at/updated_at are DB-defaulted (CURRENT_TIMESTAMP / ON UPDATE CURRENT_TIMESTAMP,
// see src/db/migrate_add_audit_columns_pilot.sql) — Sequelize just reads them back, it
// never computes them, hence `timestamps: false` on every model that uses this.
//
// created_by/updated_by are NOT auto-populated by Sequelize (no request context available
// at the model layer) — repositories set them explicitly from an `actorId` parameter
// threaded through from `req.user.id`, the same explicit style already used for
// `changed_by` on employee_job_history/employee_compensation_history.
//
// Append-only history tables (employee_job_history, employee_compensation_history) do NOT
// use this — they already have their own audit shape (changed_by + created_at, no
// updated_at, since a history row is never updated after insert) and forcing mutable-row
// audit columns onto them would fight that design.
// The created_at/updated_at/created_by/updated_by half of BaseModel, split out
// on its own for the handful of 1:1 tables (employee_auth, employee_profile)
// whose primary key IS the foreign key (employee_id) rather than a surrogate
// `id` — they get the audit columns but not the `id` column.
export const auditAttributes: ModelAttributes<Model> = {
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
};

export const baseAttributes: ModelAttributes<Model> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ...auditAttributes,
};

export abstract class BaseModel extends Model {
  declare id: number;
  declare created_at: Date;
  declare updated_at: Date | null;
  declare created_by: number | null;
  declare updated_by: number | null;
}
