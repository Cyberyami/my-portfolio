const FACEIT_BASE = "https://open.faceit.com/data/v4";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Health check
		if (url.pathname === "/api/health") {
			return json({ ok: true }, 200, corsHeaders);
		}

		// MAIN ANALYZE ENDPOINT
		if (url.pathname === "/api/analyze") {
			try {
				const player = (url.searchParams.get("player") || "").trim();

				if (!player) {
					return json(
						{ error: "Player parameter is required" },
						400,
						corsHeaders
					);
				}

				if (player.length > 50) {
					return json(
						{ error: "Player name too long" },
						400,
						corsHeaders
					);
				}

				if (!/^[a-zA-Z0-9_-]+$/.test(player)) {
					return json(
						{ error: "Invalid player name format" },
						400,
						corsHeaders
					);
				}

				if (!env.FACEIT_API_KEY) {
					return json(
						{ error: "FACEIT_API_KEY not configured in Worker secrets" },
						500,
						corsHeaders
					);
				}

		
				const searchResults = await faceitFetch(
					`/search/players?nickname=${encodeURIComponent(player)}&limit=5`,
					env.FACEIT_API_KEY
				);
				
				
				const playerLower = player.toLowerCase();
				const matchedPlayer = searchResults?.items?.find(
					p => p.nickname.toLowerCase() === playerLower
				);
				
				if (!matchedPlayer) {
					return errorResponse("Player not found");
				}
				
				const playerId = matchedPlayer.player_id;
				const country = matchedPlayer.country || "N/A";
				const accountCreated = matchedPlayer.activated_at || null;

				// 2) LIFETIME STATS (CS2)
				const statsData = await faceitFetch(
					`/players/${playerId}/stats/cs2`,
					env.FACEIT_API_KEY
				);

				const lifetime = statsData?.lifetime || {};

				// Safe stat extraction - FaceIt API returns strings
				const kdRaw = pickStat(lifetime, [
					"Average K/D Ratio",
					"K/D Ratio",
					"K/D",
				]);
				const kd = parseFloat(kdRaw) || null;

				const winRateRaw = pickStat(lifetime, [
					"Win Rate %",
					"Win Rate",
					"Wins %",
				]);
				const winRate = parseFloat(winRateRaw) || null;

				const matchesRaw = pickStat(lifetime, [
					"Matches",
					"Total Matches",
				]);
				const matchesPlayed = parseInt(matchesRaw) || null;

				const headshotRaw = pickStat(lifetime, [
					"Headshots %",
					"Headshot %",
					"Average Headshots %",
				]);
				const headshot = parseFloat(headshotRaw) || null;

				// 3) MATCH HISTORY (last 20 matches)
				let matchHistory = [];
				let winStreak = 0;
				let recentWins = 0;
				let recentMatches = 0;
				let recentKD = null;
				let recentWinRate = null;
				let recentAvgHS = null;
				let validMatches = 0;

				try {
					const matchesData = await faceitFetch(
						`/players/${playerId}/history?game=cs2&offset=0&limit=20`,
						env.FACEIT_API_KEY
					);

					const items = matchesData?.items || [];
					
					// Process matches for UI (fetch detailed stats for each match)
					const matchPromises = items.slice(0, 10).map(async (match) => {
						try {
							// Fetch detailed match stats
							const matchStats = await faceitFetch(
								`/matches/${match.match_id}/stats`,
								env.FACEIT_API_KEY
							);
							
							// Find player's team and stats
							const rounds = matchStats?.rounds || [];
							let playerTeamStats = null;
							let isWin = false;
							
							for (const round of rounds) {
								const teams = round?.teams || [];
								for (const team of teams) {
									const players = team?.players || [];
									const player = players.find(p => p.player_id === playerId);
									if (player) {
										playerTeamStats = player.player_stats;
										// Check if this team won
										const teamStats = team.team_stats;
										isWin = teamStats?.['Team Win'] === '1';
										break;
									}
								}
								if (playerTeamStats) break;
							}
							
							const stats = playerTeamStats || {};
							
							// Extract map name from match stats or history
							let mapName = 'Unknown';
							if (rounds[0]?.round_stats?.Map) {
								mapName = rounds[0].round_stats.Map.replace('de_', '').replace('cs_', '');
								mapName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
							} else if (match.game_mode) {
								mapName = match.game_mode;
							}
							
							// Calculate actual match duration
							let duration = 'N/A';
							if (match.started_at && match.finished_at) {
								const durationMinutes = Math.round((match.finished_at - match.started_at) / 60);
								duration = `${durationMinutes}min`;
							}
							
							return {
								date: new Date(match.finished_at * 1000).toLocaleDateString(),
								result: isWin ? 'WIN' : 'LOSS',
								map: mapName,
								kills: parseInt(stats.Kills) || 0,
								deaths: parseInt(stats.Deaths) || 0,
								assists: parseInt(stats.Assists) || 0,
								kd: stats['K/D Ratio'] || '0.00',
								headshots: parseInt(stats['Headshots %']) || 0,
								duration: duration
							};
						} catch (err) {
							// Fallback to basic match info if stats fetch fails
							console.error(`Failed to fetch stats for match ${match.match_id}:`, err);
							return {
								date: new Date(match.finished_at * 1000).toLocaleDateString(),
								result: 'N/A',
								map: 'Unknown',
								kills: 0,
								deaths: 0,
								assists: 0,
								kd: '0.00',
								headshots: 0,
								duration: 'N/A'
							};
						}
					});
					
					matchHistory = await Promise.all(matchPromises);

					// Calculate win streak & recent performance analytics
					let currentStreak = 0;
					let recentKills = 0;
					let recentDeaths = 0;
					let recentHeadshots = 0;
					
					for (const match of matchHistory) {
						if (match.result === 'N/A') continue;
						
						recentMatches++;
						if (match.result === 'WIN') {
							recentWins++;
							currentStreak++;
							winStreak = Math.max(winStreak, currentStreak);
						} else {
							currentStreak = 0;
						}
						
						// Accumulate stats for recent K/D and HS% calculation
						if (match.kills > 0 || match.deaths > 0) {
							recentKills += match.kills;
							recentDeaths += match.deaths;
							recentHeadshots += match.headshots;
							validMatches++;
						}
					}
					
					// Calculate recent averages
					recentKD = validMatches > 0 && recentDeaths > 0 ? recentKills / recentDeaths : null;
					recentWinRate = recentMatches > 0 ? (recentWins / recentMatches) * 100 : null;
					recentAvgHS = validMatches > 0 ? recentHeadshots / validMatches : null;
				} catch (err) {
					console.error('Match history fetch failed:', err);
					// Continue without match history
				}

				// 4) CALCULATE METRICS
				
				// Account age in days
				let accountAgeDays = 0;
				let accountAgeNorm = 0;
				if (accountCreated) {
					const createdDate = new Date(accountCreated);
					const now = new Date();
					accountAgeDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
					// Normalize: 0-365 days = 0-100 (older accounts = lower score)
					accountAgeNorm = Math.max(0, 100 - Math.min(100, (accountAgeDays / 365) * 100));
				}

				// Consistency (based on recent matches vs lifetime stats)
				let consistencyScore = 50;
				if (recentMatches > 0 && winRate !== null) {
					const recentWinRate = (recentWins / recentMatches) * 100;
					const variance = Math.abs(recentWinRate - winRate);
					// Lower variance = more consistent = lower smurf indicator
					consistencyScore = Math.min(100, variance * 2);
				}

				// Improvement (recent win rate vs lifetime)
				let improvementScore = 0;
				if (recentMatches > 0 && winRate !== null) {
					const recentWinRate = (recentWins / recentMatches) * 100;
					improvementScore = Math.max(0, Math.min(100, (recentWinRate - winRate) * 2));
				}

				// 5) BASIC SMURF SCORING (v1 rule-based)
				let score = 10;
				const flags = [];

				// Low match count
				if (matchesPlayed !== null && matchesPlayed < 50) {
					score += 25;
					flags.push(flag("medium", "Low Match Count", `Only ${matchesPlayed} matches played.`));
				}

				// High K/D
				if (kd !== null && kd >= 1.3) {
					score += 30;
					flags.push(flag("high", "High K/D Ratio", `K/D of ${kd} is unusually high.`));
				}

				// High win rate
				if (winRate !== null && winRate >= 60) {
					score += 20;
					flags.push(flag("medium", "High Win Rate", `Win rate ${winRate}% is suspicious.`));
				}

				// High headshot
				if (headshot !== null && headshot >= 55) {
					score += 15;
					flags.push(flag("low", "High Headshot %", `HS% ${headshot} indicates strong mechanical skill.`));
				}

				// New account
				if (accountAgeDays > 0 && accountAgeDays < 30) {
					score += 20;
					flags.push(flag("high", "New Account", `Account is only ${accountAgeDays} days old.`));
				}

				// High win streak
				if (winStreak >= 5) {
					score += 15;
					flags.push(flag("medium", "Long Win Streak", `Current win streak of ${winStreak} matches.`));
				}

				// Recent K/D spike (much better than lifetime)
				if (recentKD !== null && kd !== null && recentKD > kd + 0.4 && recentKD >= 1.5) {
					score += 20;
					flags.push(flag("high", "Recent K/D Spike", `Recent K/D (${recentKD.toFixed(2)}) is significantly higher than lifetime (${kd.toFixed(2)}).`));
				}

				// Recent win rate spike
				if (recentWinRate !== null && winRate !== null && recentWinRate > winRate + 15 && recentWinRate >= 70) {
					score += 15;
					flags.push(flag("medium", "Recent Win Rate Spike", `Recent win rate (${recentWinRate.toFixed(0)}%) much higher than lifetime (${winRate.toFixed(0)}%).`));
				}

				// Consistently dominating recent matches (high K/D in most games)
				if (validMatches >= 5) {
					const highKDMatches = matchHistory.filter(m => parseFloat(m.kd) >= 1.5).length;
					if (highKDMatches >= 7) {
						score += 10;
						flags.push(flag("medium", "Consistent Dominance", `${highKDMatches} out of ${validMatches} recent matches with K/D ≥ 1.5.`));
					}
				}
				// High inconsistency (rank variance)
				if (consistencyScore >= 60) {
					score += 15;
					flags.push(flag("high", "Extreme Inconsistency", `Performance variance of ${consistencyScore.toFixed(0)}% indicates unstable skill level.`));
				}

				// Rapid improvement
				if (improvementScore >= 60) {
					score += 15;
					flags.push(flag("high", "Rapid Improvement", `${improvementScore.toFixed(0)}% improvement in recent games is unusual.`));
				}
				score = clamp(score, 0, 100);


				const response = {
					smurf_score: score,
					win_rate: winRate !== null ? parseFloat(winRate.toFixed(1)) : 0,
					kd_ratio: kd !== null ? parseFloat(kd.toFixed(2)) : 0,
					matches_played: matchesPlayed ?? 0,
					metrics: {
						age: { 
							raw: accountAgeDays > 0 ? `${accountAgeDays} days` : "N/A", 
							norm: accountAgeNorm 
						},
						consistency: { 
							raw: recentMatches > 0 ? `${consistencyScore.toFixed(0)}%` : "N/A", 
							norm: consistencyScore 
						},
						headshot: { 
							raw: headshot !== null ? `${headshot.toFixed(1)}%` : "N/A", 
							norm: headshot !== null ? Math.min(headshot, 100) : 0 
						},
						winstreak: { 
							raw: winStreak > 0 ? `${winStreak} wins` : "0", 
							norm: Math.min((winStreak / 10) * 100, 100) 
						},
						improvement: { 
							raw: recentMatches > 0 ? `${improvementScore.toFixed(0)}%` : "N/A", 
							norm: improvementScore 
						},
						playtime: { 
							raw: matchesPlayed > 0 ? `${matchesPlayed} matches` : "N/A", 
							// Low matches = moderate flag, not extreme. Very low (<30) = 60%, medium (30-100) = 30%, high (100+) = low
							norm: matchesPlayed < 30 ? 60 : matchesPlayed < 100 ? 30 : Math.max(0, 30 - (matchesPlayed - 100) / 20)
						},
						region: { 
							raw: country, 
							norm: 50 
						},
						behavior: { 
							raw: "N/A", 
							norm: 0 
						},
					},
					flags,
					matches: matchHistory
				};

				return json(response, 200, {
					...corsHeaders,
					"Cache-Control": "public, max-age=120",
				});
			} catch (err) {
				console.error('Analysis error:', err);
				const errorMessage = err?.message?.includes('Player not found') 
					? 'Player not found' 
					: 'Analysis failed. Please try again later.';
				return json(
					{
						error: "analysis_failed",
						message: errorMessage,
					},
					500,
					corsHeaders
				);
			}
		}

		return new Response("Not Found", { status: 404 });
	},
};

// ---------- HELPERS ----------
async function faceitFetch(path, apiKey) {
	const res = await fetch(`${FACEIT_BASE}${path}`, {
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`FACEIT API ${res.status}: ${text}`);
	}

	return res.json();
}

function pickStat(obj, keys) {
	for (const key of keys) {
		const val = obj?.[key];
		if (val === undefined || val === null || val === "") continue;
		return String(val).trim();
	}
	return null;
}

function pickNumber(obj, keys) {
	for (const key of keys) {
		const val = obj?.[key];
		if (val === undefined || val === null) continue;
		const num = Number(String(val).replace(",", "."));
		if (!Number.isNaN(num)) return num;
	}
	return null;
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

function flag(level, title, description) {
	return { level, title, description };
}

function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
	});
}