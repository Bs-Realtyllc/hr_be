import { Sequelize } from 'sequelize';

// New ORM-backed connection, used only by domains converted to Sequelize
// (currently: Employees, Auth). Everything else still goes through the
// legacy mysql2 pool in src/db/index.js until it's converted too — both
// point at the same database, so they're safe to run side by side.
export const sequelize = new Sequelize(
  process.env.DB_NAME || 'hr_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    define: {
      underscored: true,
      timestamps: false, // each model declares its own timestamp columns explicitly — see BaseModel
    },
    pool: {
      max: 10,
      idle: 10000,
    },
  }
);

export default sequelize;
