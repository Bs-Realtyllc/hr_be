import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { auditAttributes } from './BaseModel';

// 1:1 with employees — security boundary (password_hash, role). Primary key
// IS employee_id, not a surrogate id, so this uses auditAttributes (not the
// full BaseModel) — see BaseModel.ts.
export class EmployeeAuth extends Model {
  declare employee_id: number;
  declare password_hash: string | null;
  declare role: 'admin' | 'lead' | 'employee';
  declare last_login_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date | null;
  declare created_by: number | null;
  declare updated_by: number | null;
}

EmployeeAuth.init(
  {
    employee_id: { type: DataTypes.INTEGER, primaryKey: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    role: {
      type: DataTypes.ENUM('admin', 'lead', 'employee'),
      allowNull: false,
      defaultValue: 'employee',
    },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    ...auditAttributes,
  },
  {
    sequelize,
    modelName: 'EmployeeAuth',
    tableName: 'employee_auth',
    timestamps: false,
  }
);

export default EmployeeAuth;
