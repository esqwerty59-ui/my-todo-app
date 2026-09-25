import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";
import { toTodo, unauthorized, badRequest } from "@/lib/todos";
import { TITLE_MAX_LENGTH } from "@/lib/todo-constants";

export type Todo = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
};

export type ErrorResponse = { error: string };

export type GetTodosResponse = { todos: Todo[] };

export type CreateTodoRequest = { title: string };
export type CreateTodoResponse = { todo: Todo };

// ログイン中のユーザーの TODO 一覧（新しい順）
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json<GetTodosResponse>({ todos: todos.map(toTodo) });
}

// TODO を追加
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const body = (await request.json().catch(() => null)) as
    | Partial<CreateTodoRequest>
    | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("タイトルを入力してください。");
  if (title.length > TITLE_MAX_LENGTH) {
    return badRequest(`タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください。`);
  }

  const todo = await prisma.todo.create({ data: { userId, title } });

  return NextResponse.json<CreateTodoResponse>(
    { todo: toTodo(todo) },
    { status: 201 },
  );
}
