import Link from "next/link";

export const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

export const buttonClass =
  "w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";

// ログイン / 新規登録で共通の、中央寄せカードのレイアウト
export function AuthCard({
  title,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: {
  title: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/40">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-100">
          {title}
        </h1>
        {children}
        <p className="mt-6 text-center text-sm text-zinc-400">
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
