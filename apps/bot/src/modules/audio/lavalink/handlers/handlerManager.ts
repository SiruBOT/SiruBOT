import { LavalinkManager } from 'lavalink-client';
import { NodeHandler } from './nodeHandler';
import { PlayerHandler } from './playerHandler';
import { TrackHandler } from './trackHandler';

// lavalinkHandlerManager.ts
export class LavalinkHandlerManager {
	private nodeHandler: NodeHandler;
	private playerHandler: PlayerHandler;
	private trackHandler: TrackHandler;

	constructor() {
		this.nodeHandler = new NodeHandler();
		this.playerHandler = new PlayerHandler();
		this.trackHandler = new TrackHandler();
	}

	public initializeAll(lavalinkManager: LavalinkManager) {
		// Node Manager Events
		this.nodeHandler.setup(lavalinkManager.nodeManager);

		// Lavalink Manager Events
		this.playerHandler.setup(lavalinkManager);
		this.trackHandler.setup(lavalinkManager);
	}

	public cleanup() {
		this.nodeHandler.cleanup();
		this.playerHandler.cleanup();
		this.trackHandler.cleanup();
	}
}
