import type { ContextMenuCommandDeniedPayload, Events } from '@sapphire/framework';
import { Listener, UserError } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

export class UserEvent extends Listener<typeof Events.ContextMenuCommandDenied> {
	public override async run({ context, message: content }: UserError, { interaction }: ContextMenuCommandDeniedPayload) {
		// `context: { silent: true }` should make UserError silent:
		// Use cases for this are for example permissions error when running the `eval` command.
		if (Reflect.get(Object(context), 'silent')) return;

		if (interaction.deferred || interaction.replied) {
			return interaction.editReply({
				content,
				allowedMentions: { users: [interaction.user.id], roles: [] }
			});
		}

		return interaction.reply({
			content,
			allowedMentions: { users: [interaction.user.id], roles: [] },
			flags: MessageFlags.Ephemeral
		});
	}
}
