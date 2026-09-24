import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的エクスポートを有効化
  images: {
    unoptimized: true, // 静的出力時の画像最適化エラーを回避
  },
};

export default nextConfig;
