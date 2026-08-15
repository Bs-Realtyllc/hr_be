import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { auditAttributes } from './BaseModel';

// 1:1 with employees — self-service PII. Primary key IS employee_id — see
// EmployeeAuth.ts for why this doesn't use the full BaseModel.
export class EmployeeProfile extends Model {
  declare employee_id: number;
  declare phone: string | null;
  declare alt_phone: string | null;
  declare discord_username: string | null;
  declare emergency_contact: string | null;
  declare dob: string | null;
  declare bio: string | null;
  declare address: string | null;
  declare timezone: string;
  declare work_hours: string;
  declare leave_policy_accepted: boolean;
  declare leave_policy_accepted_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date | null;
  declare created_by: number | null;
  declare updated_by: number | null;
}

EmployeeProfile.init(
  {
    employee_id: { type: DataTypes.INTEGER, primaryKey: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    alt_phone: { type: DataTypes.STRING(20), allowNull: true },
    discord_username: { type: DataTypes.STRING(100), allowNull: true, unique: true },
    emergency_contact: { type: DataTypes.STRING(150), allowNull: true },
    dob: { type: DataTypes.DATEONLY, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    timezone: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'UTC' },
    work_hours: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '9 AM - 5 PM' },
    leave_policy_accepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    leave_policy_accepted_at: { type: DataTypes.DATE, allowNull: true },
    ...auditAttributes,
  },
  {
    sequelize,
    modelName: 'EmployeeProfile',
    tableName: 'employee_profile',
    timestamps: false,
  }
);

export default EmployeeProfile;
