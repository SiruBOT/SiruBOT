import { InteractionReplyOptions, InteractionUpdateOptions } from "discord.js";

export type ReplyOrUpdate<IsReply extends boolean> = Promise<
  IsReply extends true ? InteractionReplyOptions : InteractionUpdateOptions
>;
