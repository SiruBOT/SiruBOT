import { AllFlowsPrecondition } from '@sapphire/framework';
import { CommandInteraction, ContextMenuCommandInteraction, Message, GuildMember } from 'discord.js';

export class MemberListenable extends AllFlowsPrecondition {
	#message = '🔇 음성 채널에서 듣기 상태가 꺼져있어요. 듣기 상태를 켜주세요.';

	private checkListenable(member: GuildMember | null) {
		if (!member?.voice.channelId) return false;
		return !member.voice.deaf;
	}

	public override chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });
		
		if (!this.checkListenable(interaction.member)) {
			return this.error({ message: this.#message });
		}
		
		return this.ok();
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });
		
		if (!this.checkListenable(interaction.member)) {
			return this.error({ message: this.#message });
		}
		
		return this.ok();
	}

	public override messageRun(message: Message) {
		if (!message.inGuild()) return this.error({ message: this.#message });
		
		if (!this.checkListenable(message.member)) {
			return this.error({ message: this.#message });
		}
		
		return this.ok();
	}
}
