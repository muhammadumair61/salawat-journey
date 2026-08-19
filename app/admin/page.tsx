"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
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

  const [participantNames, setParticipantNames] =
    useState<string[]>([]);

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

  /* ADD ENTRY FOR PARTICIPANT */

  const [participantSearch, setParticipantSearch] =
    useState("");

  const [
    selectedParticipant,
    setSelectedParticipant,
  ] = useState("");

  const [adminEntryAmount, setAdminEntryAmount] =
    useState("");

  const [
    showParticipantSuggestions,
    setShowParticipantSuggestions,
  ] = useState(false);

  const [addingEntry, setAddingEntry] =
    useState(false);

  /* EDIT ENTRY */

  const [editingEntry, setEditingEntry] =
    useState<Entry | null>(null);

  const [editAmount, setEditAmount] =
    useState("");

  const [editDate, setEditDate] =
    useState("");

  const [updatingEntry, setUpdatingEntry] =
    useState(false);

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
      project_code: data.project_code,
      project_name: data.project_name,
      goal: Number(data.goal),
      daily_goal:
        Number(data.daily_goal) || 100,
      show_participants:
        data.show_participants ?? true,
    };

    setProject(projectData);

    setProjectName(
      projectData.project_name
    );

    setGoal(
      String(projectData.goal)
    );

    setDailyGoal(
      String(projectData.daily_goal)
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
    async (projectId: string) => {

      const {
        data,
        error: entryError,
      } = await supabase
        .from("salawat_entries")
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
        console.error(entryError);

        setError(
          "Unable to load recent entries."
        );

        return;
      }

      const cleanEntries: Entry[] =
        (data || []).map(
          (entry) => ({
            id: Number(entry.id),
            participant_name:
              entry.participant_name,
            amount:
              Number(entry.amount),
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

  const loadParticipantNames = useCallback(
    async (projectId: string) => {

      const {
        data,
        error: participantError,
      } = await supabase
        .from("salawat_entries")
        .select(
          "participant_name"
        )
        .eq(
          "project_id",
          projectId
        );

      if (participantError) {
        console.error(
          participantError
        );

        setError(
          "Unable to load participant names."
        );

        return;
      }

      const uniqueNames =
        Array.from(
          new Map(
            (data || [])
              .map((entry) =>
                String(
                  entry.participant_name || ""
                ).trim()
              )
              .filter(
                (name) =>
                  name &&
                  name.toLowerCase() !==
                    "2024 historical total"
              )
              .map((name) => [
                name.toLowerCase(),
                name,
              ])
          ).values()
        ).sort((a, b) =>
          a.localeCompare(b)
        );

      setParticipantNames(
        uniqueNames
      );
    },
    []
  );

  useEffect(() => {
    loadProject();
  }, [
    loadProject,
  ]);

  const filteredParticipantNames =
    useMemo(() => {

      const search =
        participantSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return participantNames.slice(
          0,
          12
        );
      }

      return participantNames
        .filter((name) =>
          name
            .toLowerCase()
            .includes(search)
        )
        .slice(
          0,
          12
        );

    }, [
      participantNames,
      participantSearch,
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

    setVerifying(true);

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

    setVerifying(false);

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

    setVerified(true);

    if (project) {

      await Promise.all([
        loadEntries(
          project.id
        ),

        loadParticipantNames(
          project.id
        ),
      ]);
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
      Number(dailyGoal);

    if (
      cleanProjectName.length < 2
    ) {

      setError(
        "Please enter a valid project name."
      );

      return;
    }

    if (
      !Number.isFinite(numericGoal) ||
      numericGoal <= 0
    ) {

      setError(
        "Please enter a valid overall project goal."
      );

      return;
    }

    if (
      !Number.isFinite(numericDailyGoal) ||
      numericDailyGoal <= 0
    ) {

      setError(
        "Please enter a valid daily goal."
      );

      return;
    }

    setSaving(true);

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

    setSaving(false);

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

  function chooseParticipant(
    name: string
  ) {

    setParticipantSearch(
      name
    );

    setSelectedParticipant(
      name
    );

    setShowParticipantSuggestions(
      false
    );

    setError("");
  }

  async function addParticipantEntry() {
    if (!project) {
      return;
    }

    setError("");
    setSuccess("");

    const cleanName =
      selectedParticipant.trim();

    const amount =
      Number(adminEntryAmount);

    if (!cleanName) {

      setError(
        "Please choose a participant from the list."
      );

      return;
    }

    const matchingParticipant =
      participantNames.find(
        (name) =>
          name
            .trim()
            .toLowerCase() ===
          cleanName
            .trim()
            .toLowerCase()
      );

    if (!matchingParticipant) {

      setError(
        "Please select an existing participant from the suggestions."
      );

      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      setError(
        "Please enter a valid Salawat amount."
      );

      return;
    }

    setAddingEntry(true);

    const {
      data,
      error: insertError,
    } = await supabase
      .from(
        "salawat_entries"
      )
      .insert({
        project_id:
          project.id,

        participant_name:
          matchingParticipant,

        amount,
      })
      .select(
        "id, participant_name, amount, created_at"
      )
      .single();

    setAddingEntry(false);

    if (insertError) {

      console.error(
        insertError
      );

      setError(
        insertError.message ||
          "Unable to add Salawat entry."
      );

      return;
    }

    const newEntry: Entry = {

      id:
        Number(data.id),

      participant_name:
        data.participant_name,

      amount:
        Number(data.amount),

      created_at:
        data.created_at,
    };

    setEntries(
      (previous) => [
        newEntry,
        ...previous,
      ].slice(
        0,
        50
      )
    );

    setParticipantSearch(
      ""
    );

    setSelectedParticipant(
      ""
    );

    setAdminEntryAmount(
      ""
    );

    setShowParticipantSuggestions(
      false
    );

    setSuccess(
      `${amount.toLocaleString()} Salawat added for ${matchingParticipant}.`
    );

    window.setTimeout(
      () => {
        setSuccess("");
      },
      3000
    );
  }

  /*
   * Convert database date into
   * datetime-local input format.
   */

  function formatDateForInput(
    dateString: string
  ) {

    const date =
      new Date(dateString);

    const timezoneOffset =
      date.getTimezoneOffset();

    const localDate =
      new Date(
        date.getTime() -
          timezoneOffset *
            60 *
            1000
      );

    return localDate
      .toISOString()
      .slice(
        0,
        16
      );
  }

  function startEditingEntry(
    entry: Entry
  ) {

    setEditingEntry(
      entry
    );

    setEditAmount(
      String(entry.amount)
    );

    setEditDate(
      formatDateForInput(
        entry.created_at
      )
    );

    setError("");
    setSuccess("");
  }

  function cancelEditingEntry() {

    setEditingEntry(
      null
    );

    setEditAmount(
      ""
    );

    setEditDate(
      ""
    );
  }

  async function updateEntry() {
    if (!editingEntry) {
      return;
    }

    setError("");
    setSuccess("");

    const numericAmount =
      Number(editAmount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      setError(
        "Please enter a valid Salawat amount."
      );

      return;
    }

    if (!editDate) {

      setError(
        "Please select a valid date and time."
      );

      return;
    }

    const newDate =
      new Date(editDate);

    if (
      Number.isNaN(
        newDate.getTime()
      )
    ) {

      setError(
        "Please select a valid date and time."
      );

      return;
    }

    setUpdatingEntry(
      true
    );

    const {
      error: updateError,
    } = await supabase.rpc(
      "update_salawat_entry",
      {
        p_project_code:
          projectCode,

        p_admin_pin:
          adminPin,

        p_entry_id:
          editingEntry.id,

        p_amount:
          numericAmount,

        p_created_at:
          newDate.toISOString(),
      }
    );

    setUpdatingEntry(
      false
    );

    if (updateError) {

      console.error(
        updateError
      );

      setError(
        updateError.message ||
          "Unable to update entry."
      );

      return;
    }

    setEntries(
      (previous) =>
        previous
          .map(
            (entry) =>
              entry.id ===
              editingEntry.id
                ? {
                    ...entry,

                    amount:
                      numericAmount,

                    created_at:
                      newDate.toISOString(),
                  }
                : entry
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          )
    );

    setSuccess(
      `Entry for ${editingEntry.participant_name} updated.`
    );

    setEditingEntry(
      null
    );

    setEditAmount(
      ""
    );

    setEditDate(
      ""
    );

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
      (previous) =>
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

      router.push(
        "/"
      );

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
      <main className="min-h-screen bg-[#f7f3e9] px-4 py-4 sm:px-5">

        <div className="mx-auto w-full max-w-md">

          <div className="mb-5 rounded-3xl border border-[#cfded6] bg-[#eaf3ee] px-4 py-3 shadow-sm sm:px-5">

            <button
              type="button"
              onClick={
                backToProject
              }
              className="text-sm font-medium text-[#174c3c]"
            >
              ← Back to Project
            </button>

            <div className="-mt-1 flex flex-col items-center text-center">

              <p
                dir="rtl"
                className="text-base font-medium leading-none text-[#174c3c] sm:text-lg"
              >
                اللهم صل وسلم على نبينا محمد
              </p>

              <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#174c3c]">

                <span className="text-lg text-white">
                  ﷺ
                </span>

              </div>

              <h1 className="mt-2 text-2xl font-bold text-[#174c3c]">
                Admin Settings
              </h1>

              <p className="mt-1 text-sm text-[#50665b]">
                {project.project_name}
              </p>

              <p className="mt-1 text-xs font-medium text-[#567365]">

                Project ID:{" "}

                <span className="font-semibold text-[#174c3c]">
                  {project.project_code}
                </span>

              </p>

            </div>

          </div>

          <div className="rounded-3xl border border-[#e5ded0] bg-white p-7 shadow-sm">

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
              onChange={(e) => {

                setAdminPin(
                  e.target.value
                );

                setError("");
              }}
              onKeyDown={(e) => {

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
              className="mt-5 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:opacity-60"
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
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-5 sm:px-5">

      <div className="mx-auto w-full max-w-2xl">

        {/* ADMIN BANNER */}

        <div className="mb-5 rounded-3xl border border-[#cfded6] bg-[#eaf3ee] px-4 py-3 shadow-sm sm:px-5">

          <div className="flex items-start justify-between gap-3">

            <button
              type="button"
              onClick={
                backToProject
              }
              className="mt-1 text-sm font-medium text-[#174c3c]"
            >
              ← Back to Project
            </button>

            <div className="text-right">

              <p className="text-xs text-[#567365]">
                Project ID
              </p>

              <p className="text-xs font-semibold text-[#174c3c]">
                {project.project_code}
              </p>

            </div>

          </div>

          <div className="-mt-3 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#174c3c]">

              <span className="text-lg text-white">
                ﷺ
              </span>

            </div>

            <h1 className="mt-2 text-2xl font-bold text-[#174c3c]">
              Admin Settings
            </h1>

            <p className="mt-1 text-sm text-[#50665b]">
              Manage {project.project_name}
            </p>

          </div>

        </div>

        {/* MESSAGES */}

        {error && (

          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>

        )}

        {success && (

          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ {success}
          </div>

        )}

        {/* ADD FOR PARTICIPANT */}

        <div className="mb-5 rounded-3xl border border-[#bfd8cb] bg-white p-6 shadow-sm">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-xl">
              👤
            </div>

            <div>

              <h2 className="text-xl font-semibold text-gray-900">
                Add Salawat for Participant
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Record Salawat on someone else&apos;s behalf.
              </p>

            </div>

          </div>

          <div className="relative mt-6">

            <label
              htmlFor="participantSearch"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Participant Name
            </label>

            <div className="relative">

              <input
                id="participantSearch"
                type="text"
                autoComplete="off"
                value={
                  participantSearch
                }
                onFocus={() => {

                  setShowParticipantSuggestions(
                    true
                  );

                }}
                onChange={(e) => {

                  setParticipantSearch(
                    e.target.value
                  );

                  setSelectedParticipant(
                    ""
                  );

                  setShowParticipantSuggestions(
                    true
                  );

                  setError("");
                }}
                placeholder="Start typing a participant's name..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
              />

              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                🔎
              </div>

            </div>

            {showParticipantSuggestions && (

              <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#d7e3dc] bg-white p-2 shadow-xl">

                {filteredParticipantNames.length ===
                0 ? (

                  <div className="px-3 py-4 text-center">

                    <p className="text-sm text-gray-500">
                      No matching participant found.
                    </p>

                  </div>

                ) : (

                  filteredParticipantNames.map(
                    (name) => (

                      <button
                        key={name}
                        type="button"
                        onMouseDown={(e) => {

                          e.preventDefault();

                          chooseParticipant(
                            name
                          );

                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-[#eef6f2]"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-sm font-bold text-[#174c3c]">

                            {name
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <span className="truncate font-medium text-gray-800">
                            {name}
                          </span>

                        </div>

                        <span className="text-xs font-medium text-[#174c3c]">
                          Select
                        </span>

                      </button>

                    )
                  )

                )}

              </div>

            )}

            {selectedParticipant && (

              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#174c3c]">

                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#174c3c] text-[10px] text-white">
                  ✓
                </span>

                Selected:{" "}
                {selectedParticipant}

              </div>

            )}

          </div>

          <div className="mt-5">

            <label
              htmlFor="adminEntryAmount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Salawat Amount
            </label>

            <input
              id="adminEntryAmount"
              type="number"
              min="1"
              step="1"
              value={
                adminEntryAmount
              }
              onChange={(e) => {

                setAdminEntryAmount(
                  e.target.value
                );

                setError("");
              }}
              onKeyDown={(e) => {

                if (
                  e.key ===
                  "Enter"
                ) {
                  addParticipantEntry();
                }

              }}
              placeholder="Enter amount"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          <div className="mt-3 flex flex-wrap gap-2">

            {[
              10,
              33,
              100,
              500,
              1000,
            ].map(
              (preset) => (

                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setAdminEntryAmount(
                      String(preset)
                    )
                  }
                  className="rounded-full border border-[#174c3c]/25 bg-[#f4f8f6] px-3 py-1.5 text-xs font-semibold text-[#174c3c] transition hover:bg-[#eaf3ee]"
                >
                  +{preset.toLocaleString()}
                </button>

              )
            )}

          </div>

          <button
            type="button"
            disabled={
              addingEntry
            }
            onClick={
              addParticipantEntry
            }
            className="mt-6 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:opacity-60"
          >
            {addingEntry
              ? "Adding Entry..."
              : selectedParticipant
              ? `Add Salawat for ${selectedParticipant}`
              : "Choose Participant to Add Salawat"}
          </button>

        </div>

        {/* PROJECT SETTINGS */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Project Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update goals and project preferences.
          </p>

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
              onChange={(e) => {

                setProjectName(
                  e.target.value
                );

                setError("");
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

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
              onChange={(e) => {

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

          <div className="mt-5 rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

            <div className="mb-3">

              <p className="text-sm font-semibold text-[#174c3c]">
                Daily Salawat Goal
              </p>

              <p className="mt-1 text-xs text-gray-500">
                This is the daily target shown to the community.
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
              onChange={(e) => {

                setDailyGoal(
                  e.target.value
                );

                setError("");
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <div className="mt-3 flex flex-wrap gap-2">

              {[33, 100, 500, 1000].map(
                (preset) => (

                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setDailyGoal(
                        String(preset)
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

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f3e9] p-4">

            <input
              id="showParticipants"
              type="checkbox"
              checked={
                showParticipants
              }
              onChange={(e) =>
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

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              saveSettings
            }
            className="mt-6 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:opacity-60"
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
            Review, edit or remove incorrect Salawat entries.
          </p>

          <div className="mt-5 space-y-3">

            {entries.length === 0 ? (

              <div className="rounded-2xl bg-[#f7f3e9] p-5 text-center">

                <p className="text-sm text-gray-500">
                  No Salawat entries yet.
                </p>

              </div>

            ) : (

              entries.map((entry) => (

                <div
                  key={
                    entry.id
                  }
                  className="rounded-2xl bg-[#f7f3e9] px-4 py-3"
                >

                  <div className="flex items-center justify-between gap-4">

                    <div className="min-w-0">

                      <p className="truncate font-medium text-gray-900">
                        {entry.participant_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(
                          entry.created_at
                        ).toLocaleString()}
                      </p>

                    </div>

                    <div className="shrink-0 text-right">

                      <p className="font-semibold text-[#174c3c]">
                        +
                        {Number(
                          entry.amount
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#e7e1d6] pt-3">

                    <button
                      type="button"
                      onClick={() =>
                        startEditingEntry(
                          entry
                        )
                      }
                      className="rounded-lg border border-[#174c3c]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#174c3c] transition hover:bg-[#eef6f2]"
                    >
                      ✏️ Edit
                    </button>

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
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId ===
                      entry.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

        {/* EDIT ENTRY MODAL */}

        {editingEntry && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-5">

            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-[#174c3c]">
                    Edit Salawat Entry
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    {editingEntry.participant_name}
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    cancelEditingEntry
                  }
                  disabled={
                    updatingEntry
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f3e9] text-xl text-gray-600"
                >
                  ×
                </button>

              </div>

              <div className="mt-6">

                <label
                  htmlFor="editAmount"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Salawat Amount
                </label>

                <input
                  id="editAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={
                    editAmount
                  }
                  onChange={(e) => {

                    setEditAmount(
                      e.target.value
                    );

                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
                />

              </div>

              <div className="mt-5">

                <label
                  htmlFor="editDate"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Date &amp; Time
                </label>

                <input
                  id="editDate"
                  type="datetime-local"
                  value={
                    editDate
                  }
                  onChange={(e) => {

                    setEditDate(
                      e.target.value
                    );

                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Change this if the Salawat was entered for the wrong date.
                </p>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={
                    cancelEditingEntry
                  }
                  disabled={
                    updatingEntry
                  }
                  className="rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    updateEntry
                  }
                  disabled={
                    updatingEntry
                  }
                  className="rounded-xl bg-[#174c3c] py-3 font-semibold text-white disabled:opacity-60"
                >
                  {updatingEntry
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        )}

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