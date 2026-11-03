import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, bigint, varchar, smallint, int, timestamp, index, foreignKey, mysqlEnum, date, text, unique, decimal, tinyint, json, datetime, year } from "drizzle-orm/mysql-core"
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
	requestTimestamp: timestamp("request_timestamp", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "access_log_id"}),
]);

export const cultureEvents = mysqlTable("culture_events", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 200 }).notNull(),
	eventType: mysqlEnum("event_type", ['birthday','anniversary','team_event','milestone']).notNull(),
	employeeId: int("employee_id").references(() => employees.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	description: text(),
	slackNotified: tinyint("slack_notified").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("idx_culture_events_date").on(table.eventDate),
	primaryKey({ columns: [table.id], name: "culture_events_id"}),
]);

export const departments = mysqlTable("departments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "departments_id"}),
	unique("name").on(table.name),
]);

export const designations = mysqlTable("designations", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 100 }).notNull(),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("department_id").on(table.departmentId),
	primaryKey({ columns: [table.id], name: "designations_id"}),
	unique("title").on(table.title),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "email_settings_id"}),
	unique("employee_id").on(table.employeeId),
]);

export const employeeClockPauses = mysqlTable("employee_clock_pauses", {
	id: int().autoincrement().notNull(),
	clockId: int("clock_id").notNull().references(() => employeeDailyClock.id, { onDelete: "cascade" } ),
	pause: timestamp({ mode: 'string' }).defaultNow(),
	resume: timestamp({ mode: 'string' }),
	reason: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_employee_comp_history_employee").on(table.employeeId, table.effectiveFrom),
	index("changed_by").on(table.changedBy),
	primaryKey({ columns: [table.id], name: "employee_compensation_history_id"}),
]);

export const employeeDailyClock = mysqlTable("employee_daily_clock", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	clockIn: timestamp("clock_in", { mode: 'string' }).defaultNow(),
	clockOut: timestamp("clock_out", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	clockDate: date("clock_date", { mode: 'string' }).default(sql`(curdate())`),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
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
	isActive: tinyint("is_active").default(1),
	areasOfInterest: text("areas_of_interest"),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	githubUrl: varchar("github_url", { length: 255 }),
	portfolioUrl: varchar("portfolio_url", { length: 255 }),
	role: mysqlEnum(['intern','employee']).notNull(),
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

export const employees = mysqlTable("employees", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	gender: mysqlEnum(['male','female','other','prefer_not_to_say']),
	email: varchar({ length: 150 }).notNull(),
	secondaryEmail: varchar("secondary_email", { length: 150 }),
	phone: varchar({ length: 20 }),
	emergencyContact: varchar("emergency_contact", { length: 150 }),
	profilePicture: varchar("profile_picture", { length: 255 }),
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
	status: mysqlEnum(['onboarding','active','on_leave','probation','terminated']).default('active').notNull(),
	leavePolicyAccepted: tinyint("leave_policy_accepted").default(0),
	leavePolicyAcceptedAt: timestamp("leave_policy_accepted_at", { mode: 'string' }),
	twoFactorEnabled: tinyint("two_factor_enabled").default(0).notNull(),
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

export const feedbackNotes = mysqlTable("feedback_notes", {
	id: int().autoincrement().notNull(),
	fromEmployeeId: int("from_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	toEmployeeId: int("to_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	feedbackType: mysqlEnum("feedback_type", ['praise','constructive','peer','manager']).default('praise'),
	visibility: mysqlEnum(['public','private']).default('public'),
	message: text().notNull(),
	projectId: int("project_id").references(() => projects.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("from_employee_id").on(table.fromEmployeeId),
	index("to_employee_id").on(table.toEmployeeId),
	index("project_id").on(table.projectId),
	primaryKey({ columns: [table.id], name: "feedback_notes_id"}),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "goals_id"}),
]);

export const googleSettings = mysqlTable("google_settings", {
	id: int().autoincrement().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	tokenExpiry: datetime("token_expiry", { mode: 'string'}),
	channelId: varchar("channel_id", { length: 255 }),
	resourceId: varchar("resource_id", { length: 255 }),
	channelExpiry: datetime("channel_expiry", { mode: 'string'}),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "google_settings_id"}),
]);

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 150 }).notNull(),
	message: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	holidayDate: date("holiday_date", { mode: 'string' }).notNull(),
	year: year().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	primaryKey({ columns: [table.id], name: "holidays_id"}),
	unique("holiday_date").on(table.holidayDate),
]);

export const inboxCategories = mysqlTable("inbox_categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	position: int().default(0).notNull(),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "inbox_categories_id"}),
]);

export const inboxChannelMembers = mysqlTable("inbox_channel_members", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	role: mysqlEnum(['admin','member','readonly']).default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	lastReadAt: timestamp("last_read_at", { mode: 'string' }),
},
(table) => [
	index("idx_ch_member_emp").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_channel_members_id"}),
	unique("uq_ch_member").on(table.channelId, table.employeeId),
]);

export const inboxChannels = mysqlTable("inbox_channels", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: mysqlEnum(['text','voice','announcement']).default('text').notNull(),
	category: mysqlEnum(['text','voice']).default('text').notNull(),
	description: varchar({ length: 500 }),
	position: int().default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
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

export const inboxDmMessages = mysqlTable("inbox_dm_messages", {
	id: int().autoincrement().notNull(),
	fromEmployeeId: int("from_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	toEmployeeId: int("to_employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	isEdited: tinyint("is_edited").default(0).notNull(),
	isRead: tinyint("is_read").default(0).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}),
},
(table) => [
	index("from_employee_id").on(table.fromEmployeeId),
	index("to_employee_id").on(table.toEmployeeId),
	primaryKey({ columns: [table.id], name: "inbox_dm_messages_id"}),
]);

export const inboxMessageReactions = mysqlTable("inbox_message_reactions", {
	id: int().autoincrement().notNull(),
	messageId: int("message_id").notNull().references(() => inboxMessages.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	emoji: varchar({ length: 12 }).notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_message_reactions_id"}),
	unique("uq_reaction").on(table.messageId, table.employeeId, table.emoji),
]);

export const inboxMessages = mysqlTable("inbox_messages", {
	id: int().autoincrement().notNull(),
	channelId: int("channel_id").notNull().references(() => inboxChannels.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	isEdited: tinyint("is_edited").default(0).notNull(),
	isPinned: tinyint("is_pinned").default(0).notNull(),
	replyToId: int("reply_to_id"),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	deletedAt: datetime("deleted_at", { mode: 'string'}),
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
	lastSeen: datetime("last_seen", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	primaryKey({ columns: [table.employeeId], name: "inbox_presence_employee_id"}),
]);

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
	joinedAt: datetime("joined_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "inbox_voice_presence_id"}),
	unique("uq_voice_presence").on(table.channelId, table.employeeId),
]);

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
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
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

export const loginHistory = mysqlTable("login_history", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id, { onDelete: "set null" } ),
	email: varchar({ length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	success: tinyint().notNull(),
	failureReason: varchar("failure_reason", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_login_history_employee_created").on(table.employeeId, table.createdAt),
	primaryKey({ columns: [table.id], name: "login_history_id"}),
]);

export const meetings = mysqlTable("meetings", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDatetime: datetime("start_datetime", { mode: 'string'}).notNull(),
	endDatetime: datetime("end_datetime", { mode: 'string'}).notNull(),
	attendees: json(),
	googleEventId: varchar("google_event_id", { length: 255 }),
	meetLink: varchar("meet_link", { length: 500 }),
	status: mysqlEnum(['scheduled','cancelled']).default('scheduled').notNull(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "meetings_id"}),
	unique("uq_google_event").on(table.googleEventId),
]);

export const milestones = mysqlTable("milestones", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	title: varchar({ length: 200 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['pending','in_progress','completed']).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("project_id").on(table.projectId),
	index("idx_milestones_status").on(table.status),
	primaryKey({ columns: [table.id], name: "milestones_id"}),
]);

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
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "monthly_reports_id"}),
]);

export const notificationPreferences = mysqlTable("notification_preferences", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	notificationType: varchar("notification_type", { length: 64 }).notNull(),
	enabled: tinyint().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
},
(table) => [
	index("idx_notification_preferences_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "notification_preferences_id"}),
	unique("uq_notification_preferences_employee_type").on(table.employeeId, table.notificationType),
]);

export const operationLog = mysqlTable("operation_log", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	traceId: varchar("trace_id", { length: 36 }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }),
	operation: varchar({ length: 100 }).notNull(),
	status: varchar({ length: 20 }).notNull(),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "operation_log_id"}),
]);

export const otpCodes = mysqlTable("otp_codes", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	codeHash: varchar("code_hash", { length: 255 }).notNull(),
	attempts: int().default(0).notNull(),
	maxAttempts: int("max_attempts").default(5).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).onUpdateNow(),
	createdBy: int("created_by"),
	updatedBy: int("updated_by"),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "otp_codes_id"}),
]);

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
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	hourlyRate: decimal("hourly_rate", { precision: 12, scale: 2 }),
	overtimeRate: decimal("overtime_rate", { precision: 12, scale: 2 }),
	amount: decimal({ precision: 12, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
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

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "password_reset_tokens_id"}),
	unique("token").on(table.token),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "payroll_adjustments_id"}),
]);

export const performanceReviews = mysqlTable("performance_reviews", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	reviewerId: int("reviewer_id").references(() => employees.id, { onDelete: "set null" } ),
	reviewPeriod: varchar("review_period", { length: 20 }).notNull(),
	overallRating: decimal("overall_rating", { precision: 2, scale: 1 }),
	categoryRatings: json("category_ratings"),
	strengths: text(),
	improvements: text(),
	managerComments: text("manager_comments"),
	employeeComments: text("employee_comments"),
	status: mysqlEnum(['draft','submitted','acknowledged']).default('draft'),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("reviewer_id").on(table.reviewerId),
	index("idx_performance_reviews_status_employee").on(table.status, table.employeeId),
	primaryKey({ columns: [table.id], name: "performance_reviews_id"}),
	unique("unique_review_period").on(table.employeeId, table.reviewPeriod),
]);

export const policies = mysqlTable("policies", {
	id: int().autoincrement().notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	filePath: varchar("file_path", { length: 255 }).notNull(),
	version: int().default(1).notNull(),
	uploadedBy: int("uploaded_by").references(() => employees.id, { onDelete: "set null" } ),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	category: varchar({ length: 30 }).default('policy').notNull(),
	isPinned: tinyint("is_pinned").default(0),
},
(table) => [
	index("uploaded_by").on(table.uploadedBy),
	primaryKey({ columns: [table.id], name: "policies_id"}),
]);

export const policyAcknowledgements = mysqlTable("policy_acknowledgements", {
	id: int().autoincrement().notNull(),
	policyId: int("policy_id").notNull().references(() => policies.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	signedFilePath: varchar("signed_file_path", { length: 255 }).notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending'),
	rejectionReason: text("rejection_reason"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
	reviewedBy: int("reviewed_by").references(() => employees.id, { onDelete: "set null" } ),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewed_by").on(table.reviewedBy),
	index("idx_policy_ack_status").on(table.status),
	primaryKey({ columns: [table.id], name: "policy_acknowledgements_id"}),
	unique("unique_policy_employee").on(table.policyId, table.employeeId),
]);

export const projectAssignments = mysqlTable("project_assignments", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	role: varchar({ length: 100 }).default('developer').notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "project_assignments_id"}),
	unique("unique_assignment").on(table.projectId, table.employeeId),
]);

export const projectServices = mysqlTable("project_services", {
	id: int().autoincrement().notNull(),
	projectId: int("project_id").notNull().references(() => projects.id, { onDelete: "cascade" } ),
	serviceKey: varchar("service_key", { length: 50 }).notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "project_services_id"}),
	unique("unique_project_service").on(table.projectId, table.serviceKey),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("project_id").on(table.projectId),
	index("created_by").on(table.createdBy),
	index("updated_by").on(table.updatedBy),
	primaryKey({ columns: [table.id], name: "project_todos_id"}),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_projects_status").on(table.status),
	primaryKey({ columns: [table.id], name: "projects_id"}),
]);

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
	isSensitive: tinyint("is_sensitive").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("project_id").on(table.projectId),
	primaryKey({ columns: [table.id], name: "servers_id"}),
]);

export const serviceCredentials = mysqlTable("service_credentials", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	serviceName: varchar("service_name", { length: 100 }).notNull(),
	username: varchar({ length: 255 }),
	password: varchar({ length: 255 }),
	notes: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("created_by").on(table.createdBy),
	index("updated_by").on(table.updatedBy),
	primaryKey({ columns: [table.id], name: "service_credentials_id"}),
	unique("unique_employee_service").on(table.employeeId, table.serviceName),
]);

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
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_standups_date").on(table.standupDate),
	primaryKey({ columns: [table.id], name: "standups_id"}),
	unique("unique_employee_standup_date").on(table.employeeId, table.standupDate),
]);

export const trustedDevices = mysqlTable("trusted_devices", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_trusted_devices_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "trusted_devices_id"}),
	unique("uq_trusted_devices_token_hash").on(table.tokenHash),
]);

export const twoFactorEmailTokens = mysqlTable("two_factor_email_tokens", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" } ),
	codeHash: varchar("code_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_two_factor_email_tokens_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "two_factor_email_tokens_id"}),
]);

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
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "weekly_reports_id"}),
]);

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
	completedAt: timestamp("completed_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).onUpdateNow(),
	createdBy: int("created_by").references(() => employees.id, { onDelete: "set null" } ),
	updatedBy: int("updated_by").references(() => employees.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_employee_offboarding_emp_id").on(table.empId),
	primaryKey({ columns: [table.id], name: "employee_offboarding_id"}),
]);

export const employeeOffboardingTasks = mysqlTable("employee_offboarding_tasks", {
	id: int().autoincrement().notNull(),
	offboardingId: int("offboarding_id").notNull(),
	category: mysqlEnum(['hr','it','finance','manager']).notNull(),
	title: varchar({ length: 150 }).notNull(),
	status: mysqlEnum(['pending','completed','not_applicable']).default('pending').notNull(),
	notes: text(),
	completedBy: int("completed_by").references(() => employees.id, { onDelete: "set null" } ),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).onUpdateNow(),
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
