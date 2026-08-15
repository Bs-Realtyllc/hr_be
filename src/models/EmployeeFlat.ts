import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Read-only model over `employees_flat` (see
// src/db/migrate_normalize_employees_p2.sql) — a view that reproduces the
// exact pre-redesign `employees` column shape by joining employee_auth/
// employee_profile/employee_documents/employee_compensation_history/
// departments/designations back onto the slimmed `employees` row. Every read
// in employee.repository.ts goes through this instead of the underlying
// tables; every write still targets the underlying tables directly (a view
// isn't writable here — it spans a JOIN).
export class EmployeeFlat extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare secondary_email: string | null;
  declare phone: string | null;
  declare alt_phone: string | null;
  declare discord_username: string | null;
  declare emergency_contact: string | null;
  declare dob: string | null;
  declare bio: string | null;
  declare address: string | null;
  declare profile_picture: string | null;
  declare citizenship_front: string | null;
  declare citizenship_back: string | null;
  declare designation: string | null;
  declare designation_id: number | null;
  declare department: string | null;
  declare department_id: number | null;
  declare manager_id: number | null;
  declare start_date: string | null;
  declare timezone: string;
  declare work_hours: string;
  declare tech_stack: string[] | null;
  declare qualifications: string[] | null;
  declare role: 'admin' | 'lead' | 'employee';
  declare password_hash: string | null;
  declare salary: string | null;
  declare pay_frequency: 'monthly' | 'biweekly' | 'weekly' | null;
  declare is_active: boolean;
  declare status: string;
  declare termination_date: string | null;
  declare termination_reason: string | null;
  declare created_at: Date;
  declare leave_policy_accepted: boolean;
  declare leave_policy_accepted_at: Date | null;
}

EmployeeFlat.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: DataTypes.STRING(100),
    email: DataTypes.STRING(150),
    secondary_email: DataTypes.STRING(150),
    phone: DataTypes.STRING(20),
    alt_phone: DataTypes.STRING(20),
    discord_username: DataTypes.STRING(100),
    emergency_contact: DataTypes.STRING(150),
    dob: DataTypes.DATEONLY,
    bio: DataTypes.TEXT,
    address: DataTypes.TEXT,
    profile_picture: DataTypes.STRING(255),
    citizenship_front: DataTypes.STRING(255),
    citizenship_back: DataTypes.STRING(255),
    designation: DataTypes.STRING(100),
    designation_id: DataTypes.INTEGER,
    department: DataTypes.STRING(100),
    department_id: DataTypes.INTEGER,
    manager_id: DataTypes.INTEGER,
    start_date: DataTypes.DATEONLY,
    timezone: DataTypes.STRING(50),
    work_hours: DataTypes.STRING(50),
    tech_stack: DataTypes.JSON,
    qualifications: DataTypes.JSON,
    role: DataTypes.ENUM('admin', 'lead', 'employee'),
    password_hash: DataTypes.STRING(255),
    salary: DataTypes.DECIMAL(10, 2),
    pay_frequency: DataTypes.ENUM('monthly', 'biweekly', 'weekly'),
    is_active: DataTypes.BOOLEAN,
    status: DataTypes.STRING(20),
    termination_date: DataTypes.DATEONLY,
    termination_reason: DataTypes.STRING(255),
    created_at: DataTypes.DATE,
    leave_policy_accepted: DataTypes.BOOLEAN,
    leave_policy_accepted_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'EmployeeFlat',
    tableName: 'employees_flat',
    timestamps: false,
  }
);

// Self-referential — lets the repository fetch `manager.name` in one query
// the same way the old hand-written `LEFT JOIN employees_flat m` did.
EmployeeFlat.belongsTo(EmployeeFlat, { as: 'manager', foreignKey: 'manager_id' });

export default EmployeeFlat;
