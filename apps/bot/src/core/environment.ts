import { container } from '@sapphire/framework';
import { setup } from '@skyra/env-utilities';
import { join } from 'node:path';

setup({ path: join(process.cwd(), '.env') });

process.env.NODE_ENV ??= 'development';

process.on('unhandledRejection', (error) => {
	container.logger.error('UnhandledPromiseRejectionWarning: ', error);
});

process.on('uncaughtException', (error) => {
	container.logger.fatal('UncaughtException: ', error);
});
