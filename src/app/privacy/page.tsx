import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Screen } from "@/components/ui";
import { INSTAGRAM_URL } from "@/lib/social";

export const metadata: Metadata = {
  title: "Privacy · Morning Mile Club",
  description: "What the Morning Mile Club app stores about you, who can see it, and how to get it changed or deleted.",
};

const CONTACT = "justiceundie@gmail.com";
const UPDATED = "11 November 2026";

// Plain-language privacy notice (Nigeria Data Protection Act 2023). Public:
// linked from the login page and the profile page.
export default function PrivacyPage() {
  return (
    <Screen eyebrow="Morning Mile Club" title="Privacy">
      <div className="space-y-4">
        <Card>
          <p className="text-navy/80">
            The Morning Mile Club app keeps track of our Saturday runs: who turned up, how far they went, and the streaks and
            badges that come with it. This page explains, in plain words, what it stores about you and what you can ask us to do
            with it.
          </p>
          <p className="mt-3 text-sm text-navy/60">Last updated {UPDATED}.</p>
        </Card>

        <Section title="Who is responsible">
          <p>
            The app is run by <strong>Justice Joseph Undie</strong> for the Morning Mile Club, a running club in Lagos. For any
            privacy question or request, email <Mail />.
          </p>
        </Section>

        <Section title="What we store">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Your sign-in details:</strong> the email address or phone number you log in with.
            </li>
            <li>
              <strong>Your profile:</strong> your full name, the name you&apos;d like to be called, your pace group and, if you add
              one, your profile photo.
            </li>
            <li>
              <strong>Your runs:</strong> which Saturdays you checked in to and when, the km (and, if you add it, the time) you log,
              your &quot;I&apos;m in&quot; replies for upcoming runs, and the streaks and badges worked out from these.
            </li>
            <li>
              <strong>Group photos</strong> that organisers post as the photo of the week.
            </li>
          </ul>
          <p className="mt-3">
            That&apos;s all. We don&apos;t use your location, we don&apos;t connect to Strava or other fitness apps, and we
            don&apos;t track you with advertising or analytics cookies. The only cookies are the ones that keep you logged in.
          </p>
        </Section>

        <Section title="Why we store it">
          <p>
            To run the club: checking people in at the meetup, keeping the leaderboard, streaks, badges and monthly club goal, and
            letting organisers send the weekly recap in our WhatsApp group. We never sell your data or use it for advertising.
          </p>
        </Section>

        <Section title="Who can see it">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Other members</strong> see your name or nickname, your profile photo, your pace group and your club stats on
              the leaderboard. You can switch on <em>Hide me from the leaderboard</em> on your profile page at any time.
            </li>
            <li>
              <strong>Organisers (admins)</strong> also see your full name and your check-ins and km, so they can tick people in
              and fix mistakes. The weekly recap they post in the WhatsApp group may mention you by name, for example for a new
              badge or a streak.
            </li>
            <li>
              <strong>Profile photos and group photos</strong> are stored at web addresses that anyone holding the exact link can
              open, the same way photos shared in WhatsApp work. They aren&apos;t listed or searchable.
            </li>
          </ul>
        </Section>

        <Section title="Where it's kept">
          <p>
            The app is hosted by Vercel and the data is stored with Supabase, two cloud providers that may keep it on servers
            outside Nigeria. They store it for us and don&apos;t use it for anything else.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            For as long as you&apos;re a member. If you ask us to delete your account, we remove your profile, photo, check-ins and
            km.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the Nigeria Data Protection Act 2023 you can ask to see the data we hold about you, have it corrected, have it
            deleted, or object to how we use it. You can change your name, nickname, pace group and photo yourself on your profile
            page. For anything else, email <Mail /> and we&apos;ll reply as soon as we can, and within 30 days. You can also
            complain to the Nigeria Data Protection Commission.
          </p>
        </Section>

        <Section title="Age">
          <p>
            The club is for adults. If you&apos;re under 18, please get a parent or guardian&apos;s OK before joining.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this notice changes in a way that matters, we&apos;ll say so in the club&apos;s WhatsApp group and update the date at
            the top.
          </p>
        </Section>

        <p className="text-center text-sm text-navy/60">
          <Link href="/" className="font-medium text-sunrise-ink underline">
            Back to the app
          </Link>
          {" · "}
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Instagram
          </a>
        </p>
      </div>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-2 font-display text-xl font-bold uppercase">{title}</h2>
      <div className="space-y-2 text-navy/80">{children}</div>
    </Card>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="font-medium text-sunrise-ink underline">
      {CONTACT}
    </a>
  );
}
