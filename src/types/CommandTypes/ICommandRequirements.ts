export interface ICommandRequirements {
  audioNode: boolean;
  trackPlaying: boolean;
  voiceStatus: {
    listenStatus: boolean;
    sameChannel: boolean;
    voiceConnected: boolean;
  };
}
