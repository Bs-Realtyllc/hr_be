---
name: src/models/Employee.ts
slug: src/models/Employee.ts
children:
- src/models/Employee.ts
type: sql
---
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  gender VARCHAR(10),
  role VARCHAR(50) NOT NULL,
  joining_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  termination_date DATE,
  termination_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  created_by INT,
  updated_by INT,
  leave_policy_accepted BOOLEAN DEFAULT FALSE,
  leave_policy_accepted_at TIMESTAMP
);
