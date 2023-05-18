// This is an interface for the arguments that will be passed to the KafuuBootStrapper function.
export interface KafuuBootStrapperArgs {
  register: boolean; // A boolean value indicating whether or not to register the bot.
  shard: boolean; // A boolean value indicating whether or not to use sharding.
  config: string; // A string value representing the path to the configuration file.
  debug: boolean; // A boolean value indicating whether or not to enable debug mode.
  clean_commands: boolean; // A boolean value indicating whether or not to clean up commands.
  experimental_api: boolean; // A boolean value indicating whether or not to use the experimental API.
  port: number; // A number value representing the port to use.
}

// This is an interface for the response returned by the Discord gateway.
export interface DiscordGatewayResponse {
  url: string; // A string value representing the URL of the gateway.
  shards: number; // A number value representing the number of shards.
  session_start_limit: {
    // An object representing the session start limit.
    total: number; // A number value representing the total number of session starts.
    remaining: number; // A number value representing the remaining number of session starts.
    reset_after: number; // A number value representing the time in milliseconds after which the session start limit resets.
    max_concurrency: number; // A number value representing the maximum number of concurrent session starts.
  };
}
