"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TITLE_MAX_LENGTH } from "@/lib/todo-constants";
import type {
  CreateTodoRequest,
  CreateTodoResponse,
  ErrorResponse,
  GetTodosResponse,
  Todo,
} from "@/app/api/todos/route";
import type {
  DeleteTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
} from "@/app/api/todos/[id]/route";

class UnauthorizedError extends Error {}

// アイゼンハワーマトリクスの4領域（表示順：左上・右上・左下・右下）
const QUADRANTS = [
  {
    key: "do",
    title: "すぐやる",
    description: "緊急 × 重要",
    isUrgent: true,
    isImportant: true,
    className: "border-red-500/40 bg-red-500/5",
    titleClassName: "text-red-400",
  },
  {
    key: "schedule",
    title: "計画する",
    description: "緊急でない × 重要",
    isUrgent: false,
    isImportant: true,
    className: "border-indigo-500/40 bg-indigo-500/5",
    titleClassName: "text-indigo-400",
  },
  {
    key: "delegate",
    title: "任せる",
    description: "緊急 × 重要でない",
    isUrgent: true,
    isImportant: false,
    className: "border-amber-500/40 bg-amber-500/5",
    titleClassName: "text-amber-400",
  },
  {
    key: "eliminate",
    title: "やらない",
    description: "緊急でない × 重要でない",
    isUrgent: false,
    isImportant: false,
    className: "border-zinc-700 bg-zinc-800/30",
    titleClassName: "text-zinc-400",
  },
] as const;

// 緊急・重要の切り替えボタン（押されている状態を aria-pressed で伝える）
function AxisToggle({
  label,
  pressed,
  onClick,
  activeClassName,
  size = "sm",
  ariaLabel,
}: {
  label: string;
  ariaLabel?: string;
  pressed: boolean;
  onClick: () => void;
  activeClassName: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`shrink-0 rounded-full border transition ${
        size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"
      } ${
        pressed
          ? activeClassName
          : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

const URGENT_ACTIVE = "border-red-500/60 bg-red-500/15 text-red-300";
const IMPORTANT_ACTIVE = "border-indigo-500/60 bg-indigo-500/15 text-indigo-300";

// API を呼び出し、エラー時はレスポンスのメッセージを持った Error を投げる
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 401) throw new UnauthorizedError();
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as ErrorResponse | null)?.error ?? "エラーが発生しました。",
    );
  }
  return body as T;
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [newIsUrgent, setNewIsUrgent] = useState(false);
  const [newIsImportant, setNewIsImportant] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function handleError(e: unknown) {
    if (e instanceof UnauthorizedError) {
      router.replace("/login");
      return;
    }
    setError(e instanceof Error ? e.message : "エラーが発生しました。");
  }

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));

    request<GetTodosResponse>("/api/todos")
      .then((data) => setTodos(data.todos))
      .catch(handleError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);
    try {
      const data = await request<CreateTodoResponse>("/api/todos", {
        method: "POST",
        body: JSON.stringify({
          title: trimmed,
          isUrgent: newIsUrgent,
          isImportant: newIsImportant,
        } satisfies CreateTodoRequest),
      });
      setTodos((prev) => [data.todo, ...prev]);
      setTitle("");
    } catch (e) {
      handleError(e);
    } finally {
      setAdding(false);
    }
  }

  // 完了状態・緊急度・重要度を更新する。画面を先に更新し、失敗したら元に戻す
  async function handleUpdate(todo: Todo, changes: UpdateTodoRequest) {
    setError(null);
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, ...changes } : t)),
    );
    try {
      const data = await request<UpdateTodoResponse>(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)));
    } catch (e) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
      handleError(e);
    }
  }

  async function handleDelete(todo: Todo) {
    setError(null);
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    try {
      await request<DeleteTodoResponse>(`/api/todos/${todo.id}`, {
        method: "DELETE",
      });
    } catch (e) {
      setTodos(previous);
      handleError(e);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const remaining = todos.filter((t) => !t.isCompleted).length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="shrink-0 text-lg font-semibold text-zinc-100">
            My TODO App
          </h1>
          <div className="flex min-w-0 items-center gap-3">
            {email && (
              <span
                className="truncate text-xs text-zinc-400 sm:text-sm"
                title={email}
              >
                {email}
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl shadow-black/40 sm:p-6">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="new-todo" className="sr-only">
                新しい TODO
              </label>
              <input
                id="new-todo"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX_LENGTH}
                placeholder="やることを入力"
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                type="submit"
                disabled={adding || !title.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? "追加中..." : "追加"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <span>分類：</span>
              <AxisToggle
                label="緊急"
                size="md"
                pressed={newIsUrgent}
                onClick={() => setNewIsUrgent((v) => !v)}
                activeClassName={URGENT_ACTIVE}
              />
              <AxisToggle
                label="重要"
                size="md"
                pressed={newIsImportant}
                onClick={() => setNewIsImportant((v) => !v)}
                activeClassName={IMPORTANT_ACTIVE}
              />
              <span className="text-xs text-zinc-500">
                →「
                {
                  QUADRANTS.find(
                    (q) =>
                      q.isUrgent === newIsUrgent &&
                      q.isImportant === newIsImportant,
                  )?.title
                }
                」に追加
              </span>
            </div>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <div className="mt-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                読み込み中...
              </p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {QUADRANTS.map((quadrant) => {
                    const items = todos.filter(
                      (t) =>
                        t.isUrgent === quadrant.isUrgent &&
                        t.isImportant === quadrant.isImportant,
                    );
                    const headingId = `quadrant-${quadrant.key}`;
                    return (
                      <section
                        key={quadrant.key}
                        aria-labelledby={headingId}
                        className={`flex min-h-40 flex-col rounded-xl border p-3 sm:p-4 ${quadrant.className}`}
                      >
                        <div className="mb-2 flex items-baseline justify-between gap-2">
                          <h2
                            id={headingId}
                            className={`font-semibold ${quadrant.titleClassName}`}
                          >
                            {quadrant.title}
                          </h2>
                          <span className="text-xs text-zinc-500">
                            {quadrant.description}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="flex flex-1 items-center justify-center py-4 text-xs text-zinc-600">
                            TODO はありません
                          </p>
                        ) : (
                          <ul className="divide-y divide-zinc-800">
                            {items.map((todo) => (
                              <li
                                key={todo.id}
                                className="flex items-center gap-2 py-2"
                              >
                                <input
                                  id={`todo-${todo.id}`}
                                  type="checkbox"
                                  checked={todo.isCompleted}
                                  onChange={() =>
                                    handleUpdate(todo, {
                                      isCompleted: !todo.isCompleted,
                                    })
                                  }
                                  className="size-5 shrink-0 cursor-pointer accent-indigo-500"
                                />
                                <label
                                  htmlFor={`todo-${todo.id}`}
                                  className={`min-w-0 flex-1 cursor-pointer break-words text-sm ${
                                    todo.isCompleted
                                      ? "text-zinc-500 line-through"
                                      : "text-zinc-100"
                                  }`}
                                >
                                  {todo.title}
                                </label>
                                <AxisToggle
                                  label="緊急"
                                  ariaLabel={`「${todo.title}」を緊急にする`}
                                  pressed={todo.isUrgent}
                                  onClick={() =>
                                    handleUpdate(todo, {
                                      isUrgent: !todo.isUrgent,
                                    })
                                  }
                                  activeClassName={URGENT_ACTIVE}
                                />
                                <AxisToggle
                                  label="重要"
                                  ariaLabel={`「${todo.title}」を重要にする`}
                                  pressed={todo.isImportant}
                                  onClick={() =>
                                    handleUpdate(todo, {
                                      isImportant: !todo.isImportant,
                                    })
                                  }
                                  activeClassName={IMPORTANT_ACTIVE}
                                />
                                <button
                                  onClick={() => handleDelete(todo)}
                                  aria-label={`「${todo.title}」を削除`}
                                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                                >
                                  削除
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>
                <p className="mt-4 text-right text-xs text-zinc-500">
                  残り {remaining} 件 / 全 {todos.length} 件
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
