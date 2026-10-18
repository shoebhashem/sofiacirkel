import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/supabase/service";
import { supabaseServer } from "@/lib/supabase/server";
import { JoinClient } from "./JoinClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string; token: string }> };

export const metadata: Metadata = {
  title: "Join a circle — Sofiacirkel",
};

export default async function JoinPage({ params }: Props) {
  const { locale, token } = await params;
  const db = supabaseService();

  const { data: invite } = await db
    .from("invite_links")
    .select("id, circle_id, expires_at, max_uses, use_count, circles(id, slug, name)")
    .eq("token", token)
    .single();

  if (!invite) notFound();

  const circle = invite.circles as unknown as { id: string; slug: string; name: string };
  const expired = !!invite.expires_at && new Date(invite.expires_at) < new Date();
  const limitReached = invite.max_uses !== null && invite.use_count >= invite.max_uses;

  const authClient = await supabaseServer();
  const { data: { user } } = await authClient.auth.getUser();

  let alreadyMember = false;
  if (user && !expired && !limitReached) {
    const { data: membership } = await db
      .from("circle_members")
      .select("circle_id")
      .eq("circle_id", circle.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyMember = !!membership;
  }

  return (
    <JoinClient
      token={token}
      circle={circle}
      locale={locale}
      user={user ? { id: user.id } : null}
      expired={expired}
      limitReached={limitReached}
      alreadyMember={alreadyMember}
    />
  );
}
