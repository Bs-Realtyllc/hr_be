import { sequelize } from '../config/database';
import { Employee } from './Employee';
import { EmployeeAuth } from './EmployeeAuth';
import { EmployeeProfile } from './EmployeeProfile';
import { EmployeeJobHistory } from './EmployeeJobHistory';
import { EmployeeCompensationHistory } from './EmployeeCompensationHistory';
import { EmployeeDocument } from './EmployeeDocument';
import { Department } from './Department';
import { Designation } from './Designation';
import { EmployeeFlat } from './EmployeeFlat';
import { PasswordResetToken } from './PasswordResetToken';

// Associations — mirror the FKs already declared in
// src/db/migrate_normalize_employees_p1.sql.
Employee.hasOne(EmployeeAuth, { foreignKey: 'employee_id' });
EmployeeAuth.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasOne(EmployeeProfile, { foreignKey: 'employee_id' });
EmployeeProfile.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(EmployeeJobHistory, { foreignKey: 'employee_id' });
EmployeeJobHistory.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(EmployeeCompensationHistory, { foreignKey: 'employee_id' });
EmployeeCompensationHistory.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.hasMany(EmployeeDocument, { foreignKey: 'employee_id' });
EmployeeDocument.belongsTo(Employee, { foreignKey: 'employee_id' });

Employee.belongsTo(Department, { foreignKey: 'department_id' });
Employee.belongsTo(Designation, { foreignKey: 'designation_id' });
Designation.belongsTo(Department, { foreignKey: 'department_id' });

Employee.belongsTo(Employee, { as: 'manager', foreignKey: 'manager_id' });

Employee.hasMany(PasswordResetToken, { foreignKey: 'employee_id' });
PasswordResetToken.belongsTo(Employee, { foreignKey: 'employee_id' });

export {
  sequelize,
  Employee,
  EmployeeAuth,
  EmployeeProfile,
  EmployeeJobHistory,
  EmployeeCompensationHistory,
  EmployeeDocument,
  Department,
  Designation,
  EmployeeFlat,
  PasswordResetToken,
};
