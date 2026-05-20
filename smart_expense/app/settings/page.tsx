import { prisma } from "@/lib/prisma";
import { MOCK_USER } from "@/lib/constants";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  // Ensure the mock user exists in the DB or fetch it
  let user = await prisma.user.findUnique({
    where: { id: MOCK_USER.id }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
        currency: MOCK_USER.currency,
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-emerald-400">Preferences</h1>
          <p className="text-slate-500 dark:text-emerald-600">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SettingsForm initialData={user} />
        </div>
      </div>
    </div>
  );
}
