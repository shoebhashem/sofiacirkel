"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

export function UserMenu({ user }: { user: User }) {
  const t = useTranslations("auth");
  const router = useRouter();

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.refresh();
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "") as string;
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={28} height={28} className="object-cover" />
        ) : (
          <span className="text-xs font-medium">{initials}</span>
        )}
      </div>
      <button
        onClick={signOut}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("signOut")}
      </button>
    </div>
  );
}
