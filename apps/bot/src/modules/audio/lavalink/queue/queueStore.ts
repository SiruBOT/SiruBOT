import { type RedisClientType } from '@redis/client';
import { Awaitable, QueueStoreManager, StoredQueue } from 'lavalink-client';

export class RedisQueueStore implements QueueStoreManager {
	constructor(private readonly redis: RedisClientType) {}

	private getKey(guildId: string): string {
		return `lavalink/queue/${guildId}`;
	}

	public async get(guildId: string): Promise<string> {
		const rawQueue = await this.redis.get(this.getKey(guildId));
		if (rawQueue === null)
			return JSON.stringify({
				current: null,
				previous: [],
				tracks: []
			});

		return rawQueue;
	}

	public async set(guildId: string, value: StoredQueue | string): Promise<void | boolean> {
		await this.redis.set(this.getKey(guildId), this.stringify(value) as string);
	}

	public async delete(guildId: string): Promise<void | boolean> {
		return (await this.redis.del(this.getKey(guildId))) > 0;
	}

	public parse(value: StoredQueue | string): Partial<StoredQueue> {
		return typeof value === 'string' ? JSON.parse(value) : (value as StoredQueue);
	}

	public stringify(value: StoredQueue | string): Awaitable<StoredQueue | string> {
		return JSON.stringify(value);
	}
}
