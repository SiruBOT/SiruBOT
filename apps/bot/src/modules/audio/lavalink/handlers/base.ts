import { container } from '@sapphire/framework';

// handlers/base.ts
export abstract class BaseLavalinkHandler {
	protected get logger() {
		return container.logger;
	}

	protected get container() {
		return container;
	}

	protected wrapAsyncHandler<T extends (...args: any[]) => Promise<any> | any>(handler: T, context?: string): T {
		return (async (...args: Parameters<T>) => {
			try {
				const result = await handler(...args);
				return result;
			} catch (error) {
				const errorContext = context ? ` (${context})` : '';
				this.logger.error(`${this.constructor.name} 오류 발생${errorContext}:`, error);
			}
		}) as T;
	}

	public abstract setup(...args: any[]): void;
}
