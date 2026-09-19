-- src/db/migrations/migrate_add_gantt_chart.sql
CREATE TABLE IF NOT EXISTS gantt_tasks (
  id              BIGINT AUTO_INCREMENT NOT NULL,
  name            VARCHAR(255)          NOT NULL,
  start_datetime  DATETIME              NOT NULL,
  end_datetime    DATETIME              NOT NULL,
  status          ENUM('scheduled','cancelled') NOT NULL DEFAULT 'scheduled',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- src/db/migrations/migrate_add_gantt_chart.sql
ALTER TABLE gantt_tasks 
  ADD COLUMN created_by INT,
  ADD COLUMN parent_id BIGINT,
  ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES gantt_tasks (id);

-- src/db/migrations/migrate_add_gantt_chart.sql
CREATE TABLE IF NOT EXISTS gantt_projects (
  id              BIGINT AUTO_INCREMENT NOT NULL,
  name            VARCHAR(255)          NOT NULL,
  start_datetime  DATETIME              NOT NULL,
  end_datetime    DATETIME              NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- src/db/migrations/migrate_add_gantt_chart.sql
CREATE TABLE IF NOT EXISTS gantt_task_dependencies (
  task_id BIGINT NOT NULL,
  dependent_task_id BIGINT NOT NULL,
  PRIMARY KEY (task_id, dependent_task_id),
  FOREIGN KEY (task_id) REFERENCES gantt_tasks (id),
  FOREIGN KEY (dependent_task_id) REFERENCES gantt_tasks (id)
);

-- src/db/migrations/migrate_add_gantt_chart.sql
CREATE TABLE IF NOT EXISTS gantt_project_dependencies (
  project_id BIGINT NOT NULL,
  dependent_project_id BIGINT NOT NULL,
  PRIMARY KEY (project_id, dependent_project_id),
  FOREIGN KEY (project_id) REFERENCES gantt_projects (id),
  FOREIGN KEY (dependent_project_id) REFERENCES gantt_projects (id)
);
