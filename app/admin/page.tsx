"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase/client";

type Project = {
  id: string;
  project_code: string;
  project_name: string;
  goal: number;
  daily_goal: number;
  show_participants: boolean;
};

type Entry = {
  id: number;
  participant_name: string;
  amount: number;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectCode =
    searchParams.get("projectId")?.toUpperCase() || "";

  const userName =
    searchParams.get("name")?.trim() || "";

  const [project, setProject] =
    useState<Project | null>(null);

  const [entries, setEntries] =
    useState<Entry[]>([]);

  const [adminPin, setAdminPin] =
    useState("");

  const [verified, setVerified] =
    useState(false);

  const [projectName, setProjectName] =
    useState("");

  const [goal, setGoal] =
    useState("");

  const [dailyGoal, setDailyGoal] =
    useState("");

  const [
    showParticipants,
    setShowParticipants,
  ] = useState(true);

  const [loading, setLoading] =
    useState(true);

  const [verifying, setVerifying] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadProject = useCallback(async () => {
    if (!projectCode) {
      router.push("/");
      return;
    }

    setLoading(true);

    const { data, error: projectError } =
      await supabase
        .from("projects")
        .select(
          "id, project_code, project_name, goal, daily_goal, show_participants"
        )
        .eq("project_code", projectCode)
        .maybeSingle();

    if (projectError || !data) {
      console.error(projectError);

      setError(
        "Unable to load project."
      );

      setLoading(false);
      return;
    }

    setProject(data);

    setProjectName(
      data.project_name
    );

    setGoal(
      String(data.goal)
    );

    setDailyGoal(
      String(data.daily_goal || 100)
    );

    setShowParticipants(
      data.show_participants ?? true
    );

    setLoading(false);
  }, [projectCode, router]);

  const loadEntries = useCallback(
    async (projectId: string) => {
      const { data, error: entryError } =
        await supabase
          .from("salawat_entries")
          .select(
            "id, participant_name, amount, created_at"
          )
          .eq("project_id", projectId)
          .order("created_at", {
            ascending: false,
          })
          .limit(50);

      if (entryError) {
        console.error(entryError);
        return;
      }

      setEntries(data || []);
    },
    []
  );

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function verifyPin() {
    setError("");
    setSuccess("");

    if (!adminPin.trim()) {
      setError(
        "Please enter the Admin PIN."
      );
      return;
    }

    setVerifying(true);

    const { data, error: verifyError } =
      await supabase.rpc(
        "verify_project_admin",
        {
          p_project_code:
            projectCode,

          p_admin_pin:
            adminPin,
        }
      );

    setVerifying(false);

    if (verifyError) {
      console.error(verifyError);

      setError(
        "Unable to verify Admin PIN."
      );
      return;
    }

    if (!data) {
      setError(
        "Incorrect Admin PIN."
      );
      return;
    }

    setVerified(true);

    if (project) {
      await loadEntries(
        project.id
      );
    }
  }

  async function saveSettings() {
    setError("");
    setSuccess("");

    if (!projectName.trim()) {
      setError(
        "Please enter a project name."
      );
      return;
    }

    if (
      !goal ||
      Number(goal) <= 0
    ) {
      setError(
        "Please enter a valid project goal."
      );
      return;
    }

    if (
      !dailyGoal ||
      Number(dailyGoal) <= 0
    ) {
      setError(
        "Please enter a valid daily goal."
      );
      return;
    }

    setSaving(true);

    const { error: updateError } =
      await supabase.rpc(
        "update_salawat_project",
        {
          p_project_code:
            projectCode,

          p_admin_pin:
            adminPin,

          p_project_name:
            projectName.trim(),

          p_goal:
            Number(goal),

          p_daily_goal:
            Number(dailyGoal),

          p_show_participants:
            showParticipants,
        }
      );

    setSaving(false);

    if (updateError) {
      console.error(updateError);

      setError(
        updateError.message ||
          "Unable to update project."
      );

      return;
    }

    setSuccess(
      "Project settings updated."
    );

    await loadProject();
  }

  async function deleteEntry(
    entryId: number
  ) {
    const confirmed =
      window.confirm(
        "Delete this Salawat entry? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } =
      await supabase.rpc(
        "delete_salawat_entry",
        {
          p_project_code:
            projectCode,

          p_admin_pin:
            adminPin,

          p_entry_id:
            entryId,
        }
      );

    if (deleteError) {
      console.error(deleteError);

      setError(
        "Unable to delete entry."
      );

      return;
    }

    setEntries((previous) =>
      previous.filter(
        (entry) =>
          entry.id !== entryId
      )
    );

    setSuccess(
      "Entry deleted."
    );
  }

  function backToProject() {
    router.push(
      `/project?projectId=${encodeURIComponent(
        projectCode
      )}&name=${encodeURIComponent(
        userName
      )}`
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center">
        <p className="font-medium text-[#174c3c]">
          Loading admin settings...
        </p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-sm">
          <p className="text-gray-700">
            Project not found.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-5 rounded-xl bg-[#174c3c] px-5 py-3 font-semibold text-white"
          >
            Return Home
          </button>
        </div>
      </main>
    );
  }

  if (!verified) {
    return (
      <main className="min-h-screen bg-[#f7f3e9] px-5 py-10">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={backToProject}
            className="mb-6 text-sm font-medium text-[#174c3c]"
          >
            ← Back to Project
          </button>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">
                <span className="text-3xl text-white">
                  ﷺ
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#174c3c]">
                Admin Settings
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {project.project_name}
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Admin PIN
            </label>

            <input
              type="password"
              value={adminPin}
              onChange={(e) => {
                setAdminPin(
                  e.target.value
                );

                setError("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  verifyPin();
                }
              }}
              placeholder="Enter Admin PIN"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={verifying}
              onClick={verifyPin}
              className="mt-5 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {verifying
                ? "Checking..."
                : "Enter Admin"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3e9] px-5 py-8">
      <div className="mx-auto w-full max-w-2xl">

        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToProject}
            className="text-sm font-medium text-[#174c3c]"
          >
            ← Back to Project
          </button>

          <span className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
            {projectCode}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#174c3c]">
            Admin Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Manage {project.project_name}
          </p>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Project Settings
          </h2>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Project Name
            </label>

            <input
              value={projectName}
              onChange={(e) =>
                setProjectName(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Overall Project Goal
            </label>

            <input
              type="number"
              min="1"
              value={goal}
              onChange={(e) =>
                setGoal(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Example: 1,000,000 total Salawat for the project.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">
            <label className="mb-2 block text-sm font-semibold text-[#174c3c]">
              Daily Salawat Goal
            </label>

            <input
              type="number"
              min="1"
              value={dailyGoal}
              onChange={(e) =>
                setDailyGoal(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Each participant will see their daily progress against this goal.
            </p>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f3e9] p-4">
            <input
              id="showParticipants"
              type="checkbox"
              checked={showParticipants}
              onChange={(e) =>
                setShowParticipants(
                  e.target.checked
                )
              }
              className="mt-1 h-4 w-4"
            />

            <div>
              <label
                htmlFor="showParticipants"
                className="font-medium text-gray-900"
              >
                Show participant totals
              </label>

              <p className="mt-1 text-sm text-gray-500">
                When enabled, everyone can see participant names and their total contributions.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ {success}
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={saveSettings}
            className="mt-6 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Entries
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Delete incorrect Salawat entries.
          </p>

          <div className="mt-5 space-y-3">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">
                No entries yet.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f3e9] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {entry.participant_name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(
                        entry.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[#174c3c]">
                      +
                      {Number(
                        entry.amount
                      ).toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        deleteEntry(
                          entry.id
                        )
                      }
                      className="text-sm font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}