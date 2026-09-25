import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Route Handler から使う Supabase クライアント（リクエストごとに作成する）
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

// ログイン中のユーザー ID を返す。未ログインなら null
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  // getClaims() は JWT の署名を検証するので、Cookie の改ざんがあっても信用できる
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims.sub;
}
