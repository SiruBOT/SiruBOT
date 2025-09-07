import { LavalinkManager } from 'lavalink-client';
import { PrismaClient } from '@sirubot/prisma';
import { ArrayString } from '@skyra/env-utilities';
import { LogLevel } from '@sapphire/framework';

declare module '@skyra/env-utilities' {
	interface Env {
		OWNERS: ArrayString;
		LAVALINK_HOSTS: ArrayString;
		DISCORD_TOKEN: string;
		LOGLEVEL: LogLevel;
	}
}

declare module '@sapphire/framework' {
	interface Container {
		audio: LavalinkManager;
		prisma: PrismaClient;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never;
		VoiceConnected: never;
		SameVoiceChannel: never;
		NodeAvailable: never;
		MemberListenable: never;
		ClientVoiceConnectable: never;
		ClientVoiceSpeakable: never;
	}
}
