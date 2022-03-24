import {
  ButtonInteraction,
  CollectorFilter,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageActionRowComponentResolvable,
  MessageButton,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import {
  EMOJI_NEXT,
  EMOJI_PREV,
  EMOJI_STOP,
  PAGINATION_AWAIT_TIMEOUT,
} from "../constant/Constants";
import { MessageUtil } from "./MessageUtil";

export type PageFnReturn = string | MessagePayload | MessageOptions;

export type PageFn = (
  page: number,
  maxPage: number,
  paginator: Paginator
) => Promise<PageFnReturn>;

export interface PaginatorOptions {
  pageFn: PageFn;
  totalPages: number;
  baseCustomId: string;
}

export class Paginator {
  // private paginatorOptions: PaginatorOptions;
  private pageFn: PageFn;
  private currentPage: number;
  private totalPages: number;
  private baseCustomId: string;
  private previousBtnId: string;
  private nextBtnId: string;
  private stopBtnId: string;
  private baseMessage: Message<true>;
  constructor(paginatorOptions: PaginatorOptions) {
    this.pageFn = paginatorOptions.pageFn;
    this.baseCustomId = paginatorOptions.baseCustomId;
    this.currentPage = 1;
    this.totalPages = paginatorOptions.totalPages;
    this.previousBtnId = this.baseCustomId + "_btn_previous";
    this.nextBtnId = this.baseCustomId + "_btn_next";
    this.stopBtnId = this.baseCustomId + "_btn_stop";
  }

  getActionRow(
    additionalComponents?: MessageActionRowComponentResolvable[]
  ): MessageActionRow {
    const actionRow: MessageActionRow = new MessageActionRow();
    actionRow.addComponents(
      new MessageButton()
        .setCustomId(this.previousBtnId)
        .setEmoji(EMOJI_PREV)
        .setStyle("SECONDARY")
        .setDisabled(this.currentPage === 1),
      new MessageButton()
        .setCustomId(this.stopBtnId)
        .setEmoji(EMOJI_STOP)
        .setStyle("SECONDARY"),
      new MessageButton()
        .setCustomId(this.nextBtnId)
        .setEmoji(EMOJI_NEXT)
        .setStyle("SECONDARY")
        .setDisabled(this.currentPage === this.totalPages),
      ...(additionalComponents ?? [])
    );
    return actionRow;
  }

  public async start(interaction: CommandInteraction<"cached">): Promise<void> {
    const page = await this.pageFn(this.currentPage, this.totalPages, this);
    this.baseMessage = await MessageUtil.followUpOrEditReply(
      interaction,
      this.pagePayload(page)
    );
    await this.awaitButtons(interaction);
  }

  public pagePayload(
    pageValue: PageFnReturn
  ): MessagePayload | InteractionReplyOptions {
    const actionRow = this.getActionRow();
    switch (typeof pageValue) {
      case "string":
        return {
          content: pageValue,
          components: [actionRow],
        };
      default:
        return Object.assign(
          {
            components: [actionRow],
          },
          pageValue
        );
    }
  }

  public async awaitButtons(
    interaction: CommandInteraction<"cached">
  ): Promise<void> {
    if (!interaction.channel) throw new Error("Interaction channel not found.");
    const buttonCollectorFilter: CollectorFilter<
      [ButtonInteraction<"cached">]
    > = (i: ButtonInteraction<"cached">) =>
      i.user.id == interaction.user.id && i.message.id == this.baseMessage.id;
    try {
      const collected: ButtonInteraction =
        await interaction.channel.awaitMessageComponent({
          componentType: "BUTTON",
          filter: buttonCollectorFilter,
          time: PAGINATION_AWAIT_TIMEOUT,
          dispose: true,
        });
      switch (collected.customId) {
        case this.previousBtnId: {
          this.currentPage--;
          await collected.update(
            this.pagePayload(
              await this.pageFn(this.currentPage, this.totalPages, this)
            )
          );
          await this.awaitButtons(interaction);
          break;
        }
        case this.nextBtnId: {
          this.currentPage++;
          await collected.update(
            this.pagePayload(
              await this.pageFn(this.currentPage, this.totalPages, this)
            )
          );
          await this.awaitButtons(interaction);
          break;
        }
        case this.stopBtnId: {
          await collected.update({
            components: [],
          });
          break;
        }
      }
    } catch (error) {
      const err: Error = error as Error;
      if (
        err.name.includes("INTERACTION_COLLECTOR_ERROR") &&
        err.message.includes("time")
      ) {
        await interaction.editReply({
          components: [],
        });
      } else {
        throw error;
      }
    }
  }
}

/**
 * Example usage:
 *
 */
