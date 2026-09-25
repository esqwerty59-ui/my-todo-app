import { NextResponse } from "next/server";
import type { Todo as TodoRow } from "@/app/generated/prisma/client";
import type { ErrorResponse, Todo } from "@/app/api/todos/route";

// DB の行を API レスポンスの形に変換する（user_id はクライアントに返さない）
export function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    isCompleted: row.isCompleted,
    createdAt: row.createdAt.toISOString(),
  };
}

export function unauthorized() {
  return NextResponse.json<ErrorResponse>(
    { error: "ログインしてください。" },
    { status: 401 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json<ErrorResponse>({ error: message }, { status: 400 });
}

export function notFound() {
  return NextResponse.json<ErrorResponse>(
    { error: "TODO が見つかりません。" },
    { status: 404 },
  );
}
