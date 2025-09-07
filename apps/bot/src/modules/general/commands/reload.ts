import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, ChatInputCommandInteraction } from 'discord.js';

@ApplyOptions<Command.Options>({
	enabled: true,
	name: '리로드',
	preconditions: ['OwnerOnly']
})
export class TestCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setIntegrationTypes(ApplicationIntegrationType.GuildInstall).setName(this.name).setDescription('명령어 리로드');
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;
		if (!interaction.member.voice.channelId) return;

		await this.container.stores.load();

		interaction.reply('> OK :white_check_mark:');
	}
}
