"use client";

import { useState } from "react";

// 試合履歴の型定義（1点戻す/セットキャンセル用）
type GameHistory = {
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  initialServer: "A" | "B";
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

  // 履歴スタック（1点戻す・キャンセル機能用）
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
      { scoreA, scoreB, setsA, setsB, initialServer },
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

    // 履歴を1つ削除
    setHistory((prev) => prev.slice(0, -1));
    setWinnerModal(null);
  };

  // --- セット確定処理（モーダルから確定時） ---
  const confirmSetWin = (shouldSwapCourt: boolean) => {
    if (!winnerModal) return;

    // セット数を加算
    if (winnerModal === "A") setSetsA((prev) => prev + 1);
    else setSetsB((prev) => prev + 1);

    // スコアリセット＆次のセットの第一サーバー交代
    setScoreA(0);
    setScoreB(0);
    const nextInitialServer = initialServer === "A" ? "B" : "A";
    setInitialServer(nextInitialServer);

    // コートチェンジが選択された場合
    if (shouldSwapCourt) {
      executeCourtChange();
    }

    setWinnerModal(null);
  };

  // --- コートチェンジ実行 ---
  const executeCourtChange = () => {
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
    <main className="h-screen w-screen bg-slate-950 text-white flex flex-col justify-between p-4 select-none touch-manipulation font-sans">
      {/* 1. ヘッダー / コントロールバー */}
      <header className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold tracking-wider text-sm sm:text-base">
            TABLE TENNIS
          </span>
          {isDeuce && (
            <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded font-bold border border-rose-500/30 animate-pulse">
              DEUCE (タイブレーク)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* キャンセル / 1点戻すボタン */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition ${
              history.length > 0
                ? "bg-amber-600 hover:bg-amber-500 active:scale-95 text-white"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            ↩ 1点戻す
          </button>
          
          {/* 手動コートチェンジ */}
          <button
            onClick={() => {
              saveHistory();
              executeCourtChange();
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition"
          >
            ⇄ コート交代
          </button>

          {/* リセット */}
          <button
            onClick={handleFullReset}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg font-semibold text-xs sm:text-sm active:scale-95 transition"
          >
            リセット
          </button>
        </div>
      </header>

      {/* 2. メインスコアエリア (2カラム) */}
      <div className="grid grid-cols-2 gap-4 flex-1 my-3">
        {/* --- プレイヤー A --- */}
        <div
          className={`relative flex flex-col justify-between p-4 rounded-2xl border-4 transition-all duration-200 ${
            currentServer === "A"
              ? "border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/10"
              : "border-slate-800 bg-slate-900/50"
          }`}
        >
          {/* サーブ権表示 & 最初のサーブ選択 */}
          <div className="flex justify-between items-center">
            {currentServer === "A" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full text-xs tracking-wider animate-pulse">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("A")}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                先攻に変更
              </button>
            )}

            {/* 獲得セット数表示 */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block tracking-widest uppercase">
                SETS
              </span>
              <span className="text-2xl font-black text-emerald-400">
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
              className="w-full bg-transparent text-xl font-bold border-b border-slate-700 focus:border-emerald-400 focus:outline-none px-1 py-0.5 text-slate-200"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア */}
          <div
            onClick={() => handleAddPoint("A")}
            className="flex-1 flex items-center justify-center cursor-pointer my-2 active:scale-95 transition-transform"
          >
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-white">
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
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm active:bg-slate-600 transition"
          >
            -1 点
          </button>
        </div>

        {/* --- プレイヤー B --- */}
        <div
          className={`relative flex flex-col justify-between p-4 rounded-2xl border-4 transition-all duration-200 ${
            currentServer === "B"
              ? "border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/10"
              : "border-slate-800 bg-slate-900/50"
          }`}
        >
          {/* サーブ権表示 & 最初のサーブ選択 */}
          <div className="flex justify-between items-center">
            {currentServer === "B" ? (
              <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full text-xs tracking-wider animate-pulse">
                SERVE 🏓
              </span>
            ) : (
              <button
                onClick={() => setInitialServer("B")}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                先攻に変更
              </button>
            )}

            {/* 獲得セット数表示 */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block tracking-widest uppercase">
                SETS
              </span>
              <span className="text-2xl font-black text-emerald-400">
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
              className="w-full bg-transparent text-xl font-bold border-b border-slate-700 focus:border-emerald-400 focus:outline-none px-1 py-0.5 text-slate-200"
              placeholder="選手名"
            />
          </div>

          {/* 得点タップエリア */}
          <div
            onClick={() => handleAddPoint("B")}
            className="flex-1 flex items-center justify-center cursor-pointer my-2 active:scale-95 transition-transform"
          >
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-white">
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
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm active:bg-slate-600 transition"
          >
            -1 点
          </button>
        </div>
      </div>

      {/* 3. セット取得モーダル */}
      {winnerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1">
              セット獲得！
            </h2>
            <p className="text-slate-300 font-bold text-lg mb-6">
              {winnerModal === "A" ? playerAName : playerBName} がこのセットを取得しました。
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmSetWin(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white transition active:scale-95"
              >
                コートを交代して次のセットへ
              </button>
              <button
                onClick={() => confirmSetWin(false)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-bold rounded-xl text-slate-200 transition active:scale-95"
              >
                コート交代せず次のセットへ
              </button>
              <button
                onClick={handleUndo}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-amber-400 text-sm transition"
              >
                キャンセル（最後の1点を取り消す）
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
