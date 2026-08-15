import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Effective-dated, append-only audit trail of designation/department/manager
// changes. Not on BaseModel — a history row is never updated after insert
// (effective_to is set once, to close it out), and it already carries its own
// audit field (changed_by) rather than created_by/updated_by.
export class EmployeeJobHistory extends Model {
  declare id: number;
  declare employee_id: number;
  declare designation_id: number | null;
  declare department_id: number | null;
  declare manager_id: number | null;
  declare effective_from: string;
  declare effective_to: string | null;
  declare change_reason: string | null;
  declare changed_by: number | null;
  declare created_at: Date;
}

EmployeeJobHistory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    designation_id: { type: DataTypes.INTEGER, allowNull: true },
    department_id: { type: DataTypes.INTEGER, allowNull: true },
    manager_id: { type: DataTypes.INTEGER, allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    change_reason: { type: DataTypes.STRING(255), allowNull: true },
    changed_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'EmployeeJobHistory',
    tableName: 'employee_job_history',
    timestamps: false,
  }
);

export default EmployeeJobHistory;
