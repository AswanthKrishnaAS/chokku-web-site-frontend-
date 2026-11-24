import React from 'react';
import { Gamepad2, Gift, Disc, Compass, Trophy, Award, Coins, Wallet, Sparkles } from 'lucide-react';

export interface GameMetrics {
  participants: number;
  plays: number;
  pointsEarned: number;
}

export interface PlayerLeaderboardItem {
  id: string;
  name: string;
  username: string;
  phone: string;
  avatarUrl?: string;
  gamesPlayed: number;
  pointsEarned: number;
  walletBalance: number;
  rank: number;
}

export interface GamesAnalyticsData {
  catchTheGift: GameMetrics;
  spinAndWin: GameMetrics;
  treasureHunt: GameMetrics;
  totalGameParticipants: number;
  totalGamesPlayed: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  remainingPointsBalance: number;
  topPlayersLeaderboard: PlayerLeaderboardItem[];
}

interface GamesAnalyticsSectionProps {
  data?: GamesAnalyticsData;
}

export const GamesAnalyticsSection: React.FC<GamesAnalyticsSectionProps> = ({
  data = {
    catchTheGift: { participants: 0, plays: 0, pointsEarned: 0 },
    spinAndWin: { participants: 0, plays: 0, pointsEarned: 0 },
    treasureHunt: { participants: 0, plays: 0, pointsEarned: 0 },
    totalGameParticipants: 0,
    totalGamesPlayed: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    remainingPointsBalance: 0,
    topPlayersLeaderboard: [],
  },
}) => {
  const safeData = data || {
    catchTheGift: { participants: 0, plays: 0, pointsEarned: 0 },
    spinAndWin: { participants: 0, plays: 0, pointsEarned: 0 },
    treasureHunt: { participants: 0, plays: 0, pointsEarned: 0 },
    totalGameParticipants: 0,
    totalGamesPlayed: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    remainingPointsBalance: 0,
    topPlayersLeaderboard: [],
  };
  const leaderboard = Array.isArray(safeData.topPlayersLeaderboard) ? safeData.topPlayersLeaderboard : [];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>Games & Rewards Analytics</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Gamification & Coins
          </span>
        </h3>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          Tracking user interaction across Catch the Gift, Spin & Win, and Treasure Hunt
        </p>
      </div>

      {/* 3 Games Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Game 1: Catch the Gift */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-black text-gray-900">Catch the Gift</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active Game
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Players</span>
              <span className="text-lg font-black text-gray-900">
                {(Number(safeData.catchTheGift?.participants) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Plays</span>
              <span className="text-lg font-black text-emerald-600">
                {(Number(safeData.catchTheGift?.plays) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Points Won</span>
              <span className="text-lg font-black text-amber-600">
                {(Number(safeData.catchTheGift?.pointsEarned) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Game 2: Spin & Win */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Disc className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-black text-gray-900">Spin & Win</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Active Game
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Players</span>
              <span className="text-lg font-black text-gray-900">
                {(Number(safeData.spinAndWin?.participants) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Total Spins</span>
              <span className="text-lg font-black text-indigo-600">
                {(Number(safeData.spinAndWin?.plays) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Coins Won</span>
              <span className="text-lg font-black text-amber-600">
                {(Number(safeData.spinAndWin?.pointsEarned) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Game 3: Treasure Hunt */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-black text-gray-900">Treasure Hunt</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Store Coin Hunt
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Players</span>
              <span className="text-lg font-black text-gray-900">
                {(Number(safeData.treasureHunt?.participants) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Found</span>
              <span className="text-lg font-black text-amber-600">
                {(Number(safeData.treasureHunt?.plays) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Coins Earned</span>
              <span className="text-lg font-black text-amber-600">
                {(Number(safeData.treasureHunt?.pointsEarned) || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Global Points & Coins KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Game Participants
          </span>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {(Number(safeData.totalGameParticipants) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Unique registered players</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Games Played
          </span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {(Number(safeData.totalGamesPlayed) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Combined game sessions</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Points Earned
          </span>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {(Number(safeData.totalPointsEarned) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Reward coins issued</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Remaining Points Balance
          </span>
          <div className="text-2xl font-black text-[#488710] tracking-tight">
            {(Number(safeData.remainingPointsBalance) || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-gray-400">Total in customer wallets</span>
        </div>
      </div>

      {/* Top Players Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-extrabold text-gray-900">Top Game Players Leaderboard</h4>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Highest Point Earners</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 text-center w-14">Rank</th>
                <th className="py-3 px-4">Player Name</th>
                <th className="py-3 px-3">Username / Phone</th>
                <th className="py-3 px-3 text-center">Games Played</th>
                <th className="py-3 px-3 text-center">Total Points Earned</th>
                <th className="py-3 px-4 text-right">Wallet Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                    No game play records found in the database.
                  </td>
                </tr>
              ) : (
                leaderboard.map((player, idx) => (
                  <tr key={player.id || `player-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 text-center">
                      {player.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs">
                          🥇
                        </span>
                      ) : player.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                          🥈
                        </span>
                      ) : player.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/60 text-white font-black text-xs shadow-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="font-bold text-gray-400">#{player.rank || idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {player.name || 'Anonymous Player'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                      {player.username || player.phone || '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-800">
                      {(Number(player.gamesPlayed) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-600">
                      {(Number(player.pointsEarned) || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#488710]">
                      {(Number(player.walletBalance) || 0).toLocaleString()} coins
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
