import { and, asc, eq, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "../config/database";
import {
  employees,
  employeeDocuments,
  departments,
  designations,
} from "../../drizzle/schema";

const docPic = alias(employeeDocuments, "doc_pic");

// Everyone who should appear on the chart: not yet joined (onboarding)
// and already left (terminated) are excluded.
// Only non-sensitive fields — this endpoint is visible to all employees.
export async function findChartMembers() {
  return db
    .select({
      id: employees.id,
      name: employees.name,
      profile_picture: docPic.filename,
      designation: designations.title,
      department_id: employees.departmentId,
      department: departments.name,
      manager_id: employees.managerId,
      status: employees.status,
    })
    .from(employees)
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(
      docPic,
      and(eq(docPic.empId, employees.id), eq(docPic.name, "profile_picture")),
    )
    .where(notInArray(employees.status, ["terminated", "onboarding"]))
    .orderBy(asc(employees.name));
}
