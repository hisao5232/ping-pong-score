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
      // コート交代して次のセットへ（名前・セット数・次の初期サーブを入れ替えてスコアリセット）
      const nextSetsA = winnerModal === "A" ? setsA + 1 : setsA;
      const nextSetsB = winnerModal === "B" ? setsB + 1 : setsB;

      // プレイヤー名・セット数・サーブ権を左右入れ替え
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

    // ★スコアを確実に0にリセット
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
    <main className="h-screen w-screen bg-white text-slate-900 flex flex-col justify-between p-2 sm:p-3 select-none touch-manipulation font-sans overflow-hidden">
      {/* 1. コンパクトヘッダー（スクロール防止） */}
      <header className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-800 font-extrabold tracking-wider text-xs sm:text-sm">
            TABLE TENNIS
          </span>
          {isDeuce && (
            <span className="bg-rose-600 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded font-black animate-pulse">
              DEUCE (タイブレーク)
            </span>
          )}
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          {/* キャンセル / 1点戻すボタン */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-2.5 py-1 rounded font-bold text-xs transition ${
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
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs active:scale-95 transition shadow-sm"
          >
            ⇄ コート交代
          </button>

          {/* リセット */}
          <button
            onClick={handleFullReset}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs active:scale-95 transition shadow-sm"
          >
            リセット
          </button>
        </div>
      </header>

      {/* 2. メインスコアエリア (スクロール防止のためflex-1 & min-h-0) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-0 my-1.5">
        {/* --- プレイヤー A --- */}
        <div
          className={`relative flex flex-col justify-between p-3 sm:p-4 rounded-xl border-4 transition-all duration-200 ${
            currentServer === "A"
              ? "border-amber-400 bg-amber-50/30 shadow-md"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {/* 大型サーブ権表示 & 先攻選択 */}
          <div className="flex justify-between items-center h-9">
            {currentServer === "A" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-sm sm:text-base tracking-wider animate-pulse shadow-md border border-amber-500">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("A")}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                先攻に変更
              </button>
            )}

            {/* 獲得セット数表示 */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold block tracking-widest uppercase leading-none">
                SETS
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">
                {setsA}
              </span>
            </div>
          </div>

          {/* プレイヤー名編集 */}
          <div className="mt-1">
            <input
              type="text"
              value={playerAName}
              onChange={(e) => setPlayerAName(e.target.value)}
              className="w-full bg-transparent text-lg sm:text-xl font-black border-b-2 border-slate-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 text-slate-800"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア（画面高さに合わせて自動伸縮） */}
          <div
            onClick={() => handleAddPoint("A")}
            className="flex-1 flex items-center justify-center cursor-pointer min-h-0 active:scale-95 transition-transform"
          >
            <span className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-slate-900 leading-none">
              {scoreA}
            </span>
          </div>

          {/* 個別キャンセル（1点減算） */}
          <button
            onClick={() => {
              if (scoreA > 0) {
                saveHistory();
                setScoreA((prev) => prev - 1);
              }
            }}
            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs sm:text-sm active:bg-slate-400 transition shrink-0"
          >
            -1 点
          </button>
        </div>

        {/* --- プレイヤー B --- */}
        <div
          className={`relative flex flex-col justify-between p-3 sm:p-4 rounded-xl border-4 transition-all duration-200 ${
            currentServer === "B"
              ? "border-amber-400 bg-amber-50/30 shadow-md"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          {/* 大型サーブ権表示 & 先攻選択 */}
          <div className="flex justify-between items-center h-9">
            {currentServer === "B" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-sm sm:text-base tracking-wider animate-pulse shadow-md border border-amber-500">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("B")}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                先攻に変更
              </button>
            )}

            {/* 獲得セット数表示 */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold block tracking-widest uppercase leading-none">
                SETS
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">
                {setsB}
              </span>
            </div>
          </div>

          {/* プレイヤー名編集 */}
          <div className="mt-1">
            <input
              type="text"
              value={playerBName}
              onChange={(e) => setPlayerBName(e.target.value)}
              className="w-full bg-transparent text-lg sm:text-xl font-black border-b-2 border-slate-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 text-slate-800"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア（画面高さに合わせて自動伸縮） */}
          <div
            onClick={() => handleAddPoint("B")}
            className="flex-1 flex items-center justify-center cursor-pointer min-h-0 active:scale-95 transition-transform"
          >
            <span className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-slate-900 leading-none">
              {scoreB}
            </span>
          </div>

          {/* 個別キャンセル（1点減算） */}
          <button
            onClick={() => {
              if (scoreB > 0) {
                saveHistory();
                setScoreB((prev) => prev - 1);
              }
            }}
            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs sm:text-sm active:bg-slate-400 transition shrink-0"
          >
            -1 点
          </button>
        </div>
      </div>

      {/* 3. セット取得モーダル */}
      {winnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl max-w-xs sm:max-w-sm w-full text-center shadow-2xl">
            <div className="text-3xl mb-1">🎉</div>
            <h2 className="text-xl font-black text-emerald-600 mb-1">
              セット獲得！
            </h2>
            <p className="text-slate-800 font-bold text-base mb-4">
              {winnerModal === "A" ? playerAName : playerBName} がこのセットを取得しました。
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => confirmSetWin(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition active:scale-95 shadow"
              >
                コートを交代して次のセットへ
              </button>
              <button
                onClick={() => confirmSetWin(false)}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition active:scale-95"
              >
                コート交代せず次のセットへ
              </button>
              <button
                onClick={handleUndo}
                className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-xs transition"
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
