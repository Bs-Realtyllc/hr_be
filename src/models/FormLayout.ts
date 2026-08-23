// db/schema.ts
import { mysqlTable, serial, json, int, varchar } from "drizzle-orm/mysql-core";


// Define the shape of your JSON data
// interface FormData {
//   // id: number;
//   data: JSON;
// }

export const formsLayout = mysqlTable('forms_layout', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  data: json('data').notNull(),
});
