import Discord from "discord.js";
import type Cluster from "discord-hybrid-sharding";
import type { ISettings } from "../types";

class Client extends Discord.Client {
  _settings: ISettings;
  cluster?: Cluster.Client;

  constructor(_clientOptions: Discord.ClientOptions, _botSettings: ISettings) {
    // Discord#ClientOptions
    super(_clientOptions);
    this._settings = _botSettings;
  }

  async start(): Promise<void> {
    console.log("Starting");
    this.login(this._settings.bot.token);
  }
}

export { Client };
