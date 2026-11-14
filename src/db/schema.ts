import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const services = sqliteTable("services", {
  address: text("address").notNull(),
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  port: integer("port").notNull(),
  // shown on the public status page at all
  public: integer("public", { mode: "boolean" }).notNull().default(true),
  // address/port visible to visitors (hidden by default: may be internal)
  showAddress: integer("show_address", { mode: "boolean" })
    .notNull()
    .default(false),
  type: text("type", { enum: ["https", "http", "tcp"] }).notNull(),
});

export const monitoringResults = sqliteTable(
  "monitoring_results",
  {
    errorMessage: text("error_message"),
    id: integer("id").primaryKey({ autoIncrement: true }),
    responseTime: integer("response_time"), // ms
    serviceId: integer("service_id")
      .references(() => services.id)
      .notNull(),
    status: text("status", {
      enum: ["up", "down", "timeout", "error"],
    }).notNull(),
    statusCode: integer("status_code"),
    timestamp: text("timestamp").notNull(), // ISO string
  },
  (t) => [
    index("monitoring_results_service_time_idx").on(t.serviceId, t.timestamp),
    // time-range scans (24h uptime, latest check) without reading every row
    index("monitoring_results_time_idx").on(t.timestamp, t.serviceId, t.status),
  ]
);

export const incidents = sqliteTable(
  "incidents",
  {
    description: text("description"),
    endTime: text("end_time"), // null while ongoing
    id: integer("id").primaryKey({ autoIncrement: true }),
    serviceId: integer("service_id")
      .references(() => services.id)
      .notNull(),
    startTime: text("start_time").notNull(), // ISO string
    status: text("status", { enum: ["ongoing", "resolved"] }).notNull(),
    title: text("title").notNull(),
  },
  (t) => [index("incidents_service_status_idx").on(t.serviceId, t.status)]
);

export const notificationChannels = sqliteTable("notification_channels", {
  createdAt: text("created_at").notNull(),
  credentials: text("credentials").notNull(), // AES-GCM encrypted JSON
  enabled: integer("enabled", { mode: "boolean" }).notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Which notification channels alert for a service
export const serviceAlerts = sqliteTable(
  "service_alerts",
  {
    alertThreshold: integer("alert_threshold").notNull(), // consecutive failures
    channelId: text("channel_id")
      .references(() => notificationChannels.id)
      .notNull(),
    notifyOnRecovery: integer("notify_on_recovery", {
      mode: "boolean",
    }).notNull(),
    serviceId: integer("service_id")
      .references(() => services.id)
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.channelId] })]
);

// Small JSON documents: "admin", "branding", "settings"
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export type Service = typeof services.$inferSelect;
export type ServiceStatus = (typeof monitoringResults.$inferSelect)["status"];
