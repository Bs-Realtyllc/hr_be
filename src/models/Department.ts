import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Lookup table, replacing the free-text `department` column. Not on
// BaseModel — plain reference data, no created_by/updated_by tracking.
export class Department extends Model {
  declare id: number;
  declare name: string;
  declare is_active: boolean;
  declare created_at: Date;
}

Department.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: false,
  }
);

export default Department;
