import type { NotificationProvider } from "@/data/notification-channels-data";
import type { AlertRule } from "../alert-rules";

export type {
  NotificationCredentials,
  NotificationProvider,
} from "@/data/notification-channels-data";

export type ServiceStatus = "up" | "down" | "timeout" | "error";

export type NotificationChannel = {
  id: string;
  name: string;
  provider: NotificationProvider;
  enabled: boolean;
  credentials: string; // encrypted JSON
  createdAt: string;
  updatedAt: string;
};

export type PublicNotificationChannel = Omit<
  NotificationChannel,
  "credentials"
> & { credentialsReadable: boolean };

export type ServiceNotificationMapping = AlertRule;

export type NotificationPayload = {
  serviceName: string;
  status: ServiceStatus;
  message: string;
  timestamp: string;
  responseTime?: number;
  statusCode?: number;
  isRecovery?: boolean;
};
