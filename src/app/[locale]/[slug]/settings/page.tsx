export default async function CircleSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Settings: {slug}</p>
    </main>
  );
}
