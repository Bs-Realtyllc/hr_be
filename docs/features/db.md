```sql
CREATE TABLE holidays (
  id              SERIAL PRIMARY KEY,
  name             VARCHAR(255)                  NOT NULL,
  holiday_date     DATE                           NOT NULL,
  year             INT,
  message          TEXT NULL,
  FOREIGN KEY (year) REFERENCES years(id)
);

CREATE TABLE policies (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)                  NOT NULL,
  description     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_at) REFERENCES created_at_index(id),
  FOREIGN KEY (updated_at) REFERENCES updated_at_index(id)
);

ALTER TABLE policies
  ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
```
