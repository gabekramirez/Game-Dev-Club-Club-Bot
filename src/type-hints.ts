export interface Env {
    DISCORD_APPLICATION_ID: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_TOKEN: string;
    DISCORD_GUILD_ID: string;
    DISCORD_CLUB_LIST_CHANNEL_ID: string;
    DISCORD_ROLE_POSITION_START: string;
    DISCORD_ROLE_POSITION_END: string;
    DISCORD_ROLE_STAFF: string;
    DISCORD_ROLE_AUTO_BAN: string;
    GCP_SERVICE_ACCOUNT: string;
    GOOGLE_SHEET_ID: string;
    GOOGLE_SHEET_ID_BOT: string;
}

export interface ExecutionContext {
     waitUntil(promise: Promise<unknown>): void;
}

export interface ScheduledController {
    scheduledTime: number;
    cron: string;
}
