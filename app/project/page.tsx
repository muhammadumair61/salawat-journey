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

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { supabase } from "@/lib/supabase/client";

type Project = {
  id: string;
  project_code: string;
  project_name: string;
  goal: number;
  daily_goal: number;
  created_by: string;
  created_at: string;
  show_participants: boolean;
};

type SalawatEntry = {
  id: number;
  project_id: string;
  participant_name: string;
  amount: number;
  created_at: string;
};

type ParticipantTotal = {
  name: string;
  total: number;
};

type ChartDay = {
  day: string;
  total: number;
};

function ProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectCode =
    searchParams.get("projectId")?.trim().toUpperCase() || "";

  const userName =
    searchParams.get("name")?.trim() || "Guest";

  const [project, setProject] =
    useState<Project | null>(null);

  const [entries, setEntries] =
    useState<SalawatEntry[]>([]);

  const [amount, setAmount] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [pendingAmount, setPendingAmount] =
    useState<number | null>(null);

  const [currentTime, setCurrentTime] =
    useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectCode) {
      router.push("/");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: projectData,
      error: projectError,
    } = await supabase
      .from("projects")
      .select(
        "id, project_code, project_name, goal, daily_goal, created_by, created_at, show_participants"
      )
      .eq(
        "project_code",
        projectCode
      )
      .maybeSingle();

    if (projectError) {
      console.error(projectError);
      setError("Unable to load project.");
      setLoading(false);
      return;
    }

    if (!projectData) {
      setError("Project not found.");
      setLoading(false);
      return;
    }

    const cleanProject: Project = {
      id: projectData.id,
      project_code: projectData.project_code,
      project_name: projectData.project_name,
      goal: Number(projectData.goal),
      daily_goal: Number(projectData.daily_goal) || 100,
      created_by: projectData.created_by,
      created_at: projectData.created_at,
      show_participants:
        projectData.show_participants ?? true,
    };

    setProject(cleanProject);

    const {
      data: entryData,
      error: entryError,
    } = await supabase
      .from("salawat_entries")
      .select(
        "id, project_id, participant_name, amount, created_at"
      )
      .eq(
        "project_id",
        cleanProject.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (entryError) {
      console.error(entryError);
      setError("Unable to load Salawat entries.");
      setLoading(false);
      return;
    }

    const cleanEntries: SalawatEntry[] =
      (entryData || []).map(
        (entry) => ({
          id: Number(entry.id),
          project_id: entry.project_id,
          participant_name: entry.participant_name,
          amount: Number(entry.amount),
          created_at: entry.created_at,
        })
      );

    setEntries(cleanEntries);
    setLoading(false);
  }, [
    projectCode,
    router,
  ]);

  useEffect(() => {
    loadProject();
  }, [
    loadProject,
  ]);

  const total =
    useMemo(() => {
      return entries.reduce(
        (sum, entry) =>
          sum + Number(entry.amount),
        0
      );
    }, [
      entries,
    ]);

  const myEntries =
    useMemo(() => {
      return entries.filter(
        (entry) =>
          entry.participant_name
            .trim()
            .toLowerCase() ===
          userName
            .trim()
            .toLowerCase()
      );
    }, [
      entries,
      userName,
    ]);

  const myTotal =
    useMemo(() => {
      return myEntries.reduce(
        (sum, entry) =>
          sum + Number(entry.amount),
        0
      );
    }, [
      myEntries,
    ]);

  const todayTotal =
    useMemo(() => {
      if (!currentTime) {
        return 0;
      }

      return myEntries
        .filter((entry) => {
          const entryDate =
            new Date(entry.created_at);

          return (
            entryDate.getFullYear() ===
              currentTime.getFullYear() &&
            entryDate.getMonth() ===
              currentTime.getMonth() &&
            entryDate.getDate() ===
              currentTime.getDate()
          );
        })
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount),
          0
        );
    }, [
      myEntries,
      currentTime,
    ]);

  const dailyGoal =
    Number(project?.daily_goal) || 100;

  const dailyPercentage =
    Math.min(
      (todayTotal / dailyGoal) * 100,
      100
    );

  const dailyRemaining =
    Math.max(
      dailyGoal - todayTotal,
      0
    );

  const weeklyProjectTotal =
    useMemo(() => {
      if (!currentTime) {
        return 0;
      }

      const sevenDaysAgo =
        new Date(currentTime);

      sevenDaysAgo.setHours(
        0,
        0,
        0,
        0
      );

      sevenDaysAgo.setDate(
        sevenDaysAgo.getDate() - 6
      );

      return entries
        .filter((entry) => {
          const entryDate =
            new Date(entry.created_at);

          return (
            entryDate >=
            sevenDaysAgo
          );
        })
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount),
          0
        );
    }, [
      entries,
      currentTime,
    ]);

  const monthlyProjectTotal =
    useMemo(() => {
      if (!currentTime) {
        return 0;
      }

      return entries
        .filter((entry) => {
          const entryDate =
            new Date(entry.created_at);

          return (
            entryDate.getMonth() ===
              currentTime.getMonth() &&
            entryDate.getFullYear() ===
              currentTime.getFullYear()
          );
        })
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount),
          0
        );
    }, [
      entries,
      currentTime,
    ]);

  const percentage =
    useMemo(() => {
      if (
        !project ||
        Number(project.goal) <= 0
      ) {
        return 0;
      }

      return Math.min(
        (total / Number(project.goal)) * 100,
        100
      );
    }, [
      total,
      project,
    ]);

  const remaining =
    project
      ? Math.max(
          Number(project.goal) - total,
          0
        )
      : 0;

  const participantTotals =
    useMemo<ParticipantTotal[]>(() => {
      const totals =
        new Map<
          string,
          {
            name: string;
            total: number;
          }
        >();

      entries.forEach((entry) => {
        const cleanName =
          entry.participant_name.trim();

        const key =
          cleanName.toLowerCase();

        const existing =
          totals.get(key);

        if (existing) {
          existing.total +=
            Number(entry.amount);
        } else {
          totals.set(
            key,
            {
              name: cleanName,
              total: Number(entry.amount),
            }
          );
        }
      });

      return Array.from(
        totals.values()
      ).sort(
        (a, b) =>
          b.total - a.total
      );
    }, [
      entries,
    ]);

  const chartData =
    useMemo<ChartDay[]>(() => {
      if (!currentTime) {
        return [];
      }

      const days: ChartDay[] =
        [];

      for (
        let i = 6;
        i >= 0;
        i--
      ) {
        const date =
          new Date(currentTime);

        date.setHours(
          0,
          0,
          0,
          0
        );

        date.setDate(
          date.getDate() - i
        );

        const nextDate =
          new Date(date);

        nextDate.setDate(
          nextDate.getDate() + 1
        );

        const dayTotal =
          entries
            .filter((entry) => {
              const entryDate =
                new Date(
                  entry.created_at
                );

              return (
                entryDate >= date &&
                entryDate < nextDate
              );
            })
            .reduce(
              (sum, entry) =>
                sum +
                Number(entry.amount),
              0
            );

        days.push({
          day:
            date.toLocaleDateString(
              "en-US",
              {
                weekday: "short",
              }
            ),
          total: dayTotal,
        });
      }

      return days;
    }, [
      entries,
      currentTime,
    ]);

  const goalChartData =
    useMemo(() => {
      if (!project) {
        return [
          {
            name: "Completed",
            value: 0,
          },
          {
            name: "Remaining",
            value: 1,
          },
        ];
      }

      return [
        {
          name: "Completed",
          value: total,
        },
        {
          name: "Remaining",
          value: remaining,
        },
      ];
    }, [
      project,
      total,
      remaining,
    ]);

  const milestones =
    useMemo(() => {
      if (!project) {
        return [];
      }

      const goal =
        Number(project.goal);

      return [
        {
          percent: 10,
          label: "Getting Started",
          amount:
            Math.round(
              goal * 0.1
            ),
        },
        {
          percent: 25,
          label: "Building Momentum",
          amount:
            Math.round(
              goal * 0.25
            ),
        },
        {
          percent: 50,
          label: "Halfway",
          amount:
            Math.round(
              goal * 0.5
            ),
        },
        {
          percent: 75,
          label: "Almost There",
          amount:
            Math.round(
              goal * 0.75
            ),
        },
        {
          percent: 100,
          label: "Project Goal",
          amount: goal,
        },
      ];
    }, [
      project,
    ]);

  function askQuickAddConfirmation(
    value: number
  ) {
    setPendingAmount(value);
  }

  async function addSalawat(
    value?: number
  ) {
    if (!project) {
      return;
    }

    setError("");
    setSuccess("");

    const salawatAmount =
      value !== undefined
        ? value
        : Number(amount);

    if (
      !Number.isFinite(salawatAmount) ||
      salawatAmount <= 0
    ) {
      setError(
        "Please enter a valid Salawat amount."
      );

      return;
    }

    setAdding(true);

    const {
      data,
      error: insertError,
    } = await supabase
      .from("salawat_entries")
      .insert({
        project_id: project.id,
        participant_name: userName,
        amount: salawatAmount,
      })
      .select(
        "id, project_id, participant_name, amount, created_at"
      )
      .single();

    setAdding(false);

    if (insertError) {
      console.error(insertError);

      setError(
        "Unable to save your Salawat. Please try again."
      );

      return;
    }

    const cleanEntry: SalawatEntry = {
      id: Number(data.id),
      project_id: data.project_id,
      participant_name: data.participant_name,
      amount: Number(data.amount),
      created_at: data.created_at,
    };

    setEntries(
      (previous) => [
        cleanEntry,
        ...previous,
      ]
    );

    setAmount("");
    setPendingAmount(null);

    setCurrentTime(new Date());

    setSuccess(
      `${salawatAmount.toLocaleString()} Salawat added.`
    );

    window.setTimeout(
      () => {
        setSuccess("");
      },
      2500
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
            Loading Salawat project...
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

          <p className="mt-2 text-gray-500">
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

  return (
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-8 sm:px-5">

      <div className="mx-auto w-full max-w-3xl">

        {/* SALAWAT TOP */}

        <p
          dir="rtl"
          className="mb-6 text-center text-2xl font-medium text-[#174c3c]"
        >
          اللهم صل وسلم على نبينا محمد
        </p>

        {/* TOP NAV */}

        <div className="mb-6 flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="text-sm font-medium text-[#174c3c]"
          >
            ← Leave Project
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin?projectId=${encodeURIComponent(
                  project.project_code
                )}&name=${encodeURIComponent(
                  userName
                )}`
              )
            }
            className="rounded-full border border-[#174c3c] px-3 py-1.5 text-xs font-semibold text-[#174c3c] transition hover:bg-[#eef6f2]"
          >
            Admin
          </button>

        </div>

        {/* PROJECT HEADER */}

        <div className="mb-7 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#174c3c]">

            <span className="text-3xl text-white">
              ﷺ
            </span>

          </div>

          <h1 className="text-3xl font-bold text-[#174c3c]">
            {project.project_name}
          </h1>

          <p className="mt-3 text-gray-600">
            Assalamu Alaikum,{" "}
            {userName}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Project ID:{" "}
            <span className="font-semibold text-[#174c3c]">
              {project.project_code}
            </span>
          </p>

        </div>

        {/* PROJECT GOAL */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <div className="text-center">

            <p className="text-sm text-gray-500">
              Project Goal
            </p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {Number(
                project.goal
              ).toLocaleString()}{" "}
              Salawat
            </p>

          </div>

          <div className="relative mx-auto mt-5 h-56 w-56">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={goalChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={96}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell
                    fill="#174c3c"
                  />

                  <Cell
                    fill="#e5e7eb"
                  />
                </Pie>

              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

              <p className="text-4xl font-bold text-[#174c3c]">
                {percentage.toFixed(0)}%
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Complete
              </p>

            </div>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-[#f7f3e9] p-4 text-center">

              <p className="text-xs text-gray-500">
                Completed
              </p>

              <p className="mt-1 text-xl font-bold text-[#174c3c]">
                {total.toLocaleString()}
              </p>

            </div>

            <div className="rounded-2xl bg-[#f7f3e9] p-4 text-center">

              <p className="text-xs text-gray-500">
                Remaining
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">
                {remaining.toLocaleString()}
              </p>

            </div>

          </div>

        </div>

        {/* DAILY GOAL */}

        <div className="mb-5 rounded-3xl bg-[#174c3c] p-6 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-white/70">
                Your Daily Goal
              </p>

              <p className="mt-1 text-3xl font-bold">
                {todayTotal.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-white/70">
                of{" "}
                {dailyGoal.toLocaleString()}{" "}
                Salawat
              </p>

            </div>

            <div className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold">
              {dailyPercentage.toFixed(0)}%
            </div>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">

            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{
                width: `${dailyPercentage}%`,
              }}
            />

          </div>

          <p className="mt-3 text-sm text-white/70">
            {dailyRemaining === 0
              ? "✓ Daily goal completed!"
              : `${dailyRemaining.toLocaleString()} remaining today`}
          </p>

        </div>

        {/* PERSONAL / PROJECT STATS */}

        <div className="mb-5 grid gap-3 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Your Total
            </p>

            <p className="mt-1 text-3xl font-bold text-[#174c3c]">
              {myTotal.toLocaleString()}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Last 7 Days
            </p>

            <p className="mt-1 text-3xl font-bold text-[#174c3c]">
              {weeklyProjectTotal.toLocaleString()}
            </p>

          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              This Month
            </p>

            <p className="mt-1 text-3xl font-bold text-[#174c3c]">
              {monthlyProjectTotal.toLocaleString()}
            </p>

          </div>

        </div>

        {/* ADD SALAWAT */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Add Salawat
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add the Salawat you completed.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">

            {[10, 33, 100, 500, 1000].map(
              (value) => (

                <button
                  key={value}
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    askQuickAddConfirmation(
                      value
                    )
                  }
                  className="rounded-xl border border-[#174c3c] py-3 font-semibold text-[#174c3c] transition hover:bg-[#eef6f2] disabled:opacity-50"
                >
                  +{value}
                </button>

              )
            )}

          </div>

          <div className="mt-5">

            <label
              htmlFor="customAmount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Custom Amount
            </label>

            <input
              id="customAmount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(
                  e.target.value
                );

                setError("");
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  addSalawat();
                }
              }}
              placeholder="Example: 250"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#174c3c] focus:ring-2 focus:ring-[#174c3c]/20"
            />

          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              ✓ {success}
            </div>
          )}

          <button
            type="button"
            disabled={adding}
            onClick={() =>
              addSalawat()
            }
            className="mt-4 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white transition hover:bg-[#103d30] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding
              ? "Saving..."
              : "Add Salawat"}
          </button>

        </div>

        {/* 7 DAY CHART */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Last 7 Days
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Project Salawat activity
          </p>

          <div className="mt-5 h-64">

            {currentTime ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={chartData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />

                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Salawat",
                    ]}
                  />

                  <Bar
                    dataKey="total"
                    fill="#174c3c"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Loading activity...
              </div>

            )}

          </div>

        </div>

        {/* MILESTONE LADDER */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Project Milestone Ladder
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Every step brings the project closer to its goal.
          </p>

          <div className="mt-6">

            {milestones.map(
              (
                milestone,
                index
              ) => {

                const reached =
                  total >=
                  milestone.amount;

                const previousAmount =
                  index === 0
                    ? 0
                    : milestones[
                        index - 1
                      ].amount;

                const current =
                  !reached &&
                  total >=
                    previousAmount;

                return (
                  <div
                    key={
                      milestone.percent
                    }
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >

                    {index <
                      milestones.length -
                        1 && (

                      <div
                        className={`absolute left-[17px] top-9 h-full w-0.5 ${
                          reached
                            ? "bg-[#174c3c]"
                            : "bg-gray-200"
                        }`}
                      />

                    )}

                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        reached
                          ? "border-[#174c3c] bg-[#174c3c] text-white"
                          : current
                          ? "border-[#174c3c] bg-white text-[#174c3c]"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {reached
                        ? "✓"
                        : index + 1}
                    </div>

                    <div
                      className={`flex-1 rounded-2xl p-4 ${
                        current
                          ? "border border-[#174c3c] bg-[#f4f8f6]"
                          : "bg-[#f7f3e9]"
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p
                            className={`font-semibold ${
                              reached ||
                              current
                                ? "text-[#174c3c]"
                                : "text-gray-600"
                            }`}
                          >
                            {milestone.label}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {milestone.percent}% of project goal
                          </p>

                        </div>

                        <p className="font-bold text-gray-900">
                          {milestone.amount.toLocaleString()}
                        </p>

                      </div>

                      {current && (

                        <p className="mt-3 text-sm font-medium text-[#174c3c]">
                          {Math.max(
                            milestone.amount -
                              total,
                            0
                          ).toLocaleString()}{" "}
                          Salawat to reach this milestone
                        </p>

                      )}

                      {reached && (

                        <p className="mt-3 text-sm font-medium text-[#174c3c]">
                          ✓ Milestone reached
                        </p>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* PARTICIPANTS */}

        {project.show_participants && (

          <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              Participant Contributions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Total Salawat contributed by each participant.
            </p>

            {participantTotals.length === 0 ? (

              <div className="mt-5 rounded-2xl bg-[#f7f3e9] p-5 text-center">

                <p className="text-sm text-gray-500">
                  No contributions yet.
                </p>

              </div>

            ) : (

              <div className="mt-5 space-y-3">

                {participantTotals
                  .slice(
                    0,
                    10
                  )
                  .map(
                    (
                      participant,
                      index
                    ) => (

                      <div
                        key={`${participant.name}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-2xl bg-[#f7f3e9] px-4 py-3"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#174c3c] text-sm font-semibold text-white">
                            {index + 1}
                          </div>

                          <span className="truncate font-medium text-gray-900">
                            {participant.name}
                          </span>

                        </div>

                        <strong className="shrink-0 text-[#174c3c]">
                          {participant.total.toLocaleString()}
                        </strong>

                      </div>

                    )
                  )}

              </div>

            )}

          </div>

        )}

        {/* CONFIRM QUICK ADD */}

        {pendingAmount !== null && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">

            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Salawat
              </h2>

              <p className="mt-3 text-gray-600">
                Add{" "}
                <strong className="text-[#174c3c]">
                  {pendingAmount.toLocaleString()}
                </strong>{" "}
                Salawat to your contribution?
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    setPendingAmount(null)
                  }
                  className="rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    addSalawat(
                      pendingAmount
                    )
                  }
                  className="rounded-xl bg-[#174c3c] py-3 font-semibold text-white disabled:opacity-60"
                >
                  {adding
                    ? "Adding..."
                    : "Confirm"}
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </main>
  );
}

export default function ProjectPage() {
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
              Loading Salawat project...
            </p>

          </div>

        </main>
      }
    >
      <ProjectContent />
    </Suspense>
  );
}