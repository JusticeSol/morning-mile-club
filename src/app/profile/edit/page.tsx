import { Suspense } from "react";
import Link from "next/link";
import { Card, Screen } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { requireMember } from "@/lib/auth";
import { updateProfile } from "../actions";
import { PhotoUpload } from "../photo-upload";

export default function EditProfilePage() {
  return (
    <Screen eyebrow="Profile" title="Edit profile" nav="profile">
      <Card>
        <Suspense fallback={<p className="text-navy/60">Loading…</p>}>
          <EditBody />
        </Suspense>
      </Card>
    </Screen>
  );
}

async function EditBody() {
  const { profile } = await requireMember("/profile/edit");
  return (
    <div className="space-y-4">
      <PhotoUpload name={profile.display_name || profile.full_name} src={profile.avatar_url} />
      <ProfileForm action={updateProfile} next="/profile" submitLabel="Save changes" defaults={profile} />
      <Link href="/profile" className="block text-center text-sm text-navy/60 underline">
        Cancel
      </Link>
    </div>
  );
}
