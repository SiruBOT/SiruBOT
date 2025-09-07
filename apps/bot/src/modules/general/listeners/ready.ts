import { isDev } from '@sirubot/utils';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { StoreRegistryValue } from '@sapphire/pieces';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';

@ApplyOptions<Listener.Options>({ once: true })
export class ReadyEvent extends Listener {
	private readonly style = isDev ? yellow : blue;

	public override run() {
		this.printBanner();
		this.printStoreDebugInformation();
	}

	private printBanner() {
		const success = green('+');

		const llc = isDev ? magentaBright : white;
		const blc = isDev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		this.container.logger.info(
			String.raw`
${line01} ${pad}${isDev ? `` : ``}
${line02} ${pad}[${success}] Gateway
${line03}${isDev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}
