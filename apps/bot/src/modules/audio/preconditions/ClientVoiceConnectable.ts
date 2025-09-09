import { AllFlowsPrecondition } from '@sapphire/framework';
import { CommandInteraction, ContextMenuCommandInteraction, Guild, GuildMember, PermissionsBitField } from 'discord.js';
import { Message } from 'discord.js';

export class ClientVoiceConnectablePrecondition extends AllFlowsPrecondition {
	#message = '🎧  봇이 음성 채널에 접속할 수 없어요. 음성 채널 권한을 확인해주세요.';

	private checkVoicePermissions(member: GuildMember | null, guild: Guild | null) {
		if (!member?.voice.channel) return false;
		if (!guild?.members.me) return false;

		const channel = member.voice.channel;
		return channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.Connect);
	}

	public override chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });

		if (!this.checkVoicePermissions(interaction.member, interaction.guild)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });

		if (!this.checkVoicePermissions(interaction.member, interaction.guild)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}

	public override messageRun(message: Message) {
		if (!message.inGuild()) return this.error({ message: this.#message });

		if (!this.checkVoicePermissions(message.member, message.guild)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}
}
