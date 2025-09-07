import { SapphireClient } from '@sapphire/framework';
import { ClientOptions } from 'discord.js';
import { getRootData, RootData } from '@sapphire/pieces';
import { join } from 'node:path';

export class ExtendedClient extends SapphireClient<boolean> {
	private rootData: RootData = getRootData();
	constructor(options: ClientOptions) {
		super(options);
		this.registerStore('audio');
		this.registerStore('general');
	}

	public registerStore(name: string) {
		this.logger.info(`Registering store: ${name}`);
		this.stores.registerPath(join(this.rootData.root, 'modules', name));
	}
}
