"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toAuthErrorMessage } from "@/lib/supabase/auth-error";
import { AuthCard, buttonClass, inputClass } from "@/components/auth-card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 確認メールのリンクを開いたら、Route Handler でセッションを確立する
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(toAuthErrorMessage(error));
      setLoading(false);
      return;
    }

    // メール確認が無効な設定なら、この時点でログイン済みになっている
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }

    setSentConfirmation(true);
    setLoading(false);
  }

  return (
    <AuthCard
      title="新規登録"
      footerText="すでにアカウントをお持ちの方は"
      footerLinkHref="/login"
      footerLinkLabel="ログイン"
    >
      {sentConfirmation ? (
        <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-400">
          {email} に確認メールを送信しました。
          <br />
          メール内のリンクを開いて登録を完了してください。
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm text-zinc-300">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm text-zinc-300">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-zinc-500">6文字以上</p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
