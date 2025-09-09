import { AllFlowsPrecondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message, Snowflake } from 'discord.js';

export class SameVoiceChannelPrecondition extends AllFlowsPrecondition {
	#message = '🔗  이 명령어를 사용하려면 봇과 같은 음성 채널에 연결해야 해요.';

	private checkSameVoiceChannel(userChannelId: Snowflake | null, botChannelId: Snowflake | null) {
		// 봇이 음성 채널에 연결되어 있지 않으면 통과 (연결 전 상태)
		if (!botChannelId) return true;
		// 사용자와 봇이 같은 채널에 있으면 통과
		return userChannelId === botChannelId;
	}

	public override chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });

		const userChannelId = interaction.member.voice.channelId;
		const botChannelId = interaction.guild?.members.me?.voice.channelId ?? null;

		if (!this.checkSameVoiceChannel(userChannelId, botChannelId)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (!interaction.inCachedGuild()) return this.error({ message: this.#message });

		const userChannelId = interaction.member.voice.channelId;
		const botChannelId = interaction.guild?.members.me?.voice.channelId ?? null;

		if (!this.checkSameVoiceChannel(userChannelId, botChannelId)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}

	public override messageRun(message: Message) {
		if (!message.inGuild()) return this.error({ message: this.#message });

		const userChannelId = message.member?.voice.channelId ?? null;
		const botChannelId = message.guild?.members.me?.voice.channelId ?? null;

		if (!this.checkSameVoiceChannel(userChannelId, botChannelId)) {
			return this.error({ message: this.#message });
		}

		return this.ok();
	}
}
