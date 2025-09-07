import './lib/setup';

import { container } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { GatewayIntentBits, Partials } from 'discord.js';
import { LavalinkManager } from 'lavalink-client';
import { ExtendedClient } from './lib/ExtendedClient';
import { versionInfo } from '@sirubot/utils';

const banner = `──────────────────────────────────────────────────────────────────
  ######   #### ########  ##     ## ########   #######  ######## 
  ##    ##  ##  ##     ## ##     ## ##     ## ##     ##    ##    
  ##        ##  ##     ## ##     ## ##     ## ##     ##    ##    
   ######   ##  ########  ##     ## ########  ##     ##    ##    
        ##  ##  ##   ##   ##     ## ##     ## ##     ##    ##    
  ##    ##  ##  ##    ##  ##     ## ##     ## ##     ##    ##    
   ######  #### ##     ##  #######  ########   #######     ##     

	├─ ${versionInfo.getName()} ${versionInfo.getVersion()} (${versionInfo.getGitBranch()}/${versionInfo.getGitHash()})
	├─ Discord.JS: ${versionInfo.getDjsVersion()}
	├─ Lavalink-Client: ${versionInfo.getLavalinkClientVersion()}
	└─ Node.js: ${versionInfo.getNodeVersion()}
──────────────────────────────────────────────────────────────────`;

const client = new ExtendedClient({
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
	partials: [Partials.Channel]
});

const main = async () => {
	try {
		client.logger.info(banner);
		// Logging in
		client.logger.info('SapphireClient: Logging in...');
		await client.login(envParseString('DISCORD_TOKEN'));
		client.logger.info('SapphireClient: Logged in as ' + client.user!.tag);

		// Initialize Lavalink
		const rawLavalinkHosts = envParseString('LAVALINK_HOSTS');
		const parsedLavalinkHosts = JSON.parse(rawLavalinkHosts);
		client.logger.info(`LavalinkManager: Prepare to connect to Lavalink with ${parsedLavalinkHosts.length} nodes`);

		container.audio = new LavalinkManager({
			nodes: parsedLavalinkHosts,
			sendToShard: (guildId, payload) => container.client.guilds.cache.get(guildId)?.shard.send(payload),
			client: {
				id: client.user!.id
			},
			autoSkip: true,
			playerOptions: {
				onEmptyQueue: {
					destroyAfterMs: 10000
				}
			}
		});
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();

/**
 * Promise rejection handler
 */
process.on('unhandledRejection', (error) => {
	client.logger.error('UnhandledPromiseRejectionWarning: ', error);
});

process.on('uncaughtException', (error) => {
	client.logger.fatal('UncaughtException: ', error);
});
