import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Effective-dated, append-only audit trail of salary/pay-frequency changes.
// Not on BaseModel — see EmployeeJobHistory.ts for the same rationale.
export class EmployeeCompensationHistory extends Model {
  declare id: number;
  declare employee_id: number;
  declare salary: string;
  declare pay_frequency: 'monthly' | 'biweekly' | 'weekly';
  declare effective_from: string;
  declare effective_to: string | null;
  declare change_reason: string | null;
  declare changed_by: number | null;
  declare created_at: Date;
}

EmployeeCompensationHistory.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    salary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    pay_frequency: {
      type: DataTypes.ENUM('monthly', 'biweekly', 'weekly'),
      allowNull: false,
      defaultValue: 'monthly',
    },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    change_reason: { type: DataTypes.STRING(255), allowNull: true },
    changed_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'EmployeeCompensationHistory',
    tableName: 'employee_compensation_history',
    timestamps: false,
  }
);

export default EmployeeCompensationHistory;
