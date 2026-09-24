"use client";

import { useState } from "react";

// 試合履歴の型定義（1点戻す用）
type GameHistory = {
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  initialServer: "A" | "B";
  playerAName: string;
  playerBName: string;
};

export default function TableTennisScoreboard() {
  // 基本状態
  const [playerAName, setPlayerAName] = useState("選手 A");
  const [playerBName, setPlayerBName] = useState("選手 B");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);

  // 最初のサーブ権（"A" または "B"）
  const [initialServer, setInitialServer] = useState<"A" | "B">("A");

  // モーダル管理（セット獲得時）
  const [winnerModal, setWinnerModal] = useState<"A" | "B" | null>(null);

  // 履歴スタック（1点戻す/キャンセル用）
  const [history, setHistory] = useState<GameHistory[]>([]);

  // --- 振動フィードバック ---
  const triggerVibration = (pattern: number | number[] = 100) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // --- サーブ権・タイブレーク判定ロジック ---
  const totalScore = scoreA + scoreB;
  
  // デュース（10-10以上）の判定
  const isDeuce = scoreA >= 10 && scoreB >= 10;
  
  // デュース時は1点交代、通常時は2点交代
  const serverChangeInterval = isDeuce ? 1 : 2;
  const currentServerSwitch = Math.floor(totalScore / serverChangeInterval) % 2;
  
  const currentServer =
    currentServerSwitch === 0
      ? initialServer
      : initialServer === "A"
      ? "B"
      : "A";

  // --- 状態変更前の履歴保存 ---
  const saveHistory = () => {
    setHistory((prev) => [
      ...prev,
      { scoreA, scoreB, setsA, setsB, initialServer, playerAName, playerBName },
    ]);
  };

  // --- 得点処理 ---
  const handleAddPoint = (player: "A" | "B") => {
    // 得点追加時の振動（短く1回）
    triggerVibration(100);

    saveHistory();
    let nextA = scoreA;
    let nextB = scoreB;

    if (player === "A") nextA += 1;
    else nextB += 1;

    setScoreA(nextA);
    setScoreB(nextB);

    // 勝利条件のチェック (11点以上かつ2点差)
    if (nextA >= 11 && nextA - nextB >= 2) {
      setWinnerModal("A");
    } else if (nextB >= 11 && nextB - nextA >= 2) {
      setWinnerModal("B");
    }
  };

  // --- 1点戻す（キャンセル） ---
  const handleUndo = () => {
    if (history.length === 0) return;

    // 戻す時の振動（2回「トトッ」）
    triggerVibration([50, 50, 50]);

    const lastState = history[history.length - 1];
    
    setScoreA(lastState.scoreA);
    setScoreB(lastState.scoreB);
    setSetsA(lastState.setsA);
    setSetsB(lastState.setsB);
    setInitialServer(lastState.initialServer);
    setPlayerAName(lastState.playerAName);
    setPlayerBName(lastState.playerBName);

    // 履歴を1つ削除
    setHistory((prev) => prev.slice(0, -1));
    setWinnerModal(null);
  };

  // --- セット確定処理（モーダル選択時） ---
  const confirmSetWin = (shouldSwapCourt: boolean) => {
    if (!winnerModal) return;

    if (shouldSwapCourt) {
      // コート交代して次のセットへ
      const nextSetsA = winnerModal === "A" ? setsA + 1 : setsA;
      const nextSetsB = winnerModal === "B" ? setsB + 1 : setsB;

      setPlayerAName(playerBName);
      setPlayerBName(playerAName);
      setSetsA(nextSetsB);
      setSetsB(nextSetsA);
      setInitialServer(initialServer === "A" ? "A" : "B");
    } else {
      // コート交代せずに次のセットへ
      if (winnerModal === "A") setSetsA((prev) => prev + 1);
      else setSetsB((prev) => prev + 1);
      setInitialServer((prev) => (prev === "A" ? "B" : "A"));
    }

    setScoreA(0);
    setScoreB(0);
    setWinnerModal(null);
  };

  // --- 手動コートチェンジ実行 ---
  const executeCourtChange = () => {
    saveHistory();
    setPlayerAName(playerBName);
    setPlayerBName(playerAName);
    setScoreA(scoreB);
    setScoreB(scoreA);
    setSetsA(setsB);
    setSetsB(setsA);
    setInitialServer((prev) => (prev === "A" ? "B" : "A"));
  };

  // --- 全体リセット ---
  const handleFullReset = () => {
    if (confirm("試合スコアを全てリセットしますか？")) {
      setScoreA(0);
      setScoreB(0);
      setSetsA(0);
      setSetsB(0);
      setHistory([]);
      setWinnerModal(null);
    }
  };

  return (
    <main className="h-screen w-screen bg-white text-slate-900 flex flex-col justify-between p-1.5 select-none touch-manipulation font-sans overflow-hidden">
      {/* 1. 超超コンパクトヘッダー (1画面に確実に納める) */}
      <header className="flex justify-between items-center bg-slate-100 px-2 py-1 rounded border border-slate-300 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 font-extrabold tracking-wider text-[11px] sm:text-xs">
            TABLE TENNIS
          </span>
          {isDeuce && (
            <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black animate-pulse">
              DEUCE
            </span>
          )}
        </div>

        <div className="flex gap-1">
          {/* キャンセル / 1点戻すボタン */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-2 py-0.5 rounded font-bold text-[11px] transition ${
              history.length > 0
                ? "bg-amber-500 hover:bg-amber-600 text-white active:scale-95 shadow-sm"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            ↩ 1点戻す
          </button>

          {/* 手動コートチェンジ */}
          <button
            onClick={executeCourtChange}
            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] active:scale-95 transition shadow-sm"
          >
            ⇄ コート交代
          </button>

          {/* リセット */}
          <button
            onClick={handleFullReset}
            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] active:scale-95 transition shadow-sm"
          >
            リセット
          </button>
        </div>
      </header>

      {/* 2. メインスコアエリア (1画面収容用) */}
      <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0 my-1">
        {/* --- プレイヤー A --- */}
        <div
          className={`relative flex flex-col justify-between p-2 rounded-xl transition-all duration-200 min-h-0 ${
            currentServer === "A"
              ? "border-8 border-orange-500 bg-orange-50/20 shadow-md"
              : "border-2 border-slate-300 bg-slate-50"
          }`}
        >
          {/* 大型サーブ権表示 & 先攻選択 */}
          <div className="flex justify-between items-center h-8 shrink-0">
            {currentServer === "A" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg text-xs sm:text-sm tracking-wider animate-pulse shadow border border-amber-500">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("A")}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                先攻に変更
              </button>
            )}

            {/* 大型セット数表示 */}
            <div className="text-right flex items-baseline gap-1">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                SETS
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 leading-none">
                {setsA}
              </span>
            </div>
          </div>

          {/* プレイヤー名編集 */}
          <div className="mt-0.5 shrink-0">
            <input
              type="text"
              value={playerAName}
              onChange={(e) => setPlayerAName(e.target.value)}
              className="w-full bg-transparent text-base sm:text-lg font-black border-b border-slate-300 focus:border-indigo-600 focus:outline-none px-0.5 py-0 text-slate-800"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア（フレキシブル伸縮） */}
          <div
            onClick={() => handleAddPoint("A")}
            className="flex-1 flex items-center justify-center cursor-pointer min-h-0 active:scale-95 transition-transform"
          >
            <span className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-slate-900 leading-none">
              {scoreA}
            </span>
          </div>

          {/* 個別キャンセル（1点減算） */}
          <button
            onClick={() => {
              if (scoreA > 0) {
                // 1点減算時の振動（2回「トトッ」）
                triggerVibration([50, 50, 50]);
                saveHistory();
                setScoreA((prev) => prev - 1);
              }
            }}
            className="w-full py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs active:bg-slate-400 transition shrink-0"
          >
            -1 点
          </button>
        </div>

        {/* --- プレイヤー B --- */}
        <div
          className={`relative flex flex-col justify-between p-2 rounded-xl transition-all duration-200 min-h-0 ${
            currentServer === "B"
              ? "border-8 border-orange-500 bg-orange-50/20 shadow-md"
              : "border-2 border-slate-300 bg-slate-50"
          }`}
        >
          {/* 大型サーブ権表示 & 先攻選択 */}
          <div className="flex justify-between items-center h-8 shrink-0">
            {currentServer === "B" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg text-xs sm:text-sm tracking-wider animate-pulse shadow border border-amber-500">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("B")}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium"
              >
                先攻に変更
              </button>
            )}

            {/* 大型セット数表示 */}
            <div className="text-right flex items-baseline gap-1">
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                SETS
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 leading-none">
                {setsB}
              </span>
            </div>
          </div>

          {/* プレイヤー名編集 */}
          <div className="mt-0.5 shrink-0">
            <input
              type="text"
              value={playerBName}
              onChange={(e) => setPlayerBName(e.target.value)}
              className="w-full bg-transparent text-base sm:text-lg font-black border-b border-slate-300 focus:border-indigo-600 focus:outline-none px-0.5 py-0 text-slate-800"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア（フレキシブル伸縮） */}
          <div
            onClick={() => handleAddPoint("B")}
            className="flex-1 flex items-center justify-center cursor-pointer min-h-0 active:scale-95 transition-transform"
          >
            <span className="text-6xl sm:text-8xl font-black font-mono tracking-tighter text-slate-900 leading-none">
              {scoreB}
            </span>
          </div>

          {/* 個別キャンセル（1点減算） */}
          <button
            onClick={() => {
              if (scoreB > 0) {
                // 1点減算時の振動（2回「トトッ」）
                triggerVibration([50, 50, 50]);
                saveHistory();
                setScoreB((prev) => prev - 1);
              }
            }}
            className="w-full py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs active:bg-slate-400 transition shrink-0"
          >
            -1 点
          </button>
        </div>
      </div>

      {/* 3. セット取得モーダル */}
      {winnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl max-w-xs w-full text-center shadow-2xl">
            <div className="text-3xl mb-1">🎉</div>
            <h2 className="text-lg font-black text-emerald-600 mb-0.5">
              セット獲得！
            </h2>
            <p className="text-slate-800 font-bold text-sm mb-3">
              {winnerModal === "A" ? playerAName : playerBName} がこのセットを取得しました。
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => confirmSetWin(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition active:scale-95 shadow"
              >
                コートを交代して次のセットへ
              </button>
              <button
                onClick={() => confirmSetWin(false)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition active:scale-95"
              >
                コート交代せず次のセットへ
              </button>
              <button
                onClick={handleUndo}
                className="w-full py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-[11px] transition"
              >
                キャンセル（1点戻す）
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
