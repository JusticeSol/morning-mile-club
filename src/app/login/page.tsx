import { Suspense } from "react";
import Image from "next/image";
import { Card, Message, Screen } from "@/components/ui";
import { safeNext } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Screen eyebrow="Morning Mile Club" title="Log in">
      <Image
        src="/brand/logo.png"
        alt="The Morning Mile Club: beyond the finish line"
        width={160}
        height={160}
        priority
        className="mx-auto mb-4 rounded-3xl bg-navy p-1.5 shadow-sm"
      />
      <Card>
        <Suspense>
          <LoginBody searchParams={searchParams} />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function LoginBody({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  const nextPath = safeNext(typeof next === "string" ? next : undefined);
  const coming = nextPath.startsWith("/checkin/");

  return (
    <div className="space-y-4">
      {error && <Message tone="error">That login link expired or was already used. Send a new code below.</Message>}
      {coming && <Message tone="info">Log in once and we&apos;ll check you in straight after.</Message>}
      <LoginForm next={nextPath} />
    </div>
  );
}
