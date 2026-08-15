import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

// Versioned file metadata (profile picture, citizenship docs). Superseded
// versions are kept with is_current=FALSE as free history — not on BaseModel,
// same append-only rationale as the history tables.
export class EmployeeDocument extends Model {
  declare id: number;
  declare employee_id: number;
  declare doc_type: 'profile_picture' | 'citizenship_front' | 'citizenship_back';
  declare filename: string;
  declare uploaded_by: number | null;
  declare uploaded_at: Date;
  declare is_current: boolean;
}

EmployeeDocument.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    doc_type: {
      type: DataTypes.ENUM('profile_picture', 'citizenship_front', 'citizenship_back'),
      allowNull: false,
    },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
    uploaded_at: { type: DataTypes.DATE, allowNull: false },
    is_current: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    modelName: 'EmployeeDocument',
    tableName: 'employee_documents',
    timestamps: false,
  }
);

export default EmployeeDocument;
