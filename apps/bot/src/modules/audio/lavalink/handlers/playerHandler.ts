import { DestroyReasonsType, LavalinkManager, Player } from 'lavalink-client';
import { BaseLavalinkHandler } from './base';

// handlers/playerHandler.ts
export class PlayerHandler extends BaseLavalinkHandler {
	private lavalinkManager: LavalinkManager | null;
	constructor() {
		super();
		this.lavalinkManager = null;
	}

	public setup(lavalinkManager: LavalinkManager) {
		this.lavalinkManager = lavalinkManager;
		lavalinkManager.on('playerCreate', this.handlePlayerCreate.bind(this));
		lavalinkManager.on('playerDestroy', this.handlePlayerDestroy.bind(this));
		lavalinkManager.on('playerDisconnect', this.handlePlayerDisconnect.bind(this));
		lavalinkManager.on('playerMove', this.handlePlayerMove.bind(this));
    lavalinkManager.on('playerUpdate', this.handlePlayerUpdate.bind(this));
	}

	//@ts-ignore
	private handlePlayerCreate(player: Player) {
		this.logger.info(`Player created: ${player.guildId}`);
	}
	//@ts-ignore
	private handlePlayerDestroy(player: Player, reason: DestroyReasonsType | undefined) {
		this.logger.info(`Player destroyed: ${player.guildId}`);
	}
	//@ts-ignore
	private handlePlayerDisconnect(player: Player, voiceChannelId: string) {
		this.logger.info(`Player disconnected: ${player.guildId}`);
	}
	//@ts-ignore
	private handlePlayerMove(player: Player, oldChannelId: string, newChannelId: string) {
		this.logger.info(`Player moved: ${player.guildId}`);
	}

  //@ts-ignore
  private handlePlayerUpdate(oldPlayerJson: PlayerJson, newPlayer: Player) {
    this.logger.info(`Player updated: ${newPlayer.guildId}`);
    this.container.redisStoreManager.getPlayerSaver().set(newPlayer)
  }

	public cleanup() {
		this.lavalinkManager?.off('playerCreate', this.handlePlayerCreate.bind(this));
		this.lavalinkManager?.off('playerDestroy', this.handlePlayerDestroy.bind(this));
		this.lavalinkManager?.off('playerDisconnect', this.handlePlayerDisconnect.bind(this));
		this.lavalinkManager?.off('playerMove', this.handlePlayerMove.bind(this));
	}
}
