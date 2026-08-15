import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { BaseModel, baseAttributes } from './BaseModel';

// Core identity + current-state pointer columns only — see
// src/db/migrate_normalize_employees_p3.sql for what moved off this table onto
// employee_auth/employee_profile/employee_compensation_history/employee_documents,
// and src/models/EmployeeFlat.ts for the read-side view that joins it all back
// together in the pre-redesign shape.
export class Employee extends BaseModel {
  declare name: string;
  declare email: string;
  declare secondary_email: string | null;
  declare manager_id: number | null;
  declare start_date: string | null;
  declare tech_stack: string[] | null;
  declare qualifications: string[] | null;
  declare designation_id: number | null;
  declare department_id: number | null;
  declare is_active: boolean;
  declare status: 'onboarding' | 'active' | 'on_leave' | 'probation' | 'terminated';
  declare termination_date: string | null;
  declare termination_reason: string | null;
}

Employee.init(
  {
    ...baseAttributes,
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    secondary_email: { type: DataTypes.STRING(150), allowNull: true, unique: true },
    manager_id: { type: DataTypes.INTEGER, allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    tech_stack: { type: DataTypes.JSON, allowNull: true },
    qualifications: { type: DataTypes.JSON, allowNull: true },
    designation_id: { type: DataTypes.INTEGER, allowNull: true },
    department_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    status: {
      type: DataTypes.ENUM('onboarding', 'active', 'on_leave', 'probation', 'terminated'),
      allowNull: false,
      defaultValue: 'active',
    },
    termination_date: { type: DataTypes.DATEONLY, allowNull: true },
    termination_reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    timestamps: false,
  }
);

export default Employee;
