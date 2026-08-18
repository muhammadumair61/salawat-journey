"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase/client";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sharedProjectId =
    searchParams.get("projectId");

  const [projectId, setProjectId] =
    useState("");

  const [name, setName] =
    useState("");

  const [projectName, setProjectName] =
    useState("");

  const [
    sharedProjectFound,
    setSharedProjectFound,
  ] = useState(false);

  const [
    checkingSharedProject,
    setCheckingSharedProject,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showHelp, setShowHelp] =
    useState(false);

  useEffect(() => {
    async function loadSharedProject() {
      if (!sharedProjectId) {
        return;
      }

      const cleanProjectId =
        sharedProjectId
          .trim()
          .toUpperCase();

      if (!cleanProjectId) {
        return;
      }

      setProjectId(
        cleanProjectId
      );

      setCheckingSharedProject(
        true
      );

      const {
        data,
        error: projectError,
      } = await supabase
        .from("projects")
        .select(
          "project_code, project_name"
        )
        .eq(
          "project_code",
          cleanProjectId
        )
        .maybeSingle();

      setCheckingSharedProject(
        false
      );

      if (projectError) {
        console.error(
          projectError
        );

        setError(
          "Unable to load the shared project."
        );

        return;
      }

      if (!data) {
        setError(
          "This shared project could not be found."
        );

        return;
      }

      setProjectName(
        data.project_name
      );

      setSharedProjectFound(
        true
      );
    }

    loadSharedProject();
  }, [
    sharedProjectId,
  ]);

  async function handleContinue() {
    setError("");

    const cleanProjectId =
      projectId
        .trim()
        .toUpperCase();

    const cleanName =
      name.trim();

    if (!cleanProjectId) {
      setError(
        "Please enter the Project ID."
      );

      return;
    }

    if (!cleanName) {
      setError(
        "Please enter your name."
      );

      return;
    }

    setLoading(
      true
    );

    const {
      data,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        "project_code, project_name"
      )
      .eq(
        "project_code",
        cleanProjectId
      )
      .maybeSingle();

    setLoading(
      false
    );

    if (projectError) {
      console.error(
        projectError
      );

      setError(
        "Unable to connect. Please try again."
      );

      return;
    }

    if (!data) {
      setError(
        "Project not found. Please check the Project ID."
      );

      return;
    }

    router.push(
      `/project?projectId=${encodeURIComponent(
        cleanProjectId
      )}&name=${encodeURIComponent(
        cleanName
      )}`
    );
  }

  async function shareProject() {
    setError("");
    setCopied(false);

    const cleanProjectId =
      projectId
        .trim()
        .toUpperCase();

    if (!cleanProjectId) {
      setError(
        "Enter the Project ID first."
      );

      return;
    }

    setSharing(
      true
    );

    const {
      data,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        "project_code, project_name"
      )
      .eq(
        "project_code",
        cleanProjectId
      )
      .maybeSingle();

    setSharing(
      false
    );

    if (projectError) {
      console.error(
        projectError
      );

      setError(
        "Unable to find the project."
      );

      return;
    }

    if (!data) {
      setError(
        "Project not found. Please check the Project ID."
      );

      return;
    }

    const projectLink =
      `${window.location.origin}/?projectId=${encodeURIComponent(
        data.project_code
      )}`;

    try {
      await navigator.clipboard.writeText(
        projectLink
      );

      setCopied(
        true
      );

      window.setTimeout(
        () => {
          setCopied(
            false
          );
        },
        2500
      );
    } catch {
      setError(
        "Unable to copy the link."
      );
    }
  }

  function handleCreateProject() {
    router.push(
      "/create-project"
    );
  }

  function joinDifferentProject() {
    router.push("/");

    setSharedProjectFound(
      false
    );

    setProjectName(
      ""
    );

    setProjectId(
      ""
    );

    setName(
      ""
    );

    setError(
      ""
    );
  }

  return (
    <main className="relative min-h-screen bg-[#f7f3e9] px-5 py-10">

      {/* HOW TO USE - TOP RIGHT */}

      <div className="absolute right-5 top-5 sm:right-8 sm:top-7">

        <button
          type="button"
          onClick={() =>
            setShowHelp(
              true
            )
          }
          className="rounded-full border border-[#174c3c] bg-white px-4 py-2 text-sm font-semibold text-[#174c3c] shadow-sm transition hover:bg-[#eef6f2]"
        >
          ? How to Use
        </button>

      </div>

      <div className="mx-auto w-full max-w-md pt-14 sm:pt-10">

        {/* HEADER */}

        <div className="mb-8 text-center">

          <p
            dir="rtl"
            className="mb-5 text-2xl font-medium text-[#174c3c]"
          >
            اللهم صل وسلم على نبينا محمد
          </p>

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#174c3c] shadow-md">

            <span className="text-4xl text-white">
              ﷺ
            </span>

          </div>

          <h1 className="text-3xl font-bold text-[#174c3c]">
            Salawat Journey
          </h1>

          <p className="mt-3 text-gray-600">
            Every Salawat counts. Join the Salawat project.
          </p>

        </div>

        {/* MAIN CARD */}

        <div className="rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-lg sm:p-8">

          {checkingSharedProject ? (

            <div className="py-8 text-center">

              <p className="font-medium text-[#174c3c]">
                Loading project...
              </p>

            </div>

          ) : sharedProjectFound ? (

            <>
              {/* SHARED PROJECT */}

              <div className="mb-7 text-center">

                <p className="text-sm font-medium text-[#174c3c]">
                  You&apos;re joining
                </p>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {projectName}
                </h2>

                <div className="mt-3 inline-flex rounded-full bg-[#f1f7f4] px-4 py-2 text-xs font-semibold text-[#174c3c]">
                  {projectId}
                </div>

              </div>

              <div className="mb-6">

                <label
                  htmlFor="sharedName"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Your Name
                </label>

                <input
                  id="sharedName"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(
                      e.target.value
                    );

                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleContinue();
                    }
                  }}
                  placeholder="Enter your name"
                  autoFocus
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
                />

              </div>

              {error && (

                <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>

              )}

              <button
                type="button"
                onClick={
                  handleContinue
                }
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:opacity-60"
              >
                {loading
                  ? "Joining..."
                  : "Join Project"}
              </button>

              <button
                type="button"
                onClick={
                  joinDifferentProject
                }
                className="mt-4 w-full text-sm font-medium text-gray-500"
              >
                Join a different project
              </button>

            </>

          ) : (

            <>
              {/* NORMAL PROJECT LOGIN */}

              <h2 className="text-xl font-semibold text-gray-900">
                Enter Project
              </h2>

              <p className="mb-6 mt-1 text-sm text-gray-500">
                Enter your Project ID and your name to continue.
              </p>

              <div className="mb-5">

                <label
                  htmlFor="projectId"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Project ID
                </label>

                <input
                  id="projectId"
                  type="text"
                  value={
                    projectId
                  }
                  onChange={(e) => {
                    setProjectId(
                      e.target.value.toUpperCase()
                    );

                    setCopied(
                      false
                    );

                    setError(
                      ""
                    );
                  }}
                  placeholder="Enter Project ID"
                  autoCapitalize="characters"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
                />

              </div>

              <div className="mb-6">

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Your Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={
                    name
                  }
                  onChange={(e) => {
                    setName(
                      e.target.value
                    );

                    setError(
                      ""
                    );
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      handleContinue();
                    }
                  }}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
                />

              </div>

              {error && (

                <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>

              )}

              <button
                type="button"
                onClick={
                  handleContinue
                }
                disabled={
                  loading
                }
                className="w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:opacity-60"
              >
                {loading
                  ? "Finding Project..."
                  : "Continue"}
              </button>

              {/* SHARE PROJECT */}

              <button
                type="button"
                onClick={
                  shareProject
                }
                disabled={
                  sharing
                }
                className="mt-3 w-full rounded-xl border border-[#174c3c] py-3.5 font-semibold text-[#174c3c] transition hover:bg-[#f1f7f4] disabled:opacity-60"
              >
                {sharing
                  ? "Finding Project..."
                  : copied
                  ? "✓ Share Link Copied"
                  : "Share Project Link"}
              </button>

              <p className="mt-2 text-center text-xs text-gray-400">
                Enter a Project ID to copy its shareable link.
              </p>

              {/* OR */}

              <div className="my-7 flex items-center gap-3">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs text-gray-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>

              {/* CREATE NEW PROJECT */}

              <button
                type="button"
                onClick={
                  handleCreateProject
                }
                className="w-full rounded-xl border border-gray-300 py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Create a New Project
              </button>

            </>

          )}

        </div>

      </div>

      {/* HOW TO USE MODAL */}

      {showHelp && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-7">

            {/* HELP HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-[#174c3c]">
                  Salawat Journey
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  How to Use
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHelp(
                    false
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7f3e9] text-xl text-gray-600"
              >
                ×
              </button>

            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Salawat Journey helps individuals and groups track their Salawat together toward a shared goal.
            </p>

            <div className="mt-6 space-y-4">

              {/* JOIN PROJECT */}

              <div className="rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

                <div className="mb-3 flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#174c3c] text-sm font-bold text-white">
                    1
                  </div>

                  <p className="font-semibold text-[#174c3c]">
                    Join an Existing Project
                  </p>

                </div>

                <p className="text-sm leading-6 text-gray-600">
                  If someone has already created a Salawat project, ask them for the Project ID or use the project link they shared with you.
                </p>

                <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-gray-600">

                  <p>
                    Enter the <strong>Project ID</strong>.
                  </p>

                  <p>
                    Enter <strong>Your Name</strong>.
                  </p>

                  <p>
                    Select <strong>Continue</strong>.
                  </p>

                </div>

                <p className="mt-3 text-sm leading-6 text-gray-600">
                  If you received a shared project link, the Project ID is selected automatically. You only need to enter your name and select <strong>Join Project</strong>.
                </p>

              </div>

              {/* CREATE PROJECT */}

              <div className="rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

                <div className="mb-3 flex items-center gap-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#174c3c] text-sm font-bold text-white">
                    2
                  </div>

                  <p className="font-semibold text-[#174c3c]">
                    Create a New Project
                  </p>

                </div>

                <p className="text-sm leading-6 text-gray-600">
                  Select <strong>Create a New Project</strong> at the bottom of the main page.
                </p>

                <div className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-gray-600">

                  <p>
                    <strong>Project Name</strong> — the name participants will see.
                  </p>

                  <p className="mt-1">
                    <strong>Project ID</strong> — the unique ID participants use to join.
                  </p>

                  <p className="mt-1">
                    <strong>Salawat Goal</strong> — the overall target for the project.
                  </p>

                  <p className="mt-1">
                    <strong>Your Name</strong> — the project creator.
                  </p>

                  <p className="mt-1">
                    <strong>Admin PIN</strong> — used later to manage the project.
                  </p>

                </div>

                <p className="mt-3 text-sm font-medium text-[#174c3c]">
                  Keep your Admin PIN private.
                </p>

              </div>

              {/* PROJECT ID */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is a Project ID?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  A Project ID uniquely identifies a Salawat project. Participants use it to find and join the correct project.
                </p>

              </div>

              {/* SHARE */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  How do I share a project?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  On the main page, enter the Project ID and select <strong>Share Project Link</strong>.
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The project link is copied to your device. You can paste it into WhatsApp, text messages, email, or another app.
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  When someone opens that link, the project is automatically selected. They only need to enter their name.
                </p>

              </div>

              {/* ADD SALAWAT */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  How do I add Salawat?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  After joining a project, use one of the quick-add buttons or enter your own amount in the Custom Amount field.
                </p>

              </div>

              {/* DAILY GOAL */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is the Daily Goal?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The Daily Goal is the daily Salawat target for each participant. The project admin can adjust this target.
                </p>

              </div>

              {/* PROJECT GOAL */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is the Project Goal?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The Project Goal is the combined Salawat target for everyone in the project. Every participant&apos;s contribution adds to the project total.
                </p>

              </div>

              {/* SCORECARD */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is the Scorecard?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The Scorecard shows how much Salawat each participant has contributed to the project. Participants are listed according to their total contributions.
                </p>

              </div>

              {/* MILESTONES */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is the Milestone Ladder?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The Milestone Ladder shows the project&apos;s progress through 10%, 25%, 50%, 75%, and 100% of the overall goal.
                </p>

              </div>

              {/* ADMIN */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What can the project admin do?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The admin can change the project name, overall goal, daily goal, control participant visibility, and remove incorrect Salawat entries.
                </p>

              </div>

              {/* WRONG ENTRY */}

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What if I enter the wrong amount?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Contact the project admin. The admin can review recent entries and remove an incorrect entry.
                </p>

              </div>

            </div>

            {/* CLOSE HELP */}

            <button
              type="button"
              onClick={() =>
                setShowHelp(
                  false
                )
              }
              className="mt-6 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white"
            >
              Got It
            </button>

          </div>

        </div>

      )}

    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center">
          <p className="font-medium text-[#174c3c]">
            Loading...
          </p>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}