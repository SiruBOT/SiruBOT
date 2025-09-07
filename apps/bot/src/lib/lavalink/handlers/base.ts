import { container } from '@sapphire/framework';
// handlers/base.ts
export abstract class BaseLavalinkHandler {
	protected get logger() {
		return container.logger;
	}

	protected get container() {
		return container;
	}

	public abstract setup(...args: any[]): void;
}
