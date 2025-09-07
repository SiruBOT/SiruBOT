import { ApplyOptions } from '@sapphire/decorators';
import { Command, UserError } from '@sapphire/framework';
import {
	ApplicationIntegrationType,
	ChatInputCommandInteraction,
	MessageFlags,
	AutocompleteInteraction,
} from 'discord.js';
import { SearchPlatform, Track } from 'lavalink-client';
import { getSimpleYouTubeSuggestions } from '@sirubot/utils';
import * as view from '../view/play';

@ApplyOptions<Command.Options>({
	enabled: true,
	name: '재생',
	description: '음성 채널에서 노래를 재생해요.',
	preconditions: ['NodeAvailable', 'VoiceConnected', 'SameVoiceChannel', 'MemberListenable', 'ClientVoiceConnectable', 'ClientVoiceSpeakable']
})
export class PlayCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => {
			builder
				.setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption((option) =>
					option.setName('검색어').setDescription('재생할 노래의 제목이나 주소를 입력해주세요.').setAutocomplete(true).setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('플랫폼')
						.setDescription('노래를 찾을 플랫폼을 선택해주세요.')
						.addChoices([
							{
								name: '유튜브',
								value: 'ytsearch'
							},
							{
								name: '사운드클라우드',
								value: 'scsearch'
							},
							{
								name: '스포티파이',
								value: 'spsearch'
							}
						])
						.setRequired(false)
				);
		});
	}

	public override async autocompleteRun(interaction: AutocompleteInteraction) {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === '검색어') {
			const query = focusedOption.value;

			// 쿼리가 너무 짧으면 기본 추천어 제공
			if (query.length < 2) {
				const defaultSuggestions = [
					'인기 음악',
					'최신 K-POP',
					'팝송 모음',
					'힙합 음악',
					'발라드 명곡',
					'일본 음악',
					'클래식 음악',
					'재즈 음악'
				];

				return interaction.respond(
					defaultSuggestions.map((suggestion) => ({
						name: suggestion,
						value: suggestion
					}))
				);
			}

			try {
				// Get suggestions
				const suggestions = await getSimpleYouTubeSuggestions(query, 25);

				// Respond with Discord autocomplete limit(25)
				const autocompleteChoices = suggestions.slice(0, 25).map((suggestion) => ({
					name: suggestion.length > 100 ? suggestion.substring(0, 97) + '...' : suggestion,
					value: suggestion.length > 100 ? suggestion.substring(0, 100) : suggestion
				}));

				return interaction.respond(autocompleteChoices);
			} catch (error) {
				// When error occurs, provide fallback suggestions
				const fallbackSuggestions = [query, `${query} 음악`, `${query} 노래`, `${query} 가사`, `${query} 플레이리스트`];

				return interaction.respond(
					fallbackSuggestions.map((suggestion) => ({
						name: suggestion.length > 100 ? suggestion.substring(0, 97) + '...' : suggestion,
						value: suggestion.length > 100 ? suggestion.substring(0, 100) : suggestion
					}))
				);
			}
		}

		return interaction.respond([]);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return;
		if (!interaction.member.voice.channelId) return;
		await interaction.deferReply();

		const voiceChannel = interaction.member.voice.channelId;

		const query = interaction.options.getString('검색어', true);
		const platform = (interaction.options.getString('플랫폼') || 'ytsearch') as SearchPlatform;

		const player =
			this.container.audio.getPlayer(interaction.guildId) ||
			(await this.container.audio.createPlayer({
				guildId: interaction.guildId,
				voiceChannelId: voiceChannel,
				textChannelId: interaction.channelId,
				selfDeaf: true,
				selfMute: false,
				instaUpdateFiltersFix: true,
				applyVolumeAsFilter: true,
				volume: 3
			}));

		const searchRes = await player.search({ query, source: platform }, interaction.user);
		switch (searchRes.loadType) {
			case 'error': {
				throw new UserError({
					message: '🛠️  음악 검색 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
					identifier: 'play_search_error'
				});
			}

			case 'empty': {
				throw new UserError({
					message: '🔎  검색 결과가 없어요. 다른 검색어로 다시 시도해 주세요.',
					identifier: 'play_search_empty'
				});
			}
		}

		const playerConnected = player.connected;

		if (!playerConnected) {
			try {
				await player.connect();
			} catch (error) {
				this.container.logger.error(error);
				throw new UserError({
					message: '🛠️  음성 채널에 접속할 수 없어요. 음성 채널 권한을 확인해주세요.',
					identifier: 'play_connect_error'
				});
			}
		}
		switch (searchRes.loadType) {
			case 'playlist': {
				// TODO: 나머지 곡 UI 개선하기
				const playlist = searchRes.playlist!;
				if (playlist.selectedTrack) {
					await player.queue.add(playlist.selectedTrack);

					// 나머지 곡들 개수 계산
					const remainingTracks = searchRes.tracks.filter((track) => track.info.identifier !== playlist.selectedTrack!.info.identifier);
					const remainingTracksCount = remainingTracks.length;

					if (remainingTracksCount > 0) {
						// 나머지 곡들이 있으면 추가할지 묻기
						await interaction.editReply({
							flags: MessageFlags.IsComponentsV2,
							components: [
								view.askPlaylistAdd({
									playlist,
									selectedTrack: playlist.selectedTrack as Track,
									remainTracks: remainingTracks as Track[],
									player
								})
							],
							allowedMentions: { users: [], roles: [] }
						});

						// 버튼 상호작용을 위한 collector 설정
						const collector = interaction.channel?.createMessageComponentCollector({
							filter: (i) => i.user.id === interaction.user.id && i.customId.includes('playlist_'),
							time: 30000,
							max: 1
						});

						collector?.on('collect', async (buttonInteraction) => {
							await buttonInteraction.deferUpdate();

							if (buttonInteraction.customId === 'playlist_add_remaining') {
								// 나머지 곡들을 대기열에 추가
								await player.queue.add(remainingTracks);

								await buttonInteraction.editReply({
									flags: MessageFlags.IsComponentsV2,
									components: [
										view.playlistQueued({
											playlist,
											tracks: remainingTracks as Track[]
										})
									],
									allowedMentions: { users: [], roles: [] }
								});
							} else if (buttonInteraction.customId === 'playlist_skip_remaining') {
								await buttonInteraction.editReply({
									flags: MessageFlags.IsComponentsV2,
									components: [
										view.trackAdded({
											track: playlist.selectedTrack as Track,
											queued: player.queue.current !== null,
											position: player.queue.tracks.length,
											totalDuration: player.queue.tracks.reduce((acc, track) => acc + (track.info.duration ?? 0), 0)
										})
									],
									allowedMentions: { users: [], roles: [] }
								});
							}
						});

						collector?.on('end', (collected) => {
							if (collected.size === 0) {
								// 시간 초과 시 메시지 업데이트
								interaction
									.editReply({
										flags: MessageFlags.IsComponentsV2,
										components: [
											view.trackAdded({
												track: playlist.selectedTrack as Track,
												queued: player.queue.current !== null,
												position: player.queue.tracks.length,
												totalDuration: player.queue.tracks.reduce((acc, track) => acc + (track.info.duration ?? 0), 0)
											})
										],
										allowedMentions: { users: [], roles: [] }
									})
									.catch(() => {});
							}
						});
					} else {
						// 나머지 곡이 없으면 일반적인 재생 메시지 표시
						await interaction.editReply({
							flags: MessageFlags.IsComponentsV2,
							components: [
								view.trackAdded({
									track: playlist.selectedTrack as Track,
									queued: player.queue.current !== null,
									position: player.queue.tracks.length,
									totalDuration: player.queue.tracks.reduce((acc, track) => acc + (track.info.duration ?? 0), 0)
								})
							],
							allowedMentions: { users: [], roles: [] }
						});
					}
				} else {
					// Playlist 추가
					await player.queue.add(searchRes.tracks);

					await interaction.editReply({
						flags: MessageFlags.IsComponentsV2,
						components: [
							view.playlistQueued({
								playlist,
								tracks: searchRes.tracks as Track[]
							})
						],
						allowedMentions: { users: [], roles: [] }
					});
				}
				break;
			}
			case 'track':
			case 'search': {
				await player.queue.add(searchRes.tracks[0]);
				await interaction.editReply({
					flags: MessageFlags.IsComponentsV2,
					components: [
						view.trackAdded({
							track: searchRes.tracks[0] as Track,
							queued: player.queue.current !== null,
							position: player.queue.tracks.length,
							totalDuration: player.queue.tracks.reduce((acc, track) => acc + (track.info.duration ?? 0), 0)
						})
					],
					allowedMentions: { users: [], roles: [] }
				});
			}
		}

		if (!player.playing) {
			await player.play(playerConnected ? { paused: false } : undefined);
		}
	}
}
