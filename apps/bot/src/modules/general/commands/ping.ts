import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { DEFAULT_COLOR } from '@sirubot/utils';
import { ApplicationIntegrationType, ChatInputCommandInteraction } from 'discord.js';

@ApplyOptions<Command.Options>({
	enabled: true,
	name: '핑',
	description: '봇의 반응 속도를 보여드려요.'
})
export class PingCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder.setIntegrationTypes(ApplicationIntegrationType.GuildInstall).setName(this.name).setDescription(this.description);
		});
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const deferReply = await interaction.deferReply({ fetchReply: true });
		const deferReplyTime = Math.round(deferReply.createdTimestamp - interaction.createdTimestamp);

		const replyTimeInSeconds = (deferReplyTime / 1000).toFixed(2);
		const wsPingInSeconds = (this.container.client.ws.ping / 1000).toFixed(2);

		await interaction.editReply({
			embeds: [
				{
					description: `✌️ **${interaction.user.displayName}** 님의 명령어를 처리하는 데 ${replyTimeInSeconds}초\`\`(${deferReplyTime}ms)\`\` 가 걸렸어요, 봇과 디스코드간의 지연시간은 ${wsPingInSeconds}초\`\`(${this.container.client.ws.ping}ms)\`\` 예요.`,
					color: DEFAULT_COLOR
				}
			]
		});
	}
}
