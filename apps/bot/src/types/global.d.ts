import { LogLevel, SapphireClient } from '@sapphire/framework';
import { PrismaClient } from '@sirubot/prisma';
import { ArrayString } from '@skyra/env-utilities';
import { LavalinkManager } from 'lavalink-client';
import { BotApplication } from '../core/botApplication';
import { RedisStoreManager } from '../modules/audio/lavalink/redisStoreManager';

declare module '@skyra/env-utilities' {
	interface Env {
		OWNERS: ArrayString;
		LAVALINK_HOSTS: ArrayString;
		DISCORD_TOKEN: string;
		REDIS_URL: string;
		LOGLEVEL: LogLevel;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		audio: LavalinkManager;
		prisma: PrismaClient;
		redisStoreManager: RedisStoreManager;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;

		VoiceConnected: never;
		SameVoiceChannel: never;
		NodeAvailable: never;
		SongPlaying: never;

		MemberListenable: never;
		ClientVoiceConnectable: never;
		ClientVoiceSpeakable: never;
	}
}
