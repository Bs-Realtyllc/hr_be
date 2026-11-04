import { mysqlTable, primaryKey, bigint, varchar, smallint, int, timestamp, index, foreignKey, mysqlEnum, date, text, unique, decimal, tinyint, boolean, json, datetime, year } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accessLog = mysqlTable("access_log", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	traceId: varchar("trace_id", { length: 36 }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }),
	endpoint: varchar({ length: 255 }).notNull(),
	method: varchar({ length: 10 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	responseStatus: smallint("response_status").notNull(),
	responseDurationMs: int("response_duration_ms"),
	userAgent: varchar("user_agent", { length: 500 }),
	requestTimestamp: timestamp("request_timestamp", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "access_log_id"}),
]);
export type AccessLog = typeof accessLog.$inferSelect;
export type NewAccessLog = typeof accessLog.$inferInsert;

export const cultureEvents = mysqlTable("culture_events", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 200 }).notNull(),
	eventType: mysqlEnum("event_type", ['birthday','anniversary','team_event','milestone']).notNull(),
	employeeId: int("employee_id").references(() => employees.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	description: text(),
	slackNotified: boolean("slack_notified").default(false),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("idx_culture_events_date").on(table.eventDate),
	primaryKey({ columns: [table.id], name: "culture_events_id"}),
]);
export type CultureEvent = typeof cultureEvents.$inferSelect;
export type NewCultureEvent = typeof cultureEvents.$inferInsert;

export const departments = mysqlTable("departments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "departments_id"}),
	unique("name").on(table.name),
]);
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export const designations = mysqlTable("designations", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 100 }).notNull(),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("department_id").on(table.departmentId),
	primaryKey({ columns: [table.id], name: "designations_id"}),
	unique("title").on(table.title),
]);
export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;

export const emailSettings = mysqlTable("email_settings", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	smtpHost: varchar("smtp_host", { length: 255 }).default('smtp.gmail.com').notNull(),
	smtpPort: int("smtp_port").default(587).notNull(),
	smtpUser: varchar("smtp_user", { length: 255 }).notNull(),
	smtpPass: varchar("smtp_pass", { length: 255 }).notNull(),
	smtpFrom: varchar("smtp_from", { length: 255 }),
	defaultTo: text("default_to"),
	defaultCc: text("default_cc"),
	defaultBcc: text("default_bcc"),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "email_settings_id"}),
	unique("employee_id").on(table.employeeId),
]);
export type EmailSettingsRow = typeof emailSettings.$inferSelect;
export type NewEmailSettings = typeof emailSettings.$inferInsert;

export const employeeClockPauses = mysqlTable("employee_clock_pauses", {
	id: int().autoincrement().notNull(),
	clockId: int("clock_id").notNull().references(() => employeeDailyClock.id, { onDelete: "cascade" } ),
	pause: timestamp({ mode: 'date' }).defaultNow(),
	resume: timestamp({ mode: 'date' }),
	reason: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("clock_id").on(table.clockId),
	primaryKey({ columns: [table.id], name: "employee_clock_pauses_id"}),
]);

export const employeeCompensationHistory = mysqlTable("employee_compensation_history", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	salary: decimal({ precision: 10, scale: 2 }).notNull(),
	payFrequency: mysqlEnum("pay_frequency", ['monthly','biweekly','weekly']).default('monthly').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	effectiveFrom: date("effective_from", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	effectiveTo: date("effective_to", { mode: 'string' }),
	changeReason: varchar("change_reason", { length: 255 }),
	changedBy: int("changed_by").references(() => employees.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("idx_employee_comp_history_employee").on(table.employeeId, table.effectiveFrom),
	index("changed_by").on(table.changedBy),
	primaryKey({ columns: [table.id], name: "employee_compensation_history_id"}),
]);
export type EmployeeCompensationHistory = typeof employeeCompensationHistory.$inferSelect;
export type NewEmployeeCompensationHistory = typeof employeeCompensationHistory.$inferInsert;

export const employeeDailyClock = mysqlTable("employee_daily_clock", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	clockIn: timestamp("clock_in", { mode: 'date' }).defaultNow(),
	clockOut: timestamp("clock_out", { mode: 'date' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	clockDate: date("clock_date", { mode: 'string' }).default(sql`(curdate())`),
	clockInLat: decimal("clock_in_lat", { precision: 9, scale: 6, mode: "number" }),
	clockInLng: decimal("clock_in_lng", { precision: 9, scale: 6, mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_daily_clock_id"}),
	unique("unique_employee_day").on(table.employeeId, table.clockDate),
]);

export const employeeDocuments = mysqlTable("employee_documents", {
	id: int().autoincrement().notNull(),
	empId: int("emp_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	url: varchar({ length: 255 }),
	name: varchar({ length: 100 }).notNull(),
	filename: varchar({ length: 255 }).notNull(),
},
(table) => [
	index("idx_employee_documents_emp_name").on(table.empId, table.name),
	primaryKey({ columns: [table.id], name: "employee_documents_id"}),
]);
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type NewEmployeeDocument = typeof employeeDocuments.$inferInsert;

export const employeeOnboardingProfile = mysqlTable("employee_onboarding_profile", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	gender: mysqlEnum(['male','female','other','prefer_not_to_say']),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dob: date({ mode: 'string' }),
	email: varchar({ length: 150 }).notNull(),
	phone: varchar({ length: 20 }),
	currentAddress: varchar("current_address", { length: 60 }),
	permanentAddress: varchar("permanent_address", { length: 60 }),
	emergencyContact: varchar("emergency_contact", { length: 150 }),
	educationLevel: varchar("education_level", { length: 50 }),
	institutionName: varchar("institution_name", { length: 50 }),
	fieldOfStudy: varchar("field_of_study", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	graduationDate: date("graduation_date", { mode: 'string' }),
	previousExperience: text("previous_experience"),
	isActive: boolean("is_active").default(true),
	areasOfInterest: text("areas_of_interest"),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	githubUrl: varchar("github_url", { length: 255 }),
	portfolioUrl: varchar("portfolio_url", { length: 255 }),
	role: mysqlEnum(['intern','employee','admin']).notNull(),
	additionalInfo: text("additional_info"),
	techStack: json("tech_stack"),
	ndaPath: varchar("nda_path", { length: 255 }),
	citizenshipFrontPath: varchar("citizenship_front_path", { length: 255 }),
	citizenshipBackPath: varchar("citizenship_back_path", { length: 255 }),
	panPath: varchar("pan_path", { length: 255 }),
	passoutCertificatePath: varchar("passout_certificate_path", { length: 255 }),
	photoPath: varchar("photo_path", { length: 255 }),
	designation: varchar({ length: 100 }),
	source: varchar({ length: 20 }).default('manual').notNull(),
	sourceApplicationId: varchar("source_application_id", { length: 100 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_onboarding_profile_id"}),
	unique("email").on(table.email),
	unique("uq_onboarding_source_application").on(table.sourceApplicationId),
]);
export type EmployeeOnboardingProfile = typeof employeeOnboardingProfile.$inferSelect;
export type NewEmployeeOnboardingProfile = typeof employeeOnboardingProfile.$inferInsert;

export const employeeTaxProfiles = mysqlTable("employee_tax_profiles", {
	id: int().autoincrement().notNull(),
	panNo: varchar({ length: 50 }).notNull(),
	month: tinyint().notNull(),
	year: smallint().notNull(),
	amount: decimal({ precision: 10, scale: 2 }),
	taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
	taxPerc: decimal("tax_perc", { precision: 5, scale: 2 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_tax_profiles_id"}),
	unique("uq_employee_tax_profiles_pan_month_year").on(table.panNo, table.month, table.year),
]);
export type EmployeeTaxProfile = typeof employeeTaxProfiles.$inferSelect;
export type NewEmployeeTaxProfile = typeof employeeTaxProfiles.$inferInsert;

export const employees = mysqlTable("employees", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	gender: mysqlEnum(['male','female','other','prefer_not_to_say']),
	email: varchar({ length: 150 }).notNull(),
	secondaryEmail: varchar("secondary_email", { length: 150 }),
	phone: varchar({ length: 20 }),
	emergencyContact: varchar("emergency_contact", { length: 150 }),
	designation: varchar({ length: 100 }),
	designationId: int("designation_id").references(() => designations.id, { onDelete: "set null" } ),
	department: varchar({ length: 100 }),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	managerId: int("manager_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dob: date({ mode: 'string' }),
	githubUrl: varchar("github_url", { length: 255 }),
	address: text(),
	discordUsername: varchar("discord_username", { length: 100 }),
	panNo: varchar({ length: 50 }),
	timezone: varchar({ length: 50 }).default('UTC'),
	workHours: varchar("work_hours", { length: 50 }).default('9 AM - 5 PM'),
	role: mysqlEnum(['admin','lead','employee','intern']).default('employee').notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	salary: decimal({ precision: 10, scale: 2 }),
	payFrequency: mysqlEnum("pay_frequency", ['monthly','biweekly','weekly']).default('monthly'),
	status: mysqlEnum(['onboarding','active','on_leave','probation','offboarding','terminated']).default('active').notNull(),
	leavePolicyAccepted: boolean("leave_policy_accepted").default(false),
	leavePolicyAcceptedAt: timestamp("leave_policy_accepted_at", { mode: 'date' }),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
	twoFactorBackupCodes: json("two_factor_backup_codes"),
},
(table) => [
	index("manager_id").on(table.managerId),
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [table.id],
			name: "employees_ibfk_1"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "employees_id"}),
	unique("email").on(table.email),
	unique("discord_username").on(table.discordUsername),
	unique("panNo").on(table.panNo),
]);
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export const feedbackNotes = mysqlTable("feedback_notes", {
	id: int().autoincrement().notNull(),
	fromEmployeeId: int("from_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	toEmployeeId: int("to_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	feedbackType: mysqlEnum("feedback_type", ['praise','constructive','peer','manager']).default('praise'),
	visibility: mysqlEnum(['public','private']).default('public'),
	message: text().notNull(),
	projectId: int("project_id").references(() => projects.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("from_employee_id").on(table.fromEmployeeId),
	index("to_employee_id").on(table.toEmployeeId),
	index("project_id").on(table.projectId),
	primaryKey({ columns: [table.id], name: "feedback_notes_id"}),
]);
export type FeedbackNote = typeof feedbackNotes.$inferSelect;
export type NewFeedbackNote = typeof feedbackNotes.$inferInsert;

export const formsLayout = mysqlTable("forms_layout", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	data: json().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "forms_layout_id"}),
	unique("name").on(table.name),
]);

export const goals = mysqlTable("goals", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	category: mysqlEnum(['individual','team','company']).default('individual'),
	metricUnit: varchar("metric_unit", { length: 30 }).default('%'),
	targetValue: decimal("target_value", { precision: 12, scale: 2 }).default('100.00'),
	currentValue: decimal("current_value", { precision: 12, scale: 2 }).default('0.00'),
	weight: int().default(3),
	status: mysqlEnum(['not_started','in_progress','at_risk','completed','missed']).default('not_started'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "goals_id"}),
]);
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export const googleSettings = mysqlTable("google_settings", {
	id: int().autoincrement().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	tokenExpiry: datetime("token_expiry", { mode: 'date' }),
	channelId: varchar("channel_id", { length: 255 }),
	resourceId: varchar("resource_id", { length: 255 }),
	channelExpiry: datetime("channel_expiry", { mode: 'date' }),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "google_settings_id"}),
]);
export type GoogleSettingsRow = typeof googleSettings.$inferSelect;
export type NewGoogleSettings = typeof googleSettings.$inferInsert;

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 150 }).notNull(),
	message: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	holidayDate: date("holiday_date", { mode: 'string' }).notNull(),
	year: year().notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "holidays_id"}),
	unique("holiday_date").on(table.holidayDate),
]);
export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;

export const inboxCategories = mysqlTable("inbox_categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	position: int().default(0).notNull(),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "inbox_categories_id"}),
]);
export type InboxCategory = typeof inboxCategories.$inferSelect;

export const inboxChannelMembers = mysqlTable("inbox_channel_members", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	role: mysqlEnum(['admin','member','readonly']).default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'date' }).defaultNow(),
	lastReadAt: timestamp("last_read_at", { mode: 'date' }),
},
(table) => [
	index("idx_ch_member_emp").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_channel_members_id"}),
	unique("uq_ch_member").on(table.channelId, table.employeeId),
]);
export type InboxChannelMember = typeof inboxChannelMembers.$inferSelect;

export const inboxChannels = mysqlTable("inbox_channels", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: mysqlEnum(['text','voice','announcement']).default('text').notNull(),
	category: mysqlEnum(['text','voice']).default('text').notNull(),
	description: varchar({ length: 500 }),
	position: int().default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
	requiredRole: mysqlEnum("required_role", ['admin','lead','employee','intern']).default('intern').notNull(),
	isArchived: tinyint("is_archived").default(0).notNull(),
	categoryId: int("category_id"),
	isPrivate: tinyint("is_private").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "inbox_channels_id"}),
]);
export type InboxChannel = typeof inboxChannels.$inferSelect;
export type NewInboxChannel = typeof inboxChannels.$inferInsert;

export const inboxDmMessages = mysqlTable("inbox_dm_messages", {
	id: int().autoincrement().notNull(),
	fromEmployeeId: int("from_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	toEmployeeId: int("to_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	isEdited: tinyint("is_edited").default(0).notNull(),
	isRead: tinyint("is_read").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'date' }),
},
(table) => [
	index("from_employee_id").on(table.fromEmployeeId),
	index("to_employee_id").on(table.toEmployeeId),
	primaryKey({ columns: [table.id], name: "inbox_dm_messages_id"}),
]);
export type InboxDmMessage = typeof inboxDmMessages.$inferSelect;
export type NewInboxDmMessage = typeof inboxDmMessages.$inferInsert;

export const inboxMessageReactions = mysqlTable("inbox_message_reactions", {
	id: int().autoincrement().notNull(),
	messageId: int("message_id").notNull().references(() => inboxMessages.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	emoji: varchar({ length: 12 }).notNull(),
	createdAt: datetime("created_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_message_reactions_id"}),
	unique("uq_reaction").on(table.messageId, table.employeeId, table.emoji),
]);
export type InboxReaction = typeof inboxMessageReactions.$inferSelect;
export type NewInboxReaction = typeof inboxMessageReactions.$inferInsert;

export const inboxMessages = mysqlTable("inbox_messages", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	isEdited: tinyint("is_edited").default(0).notNull(),
	isPinned: tinyint("is_pinned").default(0).notNull(),
	replyToId: int("reply_to_id"),
	createdAt: datetime("created_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'date' }),
	replyToContent: varchar("reply_to_content", { length: 500 }),
	replyToAuthor: varchar("reply_to_author", { length: 100 }),
},
(table) => [
	index("channel_id").on(table.channelId),
	index("employee_id").on(table.employeeId),
	index("reply_to_id").on(table.replyToId),
	foreignKey({
			columns: [table.replyToId],
			foreignColumns: [table.id],
			name: "inbox_messages_ibfk_3"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "inbox_messages_id"}),
]);
export type InboxMessage = typeof inboxMessages.$inferSelect;
export type NewInboxMessage = typeof inboxMessages.$inferInsert;

export const inboxNotificationPrefs = mysqlTable("inbox_notification_prefs", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	mode: mysqlEnum(['all','mentions','none']).default('all').notNull(),
	mutedUntil: timestamp("muted_until", { mode: 'string' }),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_notification_prefs_id"}),
	unique("uq_notif_pref").on(table.channelId, table.employeeId),
]);

export const inboxPresence = mysqlTable("inbox_presence", {
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	status: mysqlEnum(['online','away','dnd','offline']).default('offline').notNull(),
	lastSeen: datetime("last_seen", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.employeeId], name: "inbox_presence_employee_id"}),
]);
export type InboxPresenceRow = typeof inboxPresence.$inferSelect;

export const inboxSavedMessages = mysqlTable("inbox_saved_messages", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull(),
	messageId: int("message_id").notNull(),
	savedAt: timestamp("saved_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_employee_saved").on(table.employeeId),
	index("idx_message_saved").on(table.messageId),
	primaryKey({ columns: [table.id], name: "inbox_saved_messages_id"}),
	unique("uq_employee_message").on(table.employeeId, table.messageId),
]);

export const inboxVoicePresence = mysqlTable("inbox_voice_presence", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	joinedAt: datetime("joined_at", { mode: 'date' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_voice_presence_id"}),
	unique("uq_voice_presence").on(table.channelId, table.employeeId),
]);
export type InboxVoicePresence = typeof inboxVoicePresence.$inferSelect;

export const leaveBalances = mysqlTable("leave_balances", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	leaveType: mysqlEnum("leave_type", ['sick','bereavement','maternity','paternity']).notNull(),
	total: int().default(0),
	taken: int().default(0),
	year: year().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_balances_id"}),
	unique("unique_balance").on(table.employeeId, table.leaveType, table.year),
]);
export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;

export const leaveRequests = mysqlTable("leave_requests", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	leaveType: mysqlEnum("leave_type", ['sick','bereavement','maternity','paternity','casual','annual']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	reason: text(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending'),
	reviewedBy: int("reviewed_by").references(() => employees.id, { onDelete: "set null" } ),
	reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewed_by").on(table.reviewedBy),
	index("idx_leave_requests_status_employee").on(table.status, table.employeeId),
	index("idx_leave_requests_status_dates").on(table.status, table.startDate, table.endDate),
	primaryKey({ columns: [table.id], name: "leave_requests_id"}),
]);
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;

export const loginHistory = mysqlTable("login_history", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id, { onDelete: "set null" } ),
	email: varchar({ length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	success: boolean().notNull(),
	failureReason: varchar("failure_reason", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	index("idx_login_history_employee_created").on(table.employeeId, table.createdAt),
	primaryKey({ columns: [table.id], name: "login_history_id"}),
]);
export type LoginHistory = typeof loginHistory.$inferSelect;
export type NewLoginHistory = typeof loginHistory.$inferInsert;

export const meetings = mysqlTable("meetings", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDatetime: datetime("start_datetime", { mode: 'string'}).notNull(),
	endDatetime: datetime("end_datetime", { mode: 'string'}).notNull(),
	attendees: json().$type<string[]>(),
	googleEventId: varchar("google_event_id", { length: 255 }),
	meetLink: varchar("meet_link", { length: 500 }),
	status: mysqlEnum(['scheduled','cancelled']).default('scheduled').notNull(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "meetings_id"}),
	unique("uq_google_event").on(table.googleEventId),
]);
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

export const milestones = mysqlTable("milestones", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	title: varchar({ length: 200 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['pending','in_progress','completed']).default('pending'),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("project_id").on(table.projectId),
	index("idx_milestones_status").on(table.status),
	primaryKey({ columns: [table.id], name: "milestones_id"}),
]);
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;

export const monthlyReports = mysqlTable("monthly_reports", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	month: tinyint().notNull(),
	year: smallint().notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	filePath: varchar("file_path", { length: 500 }).notNull(),
	fileSize: int("file_size"),
	notes: text(),
	submittedAt: timestamp("submitted_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "monthly_reports_id"}),
]);
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type NewMonthlyReport = typeof monthlyReports.$inferInsert;

export const notificationPreferences = mysqlTable("notification_preferences", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	notificationType: varchar("notification_type", { length: 64 }).notNull(),
	enabled: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
},
(table) => [
	index("idx_notification_preferences_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "notification_preferences_id"}),
	unique("uq_notification_preferences_employee_type").on(table.employeeId, table.notificationType),
]);
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

export const operationLog = mysqlTable("operation_log", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	traceId: varchar("trace_id", { length: 36 }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }),
	operation: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "operation_log_id"}),
]);
export type OperationLog = typeof operationLog.$inferSelect;
export type NewOperationLog = typeof operationLog.$inferInsert;

export const otpCodes = mysqlTable("otp_codes", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	codeHash: varchar("code_hash", { length: 255 }).notNull(),
	attempts: int().default(0).notNull(),
	maxAttempts: int("max_attempts").default(5).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).onUpdateNow(),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "otp_codes_id"}),
]);
export type OtpCode = typeof otpCodes.$inferSelect;
export type NewOtpCode = typeof otpCodes.$inferInsert;

export const overtimeRequests = mysqlTable("overtime_requests", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	projectId: int("project_id").references(() => projects.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	workDate: date("work_date", { mode: 'string' }).notNull(),
	hours: decimal({ precision: 4, scale: 2 }).notNull(),
	reason: text().notNull(),
	approvedByName: varchar("approved_by_name", { length: 150 }).notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending'),
	reviewedBy: int("reviewed_by").references(() => employees.id, { onDelete: "set null" } ),
	reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
	hourlyRate: decimal("hourly_rate", { precision: 12, scale: 2 }),
	overtimeRate: decimal("overtime_rate", { precision: 12, scale: 2 }),
	amount: decimal({ precision: 12, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("project_id").on(table.projectId),
	index("reviewed_by").on(table.reviewedBy),
	index("idx_overtime_requests_status_employee").on(table.status, table.employeeId),
	index("idx_overtime_requests_work_date").on(table.workDate),
	primaryKey({ columns: [table.id], name: "overtime_requests_id"}),
]);
export type OvertimeRequest = typeof overtimeRequests.$inferSelect;
export type NewOvertimeRequest = typeof overtimeRequests.$inferInsert;

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "password_reset_tokens_id"}),
	unique("token").on(table.token),
]);
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

export const payrollAdjustments = mysqlTable("payroll_adjustments", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['overtime_pay','leave_deduction','leave_bonus']).notNull(),
	title: varchar({ length: 150 }).notNull(),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	year: year().notNull(),
	month: tinyint(),
	referenceType: mysqlEnum("reference_type", ['overtime_request','leave_request']),
	referenceId: int("reference_id"),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "payroll_adjustments_id"}),
]);
export type PayrollAdjustment = typeof payrollAdjustments.$inferSelect;
export type NewPayrollAdjustment = typeof payrollAdjustments.$inferInsert;

export const performanceReviews = mysqlTable("performance_reviews", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	reviewerId: int("reviewer_id").references(() => employees.id, { onDelete: "set null" } ),
	reviewPeriod: varchar("review_period", { length: 20 }).notNull(),
	overallRating: decimal("overall_rating", { precision: 2, scale: 1 }),
	categoryRatings: json("category_ratings").$type<Record<string, number>>(),
	strengths: text(),
	improvements: text(),
	managerComments: text("manager_comments"),
	employeeComments: text("employee_comments"),
	status: mysqlEnum(['draft','submitted','acknowledged']).default('draft'),
	submittedAt: timestamp("submitted_at", { mode: 'date' }),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("reviewer_id").on(table.reviewerId),
	index("idx_performance_reviews_status_employee").on(table.status, table.employeeId),
	primaryKey({ columns: [table.id], name: "performance_reviews_id"}),
	unique("unique_review_period").on(table.employeeId, table.reviewPeriod),
]);
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type NewPerformanceReview = typeof performanceReviews.$inferInsert;

export const policies = mysqlTable("policies", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	filePath: varchar("file_path", { length: 255 }).notNull(),
	version: int().default(1).notNull(),
	uploadedBy: int("uploaded_by").references(() => employees.id, { onDelete: "set null" } ),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	category: varchar({ length: 30 }).default('policy').notNull(),
	isPinned: boolean("is_pinned").default(false),
},
(table) => [
	index("uploaded_by").on(table.uploadedBy),
	primaryKey({ columns: [table.id], name: "policies_id"}),
]);
export type Policy = typeof policies.$inferSelect;
export type NewPolicy = typeof policies.$inferInsert;

export const policyAcknowledgements = mysqlTable("policy_acknowledgements", {
	id: int().autoincrement().notNull(),
	policyId: int("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	signedFilePath: varchar("signed_file_path", { length: 255 }).notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending'),
	rejectionReason: text("rejection_reason"),
	submittedAt: timestamp("submitted_at", { mode: 'date' }).defaultNow(),
	reviewedBy: int("reviewed_by").references(() => employees.id, { onDelete: "set null" } ),
	reviewedAt: timestamp("reviewed_at", { mode: 'date' }),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewed_by").on(table.reviewedBy),
	index("idx_policy_ack_status").on(table.status),
	primaryKey({ columns: [table.id], name: "policy_acknowledgements_id"}),
	unique("unique_policy_employee").on(table.policyId, table.employeeId),
]);
export type PolicyAcknowledgement = typeof policyAcknowledgements.$inferSelect;
export type NewPolicyAcknowledgement = typeof policyAcknowledgements.$inferInsert;

export const projectAssignments = mysqlTable("project_assignments", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	role: varchar({ length: 100 }).default('developer').notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "project_assignments_id"}),
	unique("unique_assignment").on(table.projectId, table.employeeId),
]);
export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type NewProjectAssignment = typeof projectAssignments.$inferInsert;

export const projectServices = mysqlTable("project_services", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	serviceKey: varchar("service_key", { length: 50 }).notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "project_services_id"}),
	unique("unique_project_service").on(table.projectId, table.serviceKey),
]);
export type ProjectService = typeof projectServices.$inferSelect;
export type NewProjectService = typeof projectServices.$inferInsert;

export const projectTodos = mysqlTable("project_todos", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	deadline: date({ mode: 'string' }),
	isComplete: tinyint("is_complete").default(0).notNull(),
	sortOrder: int("sort_order").default(0).notNull(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("project_id").on(table.projectId),
	index("created_by").on(table.createdBy),
	index("updated_by").on(table.updatedBy),
	primaryKey({ columns: [table.id], name: "project_todos_id"}),
]);
export type ProjectTodo = typeof projectTodos.$inferSelect;
export type NewProjectTodo = typeof projectTodos.$inferInsert;

export const projects = mysqlTable("projects", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	repoUrl: varchar("repo_url", { length: 255 }),
	docsUrl: varchar("docs_url", { length: 255 }),
	status: mysqlEnum(['active','archived','on_hold']).default('active'),
	roadmapKey: varchar("roadmap_key", { length: 50 }),
	roadmapLabel: varchar("roadmap_label", { length: 100 }),
	publicLink: varchar("public_link", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expectedEndDate: date("expected_end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_projects_status").on(table.status),
	primaryKey({ columns: [table.id], name: "projects_id"}),
]);
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// schema_migrations is the tracking table for the legacy hand-written
// src/db/migrations/*.sql runner (src/db/migrate.ts) — intentionally not
// managed by drizzle-kit so it never shows up as a drop/alter candidate.

export const servers = mysqlTable("servers", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").references(() => projects.id, { onDelete: "set null" } ),
	name: varchar({ length: 100 }).notNull(),
	environment: mysqlEnum(['development','staging','production']).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	domain: varchar({ length: 255 }),
	sshUser: varchar("ssh_user", { length: 100 }),
	notes: text(),
	isSensitive: boolean("is_sensitive").default(false),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("project_id").on(table.projectId),
	primaryKey({ columns: [table.id], name: "servers_id"}),
]);
export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;

export const serviceCredentials = mysqlTable("service_credentials", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	serviceName: varchar("service_name", { length: 100 }).notNull(),
	username: varchar({ length: 255 }),
	password: varchar({ length: 255 }),
	notes: text(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("created_by").on(table.createdBy),
	index("updated_by").on(table.updatedBy),
	primaryKey({ columns: [table.id], name: "service_credentials_id"}),
	unique("unique_employee_service").on(table.employeeId, table.serviceName),
]);
export type ServiceCredentialRow = typeof serviceCredentials.$inferSelect;
export type NewServiceCredential = typeof serviceCredentials.$inferInsert;

export const standups = mysqlTable("standups", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	workedOn: text(),
	completed: text(),
	inProgress: text(),
	nextUp: text(),
	blockers: text(),
	links: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	standupDate: date("standup_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_standups_date").on(table.standupDate),
	primaryKey({ columns: [table.id], name: "standups_id"}),
	unique("unique_employee_standup_date").on(table.employeeId, table.standupDate),
]);
export type Standup = typeof standups.$inferSelect;
export type NewStandup = typeof standups.$inferInsert;

export const trustedDevices = mysqlTable("trusted_devices", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	index("idx_trusted_devices_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "trusted_devices_id"}),
	unique("uq_trusted_devices_token_hash").on(table.tokenHash),
]);
export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type NewTrustedDevice = typeof trustedDevices.$inferInsert;

export const twoFactorEmailTokens = mysqlTable("two_factor_email_tokens", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	codeHash: varchar("code_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'date' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
},
(table) => [
	index("idx_two_factor_email_tokens_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "two_factor_email_tokens_id"}),
]);
export type TwoFactorEmailToken = typeof twoFactorEmailTokens.$inferSelect;
export type NewTwoFactorEmailToken = typeof twoFactorEmailTokens.$inferInsert;

export const weeklyReports = mysqlTable("weekly_reports", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	weekStartDate: date("week_start_date", { mode: 'string' }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	filePath: varchar("file_path", { length: 500 }).notNull(),
	fileSize: int("file_size"),
	notes: text(),
	submittedAt: timestamp("submitted_at", { mode: 'date' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "weekly_reports_id"}),
]);
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type NewWeeklyReport = typeof weeklyReports.$inferInsert;

export const employeeOffboarding = mysqlTable("employee_offboarding", {
	id: int().autoincrement().notNull(),
	empId: int("emp_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	exitType: mysqlEnum("exit_type", ['resignation','termination','end_of_contract','non_renewal']).notNull(),
	reason: text(),
	noticeDate: date("notice_date", { mode: 'string' }).notNull(),
	lastWorkingDay: date("last_working_day", { mode: 'string' }).notNull(),
	status: mysqlEnum(['in_progress','completed','cancelled']).default('in_progress').notNull(),
	previousStatus: varchar("previous_status", { length: 20 }).notNull(),
	relievingLetterPath: varchar("relieving_letter_path", { length: 255 }),
	completedAt: timestamp("completed_at", { mode: 'date' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_employee_offboarding_emp_id").on(table.empId),
	primaryKey({ columns: [table.id], name: "employee_offboarding_id"}),
]);
export type EmployeeOffboarding = typeof employeeOffboarding.$inferSelect;
export type NewEmployeeOffboarding = typeof employeeOffboarding.$inferInsert;

export const employeeOffboardingTasks = mysqlTable("employee_offboarding_tasks", {
	id: int().autoincrement().notNull(),
	offboardingId: int("offboarding_id").notNull(),
	category: mysqlEnum(['hr','it','finance','manager']).notNull(),
	title: varchar({ length: 150 }).notNull(),
	status: mysqlEnum(['pending','completed','not_applicable']).default('pending').notNull(),
	notes: text(),
	completedBy: int("completed_by").references(() => employees.id, { onDelete: "set null" } ),
	completedAt: timestamp("completed_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).onUpdateNow(),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
},
(table) => [
	index("idx_employee_offboarding_tasks_offboarding_id").on(table.offboardingId),
	foreignKey({
			columns: [table.offboardingId],
			foreignColumns: [employeeOffboarding.id],
			name: "employee_offboarding_tasks_offboarding_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.id], name: "employee_offboarding_tasks_id"}),
]);
export type EmployeeOffboardingTask = typeof employeeOffboardingTasks.$inferSelect;
export type NewEmployeeOffboardingTask = typeof employeeOffboardingTasks.$inferInsert;
