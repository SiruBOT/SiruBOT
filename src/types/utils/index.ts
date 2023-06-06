import {
  Guild,
  GuildMember,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Locale,
} from "discord.js";

export type ReplyOrUpdate<IsReply extends boolean> = Promise<
  IsReply extends true ? InteractionReplyOptions : InteractionUpdateOptions
>;

export type MessageComponentRenderContext = {
  guild: Guild;
  member: GuildMember;
  locale: Locale;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "production";
    }
  }
}
