// Bit Flags for Command Requirements
export enum CommandRequirements {
  NOTHING = 1 << 0,
  AUDIO_NODE = 1 << 1,
  TRACK_PLAYING = 1 << 2,
  VOICE_CONNECTED = 1 << 3,
  VOICE_SAME_CHANNEL = 1 << 4,
  LISTEN_STATUS = 1 << 5,
}
