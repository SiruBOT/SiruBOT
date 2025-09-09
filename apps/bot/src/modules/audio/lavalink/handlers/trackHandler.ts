import { Scraper } from '@sirubot/yt-related-scraper';
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
	private relatedScraper: Scraper | null;
	constructor() {
		super();
		this.lavalinkManager = null;
		this.relatedScraper = new Scraper({
			log: this.logger,
			timeout: 10000
		});
	}

	public setup(lavalinkManager: LavalinkManager) {
		this.lavalinkManager = lavalinkManager;
		lavalinkManager.on('trackStart', this.wrapAsyncHandler(this.handleTrackStart.bind(this), 'trackStart'));
		lavalinkManager.on('trackEnd', this.wrapAsyncHandler(this.handleTrackEnd.bind(this), 'trackEnd'));
		lavalinkManager.on('trackStuck', this.wrapAsyncHandler(this.handleTrackStuck.bind(this), 'trackStuck'));
		lavalinkManager.on('trackError', this.wrapAsyncHandler(this.handleTrackError.bind(this), 'trackError'));
		lavalinkManager.on('queueEnd', this.wrapAsyncHandler(this.handleQueueEnd.bind(this), 'queueEnd'));
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

	private async handleQueueEnd(player: Player) {
		this.logger.info(`Queue ended`);
		console.log(player.queue.previous.map((e) => e.info.title));
		if (player.repeatMode == 'off') {
			// TODO: Experimental related track feature testing
			console.log(player.queue.previous[0].info.title);
			if (player.queue.previous[0].info.identifier) {
				const relatedTracks = await this.relatedScraper?.scrape(player.queue.previous[0].info.identifier ?? '');
				if (relatedTracks) {
					console.log(relatedTracks);
          const searchResult = await player.node.search("https://youtu.be/" + relatedTracks[relatedTracks.length - 1].videoId, player.queue.previous[0].requester);
          if (searchResult.loadType === 'track') {
            player.queue.add(searchResult.tracks[0]);
          }
				}
			}
		}
	}

	public cleanup() {
		// 핸들러 참조를 저장해야 cleanup에서 제거할 수 있음
		this.lavalinkManager?.removeAllListeners('trackStart');
		this.lavalinkManager?.removeAllListeners('trackEnd');
		this.lavalinkManager?.removeAllListeners('trackStuck');
		this.lavalinkManager?.removeAllListeners('trackError');
		this.lavalinkManager?.removeAllListeners('queueEnd');
	}
}
