import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { BaseModel, baseAttributes } from './BaseModel';

export class PasswordResetToken extends BaseModel {
  declare employee_id: number;
  declare token: string;
  declare expires_at: Date;
  declare used_at: Date | null;
}

PasswordResetToken.init(
  {
    ...baseAttributes,
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    timestamps: false,
  }
);

export default PasswordResetToken;
