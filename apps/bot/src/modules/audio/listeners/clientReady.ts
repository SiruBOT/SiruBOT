import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { LavalinkHandlerManager } from '../../../lib/lavalink/handlers/handlerManager';

@ApplyOptions<Listener.Options>({ once: true })
export class ReadyEvent extends Listener {
	public override run() {
		this.initAudio();
	}

	private async initAudio() {
		try {
			this.container.logger.info('Initializing Lavalink client...');
			await this.container.audio.init({
				id: this.container!.client!.user!.id
			});
	
			const handler = new LavalinkHandlerManager();
			handler.initializeAll(this.container.audio);
		} catch (error) {
			this.container.logger.fatal('Failed to initialize lavalink client', error);
		}
	}
}
