import { Collection, GuildMember, VoiceBasedChannel } from "discord.js";
import { getListeningMembers } from "@/utils/voice";

export class VoteSkip {
  skipUserIds: string[];
  constructor() {
    this.skipUserIds = [];
  }

  public clearSkippers(): void {
    this.skipUserIds = [];
  }

  public addSkipper(userId: string): string {
    this.skipUserIds.push(userId);
    return userId;
  }

  public isAgreedHalf(voiceChannel: VoiceBasedChannel): boolean {
    // Cond: 듣고있는 사람들의 절반(올림 값) 보다 투표한 사람이 많거나 같다면 true 아니면 false
    return (
      this.getNumberOfVotesRequired(voiceChannel) <=
      this.getVotedMembers(voiceChannel).size
    );
  }

  public getNumberOfVotesRequired(voiceChannel: VoiceBasedChannel): number {
    // 1.5 -> 2 절반의 올림값
    return Math.ceil(getListeningMembers(voiceChannel).size / 2);
  }

  public getVotedMembers(
    voiceChannel: VoiceBasedChannel
  ): Collection<string, GuildMember> {
    return getListeningMembers(voiceChannel).filter((user) =>
      this.skipUserIds.includes(user.id)
    );
  }

  public isSkipVoted(userId: string): boolean {
    return this.skipUserIds.includes(userId);
  }
}
