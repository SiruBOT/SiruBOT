import {
	LavalinkManager,
	Player,
	Track,
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	UnresolvedTrack
} from 'lavalink-client';
import { BaseLavalinkHandler } from './base';

// handlers/trackHandler.ts
export class TrackHandler extends BaseLavalinkHandler {
	private lavalinkManager: LavalinkManager | null;
	constructor() {
		super();
		this.lavalinkManager = null;
	}

	public setup(lavalinkManager: LavalinkManager) {
		this.lavalinkManager = lavalinkManager;
		lavalinkManager.on('trackStart', this.handleTrackStart.bind(this));
		lavalinkManager.on('trackEnd', this.handleTrackEnd.bind(this));
		lavalinkManager.on('trackStuck', this.handleTrackStuck.bind(this));
		lavalinkManager.on('trackError', this.handleTrackError.bind(this));
		lavalinkManager.on('queueEnd', this.handleQueueEnd.bind(this));
	}

	//@ts-ignore
	private handleTrackStart(player: Player, track: Track | null, payload: TrackStartEvent) {
		this.logger.info(`Track started: ${track?.info.title} by ${track?.info.author}`);
	}
	//@ts-ignore
	private handleTrackEnd(player: Player, track: Track | null, payload: TrackEndEvent) {
		this.logger.info(`Track ended: ${track?.info.title} by ${track?.info.author}`);
	}
	//@ts-ignore
	private handleTrackStuck(player: Player, track: Track | null, payload: TrackStuckEvent) {
		this.logger.info(`Track stuck: ${track?.info.title} by ${track?.info.author}`);
	}
	//@ts-ignore
	private handleTrackError(player: Player, track: Track | UnresolvedTrack | null, payload: TrackExceptionEvent) {
		this.logger.info(`Track error: ${track?.info.title} by ${track?.info.author}`);
	}
	//@ts-ignore
	private handleQueueEnd(player: Player) {
		this.logger.info(`Queue ended`);
	}

	public cleanup() {
		this.lavalinkManager?.off('trackStart', this.handleTrackStart.bind(this));
		this.lavalinkManager?.off('trackEnd', this.handleTrackEnd.bind(this));
		this.lavalinkManager?.off('trackStuck', this.handleTrackStuck.bind(this));
		this.lavalinkManager?.off('trackError', this.handleTrackError.bind(this));
		this.lavalinkManager?.off('queueEnd', this.handleQueueEnd.bind(this));
	}
}
