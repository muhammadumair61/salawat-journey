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

      setProjectId(cleanProjectId);
      setCheckingSharedProject(true);

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

      setCheckingSharedProject(false);

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

    setLoading(true);

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

    setLoading(false);

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

    setSharing(true);

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

    setSharing(false);

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

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
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

    setProjectName("");
    setProjectId("");
    setName("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-4 sm:px-6">

      <div className="mx-auto w-full max-w-6xl">

        {/* MAIN SAGE BANNER */}

        <div className="relative mb-5 rounded-3xl border border-[#cfded6] bg-[#eaf3ee] px-4 py-4 shadow-sm sm:px-6">

          {/* HOW TO USE */}

          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">

            <button
              type="button"
              onClick={() =>
                setShowHelp(true)
              }
              className="rounded-full border border-[#174c3c] bg-white/60 px-3 py-2 text-xs font-semibold text-[#174c3c] shadow-sm transition hover:bg-white sm:px-4 sm:text-sm"
            >
              ? How to Use
            </button>

          </div>

          {/* BRANDING */}

          <div className="flex flex-col items-center px-20 text-center">

            <p
              dir="rtl"
              className="text-base font-medium leading-none text-[#174c3c] sm:text-lg"
            >
              اللهم صل وسلم على نبينا محمد
            </p>

            <div className="mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#174c3c] shadow-sm">

              <span className="text-xl text-white">
                ﷺ
              </span>

            </div>

            <h1 className="mt-2 text-2xl font-bold leading-tight text-[#174c3c] sm:text-3xl">
              Salawat Journey
            </h1>

            <p className="mt-1 text-sm text-[#50665b]">
              Every Salawat counts. Join the Salawat project.
            </p>

          </div>

        </div>

        {/* MAIN CONTENT */}

        <div className="grid items-start gap-5 lg:grid-cols-[1fr_420px_1fr]">

          {/* LEFT - HADITH */}

          <div className="order-2 lg:order-1">

            <div className="rounded-3xl border border-[#d9e4de] bg-[#eef6f2] p-6 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#174c3c] text-lg text-white">
                  ﷺ
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5f7d70]">
                    Hadith
                  </p>

                  <h2 className="font-bold text-[#174c3c]">
                    The Reward of Salawat
                  </h2>

                </div>

              </div>

              <p
                dir="rtl"
                className="text-right text-xl font-medium leading-9 text-gray-900"
              >
                مَنْ صَلَّى عَلَيَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا
              </p>

              <div className="my-5 h-px bg-[#d5e3dc]" />

              <p className="text-sm leading-7 text-gray-700">
                “Whoever sends blessings upon me once, Allah will send blessings upon him ten times.”
              </p>

              <div className="mt-5 rounded-xl bg-white/70 px-4 py-3">

                <p className="text-xs font-semibold text-[#174c3c]">
                  Sahih Muslim 408
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Narrated by Abu Hurairah رضي الله عنه
                </p>

              </div>

            </div>

          </div>

          {/* CENTER - LOGIN */}

          <div className="order-1 lg:order-2">

            <div className="rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-lg sm:p-8">

              {checkingSharedProject ? (

                <div className="py-8 text-center">

                  <p className="font-medium text-[#174c3c]">
                    Loading project...
                  </p>

                </div>

              ) : sharedProjectFound ? (

                <>
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
                      value={projectId}
                      onChange={(e) => {
                        setProjectId(
                          e.target.value.toUpperCase()
                        );

                        setCopied(false);
                        setError("");
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

                  <div className="my-7 flex items-center gap-3">

                    <div className="h-px flex-1 bg-gray-200" />

                    <span className="text-xs text-gray-400">
                      OR
                    </span>

                    <div className="h-px flex-1 bg-gray-200" />

                  </div>

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

          {/* RIGHT - QURAN */}

          <div className="order-3">

            <div className="rounded-3xl border border-[#eadba6] bg-[#fff9e8] p-6 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a37b22] text-lg text-white">
                  ۞
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-[#967a3d]">
                    Qur&apos;an
                  </p>

                  <h2 className="font-bold text-[#7b601e]">
                    Allah&apos;s Command
                  </h2>

                </div>

              </div>

              <p
                dir="rtl"
                className="text-right text-xl font-medium leading-9 text-gray-900"
              >
                إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا
              </p>

              <div className="my-5 h-px bg-[#eadfb8]" />

              <p className="text-sm leading-7 text-gray-700">
                “Indeed, Allah showers His blessings upon the Prophet, and His angels pray for him. O believers! Invoke Allah&apos;s blessings upon him, and salute him with worthy greetings of peace.”
              </p>

              <div className="mt-5 rounded-xl bg-white/70 px-4 py-3">

                <p className="text-xs font-semibold text-[#7b601e]">
                  Surah Al-Ahzab — 33:56
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* HOW TO USE MODAL */}

      {showHelp && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-7">

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
                  setShowHelp(false)
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

              <div className="rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

                <p className="font-semibold text-[#174c3c]">
                  1. Join an Existing Project
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Enter the Project ID and your name, then select Continue. If you received a shared project link, simply enter your name and select Join Project.
                </p>

              </div>

              <div className="rounded-2xl border border-[#d7e3dc] bg-[#f4f8f6] p-4">

                <p className="font-semibold text-[#174c3c]">
                  2. Create a New Project
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Select Create a New Project and enter the project name, unique Project ID, overall Salawat goal, your name, and an Admin PIN.
                </p>

                <p className="mt-2 text-sm font-medium text-[#174c3c]">
                  Keep your Admin PIN private.
                </p>

              </div>

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  How do I share a project?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Enter the Project ID on the main page and select Share Project Link. The link can then be sent through WhatsApp, text, email, or another messaging app.
                </p>

              </div>

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  How do I add Salawat?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  After joining a project, use a quick-add button or enter your own custom amount.
                </p>

              </div>

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What is the Scorecard?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The Scorecard shows everyone&apos;s Salawat contribution and overall community progress.
                </p>

              </div>

              <div className="rounded-2xl bg-[#f7f3e9] p-4">

                <p className="font-semibold text-gray-900">
                  What can the Admin do?
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  The admin can change the project name, project goal, daily goal, participant visibility, and remove incorrect entries.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowHelp(false)
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
        <main className="flex min-h-screen items-center justify-center bg-[#f7f3e9]">

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