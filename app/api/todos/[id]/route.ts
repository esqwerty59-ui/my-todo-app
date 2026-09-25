import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/server";
import { toTodo, unauthorized, badRequest, notFound } from "@/lib/todos";
import type { Todo } from "../route";

export type UpdateTodoRequest = { isCompleted: boolean };
export type UpdateTodoResponse = { todo: Todo };

export type DeleteTodoResponse = { id: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 対象の TODO が存在しない（または他人のもの）ときに Prisma が投げるエラー
function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

// 完了状態を更新
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/todos/[id]">,
) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) return notFound();

  const body = (await request.json().catch(() => null)) as
    | Partial<UpdateTodoRequest>
    | null;
  if (typeof body?.isCompleted !== "boolean") {
    return badRequest("isCompleted は true か false で指定してください。");
  }

  try {
    // user_id も条件に含め、他人の TODO は更新できないようにする
    const todo = await prisma.todo.update({
      where: { id, userId },
      data: { isCompleted: body.isCompleted },
    });
    return NextResponse.json<UpdateTodoResponse>({ todo: toTodo(todo) });
  } catch (error) {
    if (isRecordNotFound(error)) return notFound();
    throw error;
  }
}

// TODO を削除
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/todos/[id]">,
) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) return notFound();

  try {
    // user_id も条件に含め、他人の TODO は削除できないようにする
    await prisma.todo.delete({ where: { id, userId } });
    return NextResponse.json<DeleteTodoResponse>({ id });
  } catch (error) {
    if (isRecordNotFound(error)) return notFound();
    throw error;
  }
}
