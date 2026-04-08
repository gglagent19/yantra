import type { FeedbackDataSharingPreference } from "./feedback.js";

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  enabled: boolean;
}

export interface IntegrationSettings {
  mcpServers: McpServerConfig[];
  chromeEnabled: boolean;
  apiConnected: boolean;
}

export interface InstanceGeneralSettings {
  censorUsernameInLogs: boolean;
  keyboardShortcuts: boolean;
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  anthropicApiKey: string;
  useAnthropicApi: boolean;
  integrations: IntegrationSettings;
}

export interface InstanceExperimentalSettings {
  enableIsolatedWorkspaces: boolean;
  autoRestartDevServerWhenIdle: boolean;
}

export interface InstanceSettings {
  id: string;
  general: InstanceGeneralSettings;
  experimental: InstanceExperimentalSettings;
  createdAt: Date;
  updatedAt: Date;
}
