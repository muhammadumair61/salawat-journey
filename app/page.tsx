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

  const [sharedProjectFound, setSharedProjectFound] =
    useState(false);

  const [checkingSharedProject, setCheckingSharedProject] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [error, setError] =
    useState("");

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
  }, [sharedProjectId]);

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
    <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

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
                      e.key === "Enter"
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

              <p className="mt-1 mb-6 text-sm text-gray-500">
                Enter your project ID and your name to continue.
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
                  placeholder="Example: Enter Project ID"
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
                      e.key === "Enter"
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
                className="w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-not-allowed disabled:opacity-60"
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