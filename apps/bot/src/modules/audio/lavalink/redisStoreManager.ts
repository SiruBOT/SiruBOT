import { container } from '@sapphire/framework';
import { type RedisClientType, createClient } from '@redis/client';
import { RedisPlayerSaver } from './player/playerSaver';
import { RedisQueueStore } from './queue/queueStore';

type RedisClientOptionsType = Parameters<typeof createClient>[0];

export class RedisStoreManager {
	private redis: RedisClientType;
	private queueStore: RedisQueueStore;
	private playerSaver: RedisPlayerSaver;
	private isReady = false;

	constructor(options?: RedisClientOptionsType) {
		this.redis = createClient(options) as RedisClientType;
		this.queueStore = new RedisQueueStore(this.redis);
		this.playerSaver = new RedisPlayerSaver(this.redis);

		this.redis.on('error', (err) => this.logger.error(`Redis Error: ${err}`));
		this.redis.on('connect', () => this.logger.info('Redis connected'));
		this.redis.on('reconnecting', () => this.logger.info('Redis reconnecting'));
		this.redis.on('ready', () => {
			this.isReady = true;
			this.logger.info('Redis ready!');
		});
	}

	private get logger() {
		return container.logger;
	}

	public getQueueStore() {
		return this.queueStore;
	}

	public getPlayerSaver() {
		return this.playerSaver;
	}

	public async connect() {
		await this.redis.connect();
	}

	public get ready() {
		return this.isReady;
	}
}
