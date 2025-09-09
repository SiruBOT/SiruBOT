import { envParseString } from '@skyra/env-utilities';
import { GatewayIntentBits, Partials } from 'discord.js';
import { BotApplication } from './botApplication';

const main = async () => {
	const client = new BotApplication({
		logger: {
			level: envParseString('LOGLEVEL')
		},
		shards: 'auto',
		intents: [
			GatewayIntentBits.GuildModeration,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildVoiceStates,
			GatewayIntentBits.MessageContent
		],
		partials: [Partials.Channel, Partials.GuildMember, Partials.Message]
	});

	try {
        // Audio -> General -> RedisStore -> Login -> Lavalink (After ready event)
		client.setupStore('audio');
		client.setupStore('general');

		client.logger.info('BotApplication: Setting up Redis store manager...');
		client.setupRedisStoreManager(envParseString('REDIS_URL'));
        
		client.logger.info('BotApplication: Logging in...');
		await client.login(envParseString('DISCORD_TOKEN'));

		client.logger.info('BotApplication: Setting up Lavalink...');
		client.setupAudio(JSON.parse(envParseString('LAVALINK_HOSTS')));

		client.logger.info('BotApplication: Logged in as ' + client.user!.tag);
	} catch (error) {
		client.logger.error('BotApplication: Error setting up application...');
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
