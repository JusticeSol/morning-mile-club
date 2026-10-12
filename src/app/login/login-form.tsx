"use client";

import { useActionState, useState } from "react";
import { sendCode, verifyCode, type LoginState } from "./actions";
import { buttonClass, inputClass, Message } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  // Bumping the key remounts the steps, which clears both action states.
  const [attempt, setAttempt] = useState(0);
  return <LoginSteps key={attempt} next={next} onRestart={() => setAttempt((n) => n + 1)} />;
}

function LoginSteps({ next, onRestart }: { next: string; onRestart: () => void }) {
  const [sendState, send, sending] = useActionState<LoginState, FormData>(sendCode, { step: "enter" });
  const [verifyState, verify, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "enter" });
  const [method, setMethod] = useState<"email" | "phone">("email");

  if (sendState.step === "verify") {
    const error = verifyState.step === "verify" ? verifyState.error : undefined;
    return (
      <form action={verify} className="space-y-4">
        <input type="hidden" name="method" value={sendState.method} />
        <input type="hidden" name="contact" value={sendState.contact} />
        <input type="hidden" name="next" value={next} />
        <p>
          We sent a 6-digit code to <strong>{sendState.contact}</strong>.
          {sendState.method === "email" && " You can also just tap the link in the email."}
        </p>
        <input
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
          className={`${inputClass} text-center text-2xl tracking-[0.4em]`}
        />
        {error && <Message tone="error">{error}</Message>}
        <button className={buttonClass} disabled={verifying}>
          {verifying ? "Checking…" : "Log in"}
        </button>
        <button type="button" onClick={onRestart} className="w-full text-sm text-sunrise-ink underline">
          Use a different {sendState.method === "phone" ? "number" : "email"}
        </button>
      </form>
    );
  }

  return (
    <form action={send} className="space-y-4">
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="next" value={next} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            aria-pressed={method === m}
            className={`rounded-lg py-2 font-medium ${method === m ? "bg-white shadow-sm" : "text-navy/60"}`}
          >
            {m === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>
      <input
        key={method}
        name="contact"
        type={method === "email" ? "email" : "tel"}
        inputMode={method === "email" ? "email" : "tel"}
        autoComplete={method === "email" ? "email" : "tel"}
        placeholder={method === "email" ? "you@example.com" : "0803 123 4567"}
        required
        className={inputClass}
      />
      {sendState.error && <Message tone="error">{sendState.error}</Message>}
      <button className={buttonClass} disabled={sending}>
        {sending ? "Sending…" : "Send me a code"}
      </button>
    </form>
  );
}
