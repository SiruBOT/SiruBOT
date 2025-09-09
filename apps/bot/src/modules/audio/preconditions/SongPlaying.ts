import { AllFlowsPrecondition } from '@sapphire/framework';
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';

export class SongPlayingPrecondition extends AllFlowsPrecondition {
	#message = '🎵  이 명령어를 사용하려면 노래가 재생 중이어야 해요.';

	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		if (this.checkPlayerExists(interaction.guildId!)) {
			return this.ok();
		}

		return this.error({ message: this.#message });
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		if (this.checkPlayerExists(interaction.guildId!)) {
			return this.ok();
		}

		return this.error({ message: this.#message });
	}

	public override messageRun(message: Message) {
		if (this.checkPlayerExists(message.guildId!)) {
			return this.ok();
		}

		return this.error({ message: this.#message });
	}

	private checkPlayerExists(guildId: string) {
		const player = this.container.audio.getPlayer(guildId);
		if (!player) return false;
		if (player.queue.current && !player.paused) return true;

		return false;
	}
}
