"use client";

import {
  Suspense,
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

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectCode =
    searchParams.get("projectId")?.trim().toUpperCase() || "";

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

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

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
    setError("");

    const {
      data,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        "id, project_code, project_name, goal, daily_goal, show_participants"
      )
      .eq(
        "project_code",
        projectCode
      )
      .maybeSingle();

    if (projectError) {
      console.error(projectError);

      setError(
        "Unable to load project."
      );

      setLoading(false);
      return;
    }

    if (!data) {
      setError(
        "Project not found."
      );

      setLoading(false);
      return;
    }

    const projectData: Project = {
      id: data.id,
      project_code:
        data.project_code,
      project_name:
        data.project_name,
      goal: Number(
        data.goal
      ),
      daily_goal:
        Number(
          data.daily_goal
        ) || 100,
      show_participants:
        data.show_participants ??
        true,
    };

    setProject(
      projectData
    );

    setProjectName(
      projectData.project_name
    );

    setGoal(
      String(
        projectData.goal
      )
    );

    setDailyGoal(
      String(
        projectData.daily_goal
      )
    );

    setShowParticipants(
      projectData.show_participants
    );

    setLoading(false);
  }, [
    projectCode,
    router,
  ]);

  const loadEntries = useCallback(
    async (
      projectId: string
    ) => {
      const {
        data,
        error: entryError,
      } = await supabase
        .from(
          "salawat_entries"
        )
        .select(
          "id, participant_name, amount, created_at"
        )
        .eq(
          "project_id",
          projectId
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(50);

      if (entryError) {
        console.error(
          entryError
        );

        setError(
          "Unable to load recent entries."
        );

        return;
      }

      const cleanEntries: Entry[] =
        (data || []).map(
          (entry) => ({
            id:
              Number(
                entry.id
              ),

            participant_name:
              entry.participant_name,

            amount:
              Number(
                entry.amount
              ),

            created_at:
              entry.created_at,
          })
        );

      setEntries(
        cleanEntries
      );
    },
    []
  );

  useEffect(() => {
    loadProject();
  }, [
    loadProject,
  ]);

  async function verifyPin() {
    setError("");
    setSuccess("");

    if (!adminPin.trim()) {
      setError(
        "Please enter the Admin PIN."
      );

      return;
    }

    setVerifying(
      true
    );

    const {
      data,
      error: verifyError,
    } = await supabase.rpc(
      "verify_project_admin",
      {
        p_project_code:
          projectCode,

        p_admin_pin:
          adminPin,
      }
    );

    setVerifying(
      false
    );

    if (verifyError) {
      console.error(
        verifyError
      );

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

    setVerified(
      true
    );

    if (project) {
      await loadEntries(
        project.id
      );
    }
  }

  async function saveSettings() {
    setError("");
    setSuccess("");

    const cleanProjectName =
      projectName.trim();

    const numericGoal =
      Number(goal);

    const numericDailyGoal =
      Number(
        dailyGoal
      );

    if (
      cleanProjectName.length <
      2
    ) {
      setError(
        "Please enter a valid project name."
      );

      return;
    }

    if (
      !Number.isFinite(
        numericGoal
      ) ||
      numericGoal <= 0
    ) {
      setError(
        "Please enter a valid overall project goal."
      );

      return;
    }

    if (
      !Number.isFinite(
        numericDailyGoal
      ) ||
      numericDailyGoal <= 0
    ) {
      setError(
        "Please enter a valid daily goal."
      );

      return;
    }

    setSaving(
      true
    );

    const {
      error: updateError,
    } = await supabase.rpc(
      "update_salawat_project",
      {
        p_project_code:
          projectCode,

        p_admin_pin:
          adminPin,

        p_project_name:
          cleanProjectName,

        p_goal:
          numericGoal,

        p_daily_goal:
          numericDailyGoal,

        p_show_participants:
          showParticipants,
      }
    );

    setSaving(
      false
    );

    if (updateError) {
      console.error(
        updateError
      );

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

    window.setTimeout(
      () => {
        setSuccess("");
      },
      3000
    );
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

    setDeletingId(
      entryId
    );

    const {
      error: deleteError,
    } = await supabase.rpc(
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

    setDeletingId(
      null
    );

    if (deleteError) {
      console.error(
        deleteError
      );

      setError(
        deleteError.message ||
          "Unable to delete entry."
      );

      return;
    }

    setEntries(
      (
        previous
      ) =>
        previous.filter(
          (entry) =>
            entry.id !==
            entryId
        )
    );

    setSuccess(
      "Entry deleted."
    );

    window.setTimeout(
      () => {
        setSuccess("");
      },
      3000
    );
  }

  function backToProject() {
    if (!projectCode) {
      router.push("/");
      return;
    }

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
      <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">
            <span className="text-3xl text-white">
              ﷺ
            </span>
          </div>

          <p className="font-medium text-[#174c3c]">
            Loading admin settings...
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl border border-[#e5ded0] bg-white p-7 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">
            <span className="text-3xl text-white">
              ﷺ
            </span>
          </div>

          <h1 className="text-xl font-semibold text-gray-900">
            Project Not Found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We couldn't find this Salawat project."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-6 w-full rounded-xl bg-[#174c3c] py-3 font-semibold text-white"
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
            onClick={
              backToProject
            }
            className="mb-6 text-sm font-medium text-[#174c3c]"
          >
            ← Back to Project
          </button>

          <div className="rounded-3xl border border-[#e5ded0] bg-white p-7 shadow-sm">

            <div className="mb-6 text-center">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">
                <span className="text-3xl text-white">
                  ﷺ
                </span>
              </div>

              <h1 className="text-2xl font-bold text-[#174c3c]">
                Admin Settings
              </h1>

              <p className="mt-2 text-gray-600">
                {project.project_name}
              </p>

              <p className="mt-2 text-xs font-medium text-gray-400">
                Project ID:{" "}
                {project.project_code}
              </p>

            </div>

            <div>
              <label
                htmlFor="adminPin"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Admin PIN
              </label>

              <input
                id="adminPin"
                type="password"
                value={
                  adminPin
                }
                onChange={(
                  e
                ) => {
                  setAdminPin(
                    e.target.value
                  );

                  setError("");
                }}
                onKeyDown={(
                  e
                ) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    verifyPin();
                  }
                }}
                placeholder="Enter Admin PIN"
                autoFocus
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={
                verifying
              }
              onClick={
                verifyPin
              }
              className="mt-5 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-not-allowed disabled:opacity-60"
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
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-8 sm:px-5">

      <div className="mx-auto w-full max-w-2xl">

        {/* TOP BAR */}

        <div className="mb-6 flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={
              backToProject
            }
            className="text-sm font-medium text-[#174c3c]"
          >
            ← Back to Project
          </button>

          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
            {project.project_code}
          </span>

        </div>

        {/* HEADER */}

        <div className="mb-6">

          <h1 className="text-3xl font-bold text-[#174c3c]">
            Admin Settings
          </h1>

          <p className="mt-2 text-gray-600">
            Manage{" "}
            {project.project_name}
          </p>

        </div>

        {/* SETTINGS */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Project Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update goals and project preferences.
          </p>

          {/* PROJECT NAME */}

          <div className="mt-6">

            <label
              htmlFor="projectName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Project Name
            </label>

            <input
              id="projectName"
              type="text"
              value={
                projectName
              }
              onChange={(
                e
              ) => {
                setProjectName(
                  e.target.value
                );

                setError("");
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          {/* OVERALL GOAL */}

          <div className="mt-5">

            <label
              htmlFor="overallGoal"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Overall Project Goal
            </label>

            <input
              id="overallGoal"
              type="number"
              min="1"
              step="1"
              value={
                goal
              }
              onChange={(
                e
              ) => {
                setGoal(
                  e.target.value
                );

                setError("");
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Example: 1,000,000 Salawat for the entire project.
            </p>

          </div>

          {/* DAILY GOAL */}

          <div className="mt-5 rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

            <div className="mb-3">

              <p className="text-sm font-semibold text-[#174c3c]">
                Daily Salawat Goal
              </p>

              <p className="mt-1 text-xs text-gray-500">
                This is the daily target shown to each participant.
              </p>

            </div>

            <input
              id="dailyGoal"
              type="number"
              min="1"
              step="1"
              value={
                dailyGoal
              }
              onChange={(
                e
              ) => {
                setDailyGoal(
                  e.target.value
                );

                setError("");
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <div className="mt-3 flex flex-wrap gap-2">

              {[33, 100, 500, 1000].map(
                (
                  preset
                ) => (
                  <button
                    key={
                      preset
                    }
                    type="button"
                    onClick={() =>
                      setDailyGoal(
                        String(
                          preset
                        )
                      )
                    }
                    className="rounded-full border border-[#174c3c]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#174c3c] transition hover:bg-[#eef6f2]"
                  >
                    {preset.toLocaleString()}
                  </button>
                )
              )}

            </div>

          </div>

          {/* PARTICIPANT VISIBILITY */}

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f3e9] p-4">

            <input
              id="showParticipants"
              type="checkbox"
              checked={
                showParticipants
              }
              onChange={(
                e
              ) =>
                setShowParticipants(
                  e.target.checked
                )
              }
              className="mt-1 h-4 w-4 accent-[#174c3c]"
            />

            <div>

              <label
                htmlFor="showParticipants"
                className="font-medium text-gray-900"
              >
                Show participant totals
              </label>

              <p className="mt-1 text-sm text-gray-500">
                When enabled, participants can see names and total Salawat contributions.
              </p>

            </div>

          </div>

          {/* MESSAGES */}

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              ✓ {success}
            </div>
          )}

          {/* SAVE */}

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              saveSettings
            }
            className="mt-6 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

        </div>

        {/* RECENT ENTRIES */}

        <div className="rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Recent Entries
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review and remove incorrect Salawat entries.
          </p>

          <div className="mt-5 space-y-3">

            {entries.length ===
            0 ? (

              <div className="rounded-2xl bg-[#f7f3e9] p-5 text-center">

                <p className="text-sm text-gray-500">
                  No Salawat entries yet.
                </p>

              </div>

            ) : (

              entries.map(
                (
                  entry
                ) => (

                  <div
                    key={
                      entry.id
                    }
                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f3e9] px-4 py-3"
                  >

                    <div className="min-w-0">

                      <p className="truncate font-medium text-gray-900">
                        {
                          entry.participant_name
                        }
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          entry.created_at
                        ).toLocaleString()}
                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-4">

                      <span className="font-semibold text-[#174c3c]">
                        +
                        {Number(
                          entry.amount
                        ).toLocaleString()}
                      </span>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          entry.id
                        }
                        onClick={() =>
                          deleteEntry(
                            entry.id
                          )
                        }
                        className="text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        {deletingId ===
                        entry.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5">

          <div className="text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">
              <span className="text-3xl text-white">
                ﷺ
              </span>
            </div>

            <p className="font-medium text-[#174c3c]">
              Loading admin settings...
            </p>

          </div>

        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}