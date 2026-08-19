"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function CreateProjectPage() {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [goal, setGoal] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateProject() {
    setError("");

    const cleanProjectName = projectName.trim();
    const cleanProjectId = projectId.trim().toUpperCase();
    const cleanAdminName = adminName.trim();

    if (!cleanProjectName) {
      setError("Please enter a project name.");
      return;
    }

    if (!cleanProjectId) {
      setError("Please enter a project ID.");
      return;
    }

    if (!/^[A-Z0-9_-]+$/.test(cleanProjectId)) {
      setError(
        "Project ID can only contain letters, numbers, hyphens and underscores."
      );
      return;
    }

    if (!goal || Number(goal) <= 0) {
      setError("Please enter a valid Salawat goal.");
      return;
    }

    if (!cleanAdminName) {
      setError("Please enter your name.");
      return;
    }

    if (adminPin.trim().length < 4) {
      setError("Admin PIN must be at least 4 characters.");
      return;
    }

    setLoading(true);

    const { error: createError } = await supabase.rpc(
      "create_salawat_project",
      {
        p_project_name: cleanProjectName,
        p_project_code: cleanProjectId,
        p_goal: Number(goal),
        p_admin_name: cleanAdminName,
        p_admin_pin: adminPin,
      }
    );

    setLoading(false);

    if (createError) {
      console.error(createError);

      if (
        createError.message
          .toLowerCase()
          .includes("duplicate")
      ) {
        setError(
          "That Project ID already exists. Please choose another one."
        );
        return;
      }

      setError(
        createError.message ||
          "Unable to create project. Please try again."
      );

      return;
    }

    router.push(
      `/project?projectId=${encodeURIComponent(
        cleanProjectId
      )}&name=${encodeURIComponent(cleanAdminName)}`
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-4 sm:px-5">

      <div className="mx-auto w-full max-w-md">

        {/* SAGE HEADER BANNER */}

        <div className="mb-5 rounded-3xl border border-[#cfded6] bg-[#eaf3ee] px-4 py-3 shadow-sm sm:px-5">

          {/* BACK BUTTON */}

          <div className="flex items-center justify-start">

            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm font-medium text-[#174c3c]"
            >
              ← Back
            </button>

          </div>

          {/* CENTER CONTENT */}

          <div className="-mt-2 flex flex-col items-center text-center">

            <p
              dir="rtl"
              className="text-base font-medium leading-none text-[#174c3c] sm:text-lg"
            >
              اللهم صل وسلم على نبينا محمد
            </p>

            <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#174c3c] shadow-sm">

              <span className="text-lg text-white">
                ﷺ
              </span>

            </div>

            <h1 className="mt-2 text-2xl font-bold leading-tight text-[#174c3c]">
              Create Project
            </h1>

            <p className="mt-1 text-sm text-[#50665b]">
              Start a new Salawat journey.
            </p>

          </div>

        </div>

        {/* CREATE PROJECT FORM */}

        <div className="rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-lg sm:p-8">

          {/* PROJECT NAME */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Project Name
            </label>

            <input
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                setError("");
              }}
              placeholder="Enter Project Name Here"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          {/* PROJECT ID */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Project ID
            </label>

            <input
              value={projectId}
              onChange={(e) => {
                setProjectId(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_-]/g, "")
                );

                setError("");
              }}
              placeholder="Enter Project ID Here"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Participants will use this ID to join your project.
            </p>

          </div>

          {/* SALAWAT GOAL */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Salawat Goal
            </label>

            <input
              type="number"
              min="1"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setError("");
              }}
              placeholder="1000000"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          {/* ADMIN NAME */}

          <div className="mb-5">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Your Name
            </label>

            <input
              value={adminName}
              onChange={(e) => {
                setAdminName(e.target.value);
                setError("");
              }}
              placeholder="Enter Your Name Here"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          {/* ADMIN PIN */}

          <div className="mb-6">

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Admin PIN
            </label>

            <input
              type="password"
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value);
                setError("");
              }}
              placeholder="At least 4 digits"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

            <p className="mt-2 text-xs text-gray-500">
              Keep this PIN safe. It will be used for project management.
            </p>

          </div>

          {/* ERROR */}

          {error && (

            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>

          )}

          {/* CREATE BUTTON */}

          <button
            type="button"
            disabled={loading}
            onClick={handleCreateProject}
            className="w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating Project..."
              : "Create Project"}
          </button>

        </div>

      </div>

    </main>
  );
}