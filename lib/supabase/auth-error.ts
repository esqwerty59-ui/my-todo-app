import type { AuthError } from "@supabase/supabase-js";

// Supabase Auth のエラーを画面表示用の日本語メッセージに変換する
export function toAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "email_not_confirmed":
      return "メールアドレスの確認が完了していません。確認メールのリンクを開いてください。";
    case "user_already_exists":
    case "email_exists":
      return "このメールアドレスはすでに登録されています。";
    case "weak_password":
      return "パスワードが弱すぎます。6文字以上で設定してください。";
    case "email_address_invalid":
      return "メールアドレスの形式が正しくありません。";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "リクエストが多すぎます。しばらく待ってから再度お試しください。";
    default:
      return error.message;
  }
}
