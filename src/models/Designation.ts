import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Lookup table, replacing the free-text `designation` column. Not on
// BaseModel — plain reference data, no created_by/updated_by tracking.
export class Designation extends Model {
  declare id: number;
  declare title: string;
  declare department_id: number | null;
  declare is_active: boolean;
  declare created_at: Date;
}

Designation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    department_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Designation',
    tableName: 'designations',
    timestamps: false,
  }
);

export default Designation;
