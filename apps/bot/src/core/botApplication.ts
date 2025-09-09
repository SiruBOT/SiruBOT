import { SapphireClient } from '@sapphire/framework';
import { RootData, container, getRootData } from '@sapphire/pieces';
import { ClientOptions } from 'discord.js';
import { LavalinkManager, LavalinkNodeOptions } from 'lavalink-client';
import { join } from 'node:path';
import { RedisStoreManager } from '../modules/audio/lavalink/redisStoreManager';

export class BotApplication<T extends boolean> extends SapphireClient<T> {
	private rootData: RootData = getRootData();
	constructor(options: ClientOptions) {
		super(options);
	}

	public setupStore(name: string) {
		this.logger.info(`Setting up store: ${name}`);
		this.stores.registerPath(join(this.rootData.root, 'modules', name));
	}

	public async setupRedisStoreManager(url: string) {
		const redisStore = new RedisStoreManager({
			url
		});
		await redisStore.connect();

		container.redisStoreManager = redisStore;

		return redisStore;
	}

	public setupAudio(nodes: LavalinkNodeOptions[]) {
		const audio = new LavalinkManager({
			nodes: nodes,
			sendToShard: (guildId, payload) => this.guilds.cache.get(guildId)?.shard.send(payload),
			client: {
				id: this.user!.id
			},
			autoSkip: true,
			playerOptions: {
				onDisconnect: {
					autoReconnect: true
				},
				onEmptyQueue: {
					destroyAfterMs: 10000
				}
			},
			queueOptions: {
				queueStore: container.redisStoreManager.getQueueStore()
			}
		});

		container.audio = audio;

		return audio;
	}
}
