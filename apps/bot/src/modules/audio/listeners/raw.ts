import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ once: false })
export class RawEvent extends Listener {
	public override run(d: any) {
		this.container?.audio?.sendRawData(d);
	}
}
