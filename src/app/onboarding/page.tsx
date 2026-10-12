import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, Screen } from "@/components/ui";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Screen eyebrow="Welcome" title="Your profile">
      <Card>
        <Suspense>
          <OnboardingBody searchParams={searchParams} />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function OnboardingBody({ searchParams }: Pick<PageProps<"/onboarding">, "searchParams">) {
  const { next } = await searchParams;
  const nextPath = safeNext(typeof next === "string" ? next : undefined);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing) redirect(nextPath);

  return <OnboardingForm next={nextPath} />;
}
