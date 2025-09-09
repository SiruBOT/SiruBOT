import { type RedisClientType } from '@redis/client';
import { Player, PlayerJson } from 'lavalink-client';

export class RedisPlayerSaver {
	constructor(private readonly redis: RedisClientType) {}

	private getKey(guildId: string): string {
		return `lavalink/player/${guildId}`;
	}

	public async set(player: Player): Promise<void> {
		await this.redis.set(this.getKey(player.guildId), this.stringify(player));
	}

	public async get(guildId: string): Promise<Omit<PlayerJson, 'queue'> | null> {
		const playerData = await this.redis.get(this.getKey(guildId));
		if (playerData === null) return null;

		return JSON.parse(playerData);
	}

	private stringify(player: Player): string {
		const { queue, ...playerData } = player.toJSON();

		return JSON.stringify(playerData);
	}
}
