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
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

type OverallProgressPoint = {
  date: string;
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

  const [showScorecard, setShowScorecard] =
    useState(false);

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
      .eq("project_code", projectCode)
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
      daily_goal:
        Number(projectData.daily_goal) || 100,
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
      .eq("project_id", cleanProject.id)
      .order("created_at", {
        ascending: false,
      });

    if (entryError) {
      console.error(entryError);
      setError(
        "Unable to load Salawat entries."
      );
      setLoading(false);
      return;
    }

    const cleanEntries: SalawatEntry[] =
      (entryData || []).map((entry) => ({
        id: Number(entry.id),
        project_id: entry.project_id,
        participant_name:
          entry.participant_name,
        amount: Number(entry.amount),
        created_at: entry.created_at,
      }));

    setEntries(cleanEntries);
    setLoading(false);
  }, [projectCode, router]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const total =
    useMemo(() => {
      return entries.reduce(
        (sum, entry) =>
          sum + Number(entry.amount),
        0
      );
    }, [entries]);

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
    }, [entries, userName]);

  const myTotal =
    useMemo(() => {
      return myEntries.reduce(
        (sum, entry) =>
          sum + Number(entry.amount),
        0
      );
    }, [myEntries]);

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
    }, [myEntries, currentTime]);

  const communityTodayTotal =
    useMemo(() => {
      if (!currentTime) {
        return 0;
      }

      return entries
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
    }, [entries, currentTime]);

  const myLast7DaysTotal =
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

      return myEntries
        .filter((entry) => {
          const entryDate =
            new Date(entry.created_at);

          return entryDate >= sevenDaysAgo;
        })
        .reduce(
          (sum, entry) =>
            sum + Number(entry.amount),
          0
        );
    }, [myEntries, currentTime]);

  const dailyGoal =
    Number(project?.daily_goal) || 100;

  const dailyPercentage =
    Math.min(
      (communityTodayTotal / dailyGoal) * 100,
      100
    );

  const dailyRemaining =
    Math.max(
      dailyGoal - communityTodayTotal,
      0
    );

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
    }, [total, project]);

  const remaining =
    project
      ? Math.max(
          Number(project.goal) - total,
          0
        )
      : 0;

  const progressStatus =
    useMemo(() => {
      if (percentage >= 100) {
        return {
          icon: "🎉",
          title: "Alhamdulillah!",
          text: "Project Goal Reached",
        };
      }

      if (percentage >= 75) {
        return {
          icon: "🚀",
          title: "Almost There",
          text: "The finish line is close!",
        };
      }

      if (percentage >= 50) {
        return {
          icon: "⭐",
          title: "Halfway & Growing",
          text: "Keep the momentum going!",
        };
      }

      if (percentage >= 25) {
        return {
          icon: "🔥",
          title: "Building Momentum",
          text: "The community is growing strong.",
        };
      }

      if (percentage >= 10) {
        return {
          icon: "🌿",
          title: "Great Start",
          text: "Every Salawat is moving us forward.",
        };
      }

      return {
        icon: "🌱",
        title: "Journey Begins",
        text: "Every Salawat counts.",
      };
    }, [percentage]);

  const nextProjectMilestone =
    useMemo(() => {
      if (!project) {
        return null;
      }

      const goal =
        Number(project.goal);

      const milestonePercents = [
        25,
        50,
        75,
        100,
      ];

      const nextPercent =
        milestonePercents.find(
          (milestone) =>
            percentage < milestone
        );

      if (!nextPercent) {
        return null;
      }

      const milestoneAmount =
        Math.round(
          goal *
            (nextPercent / 100)
        );

      return {
        percent: nextPercent,
        amount: milestoneAmount,
        remaining: Math.max(
          milestoneAmount - total,
          0
        ),
      };
    }, [
      project,
      percentage,
      total,
    ]);

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

        if (
          cleanName.toLowerCase() ===
          "2024 historical total"
        ) {
          return;
        }

        const key =
          cleanName.toLowerCase();

        const existing =
          totals.get(key);

        if (existing) {
          existing.total +=
            Number(entry.amount);
        } else {
          totals.set(key, {
            name: cleanName,
            total: Number(entry.amount),
          });
        }
      });

      return Array.from(
        totals.values()
      ).sort(
        (a, b) =>
          b.total - a.total
      );
    }, [entries]);

  const myRank =
    useMemo(() => {
      const rank =
        participantTotals.findIndex(
          (participant) =>
            participant.name
              .trim()
              .toLowerCase() ===
            userName
              .trim()
              .toLowerCase()
        );

      return rank >= 0
        ? rank + 1
        : null;
    }, [
      participantTotals,
      userName,
    ]);

  const scorecardChartData =
    useMemo(() => {
      return participantTotals
        .slice(0, 8)
        .map((participant) => ({
          name: participant.name,
          total: participant.total,
        }));
    }, [participantTotals]);

  const chartData =
    useMemo<ChartDay[]>(() => {
      if (!currentTime) {
        return [];
      }

      const days: ChartDay[] = [];

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

  const myOverallProgressData =
    useMemo<OverallProgressPoint[]>(() => {
      if (
        !currentTime ||
        myEntries.length === 0
      ) {
        return [];
      }

      const sortedEntries = [
        ...myEntries,
      ].sort(
        (a, b) =>
          new Date(
            a.created_at
          ).getTime() -
          new Date(
            b.created_at
          ).getTime()
      );

      const firstDate =
        new Date(
          sortedEntries[0].created_at
        );

      firstDate.setHours(
        0,
        0,
        0,
        0
      );

      const today =
        new Date(currentTime);

      today.setHours(
        0,
        0,
        0,
        0
      );

      const dailyTotals =
        new Map<string, number>();

      sortedEntries.forEach(
        (entry) => {
          const entryDate =
            new Date(
              entry.created_at
            );

          const key = [
            entryDate.getFullYear(),
            String(
              entryDate.getMonth() + 1
            ).padStart(2, "0"),
            String(
              entryDate.getDate()
            ).padStart(2, "0"),
          ].join("-");

          dailyTotals.set(
            key,
            (dailyTotals.get(key) || 0) +
              Number(entry.amount)
          );
        }
      );

      const data: OverallProgressPoint[] =
        [];

      let runningTotal = 0;

      const cursor =
        new Date(firstDate);

      while (
        cursor <= today
      ) {
        const key = [
          cursor.getFullYear(),
          String(
            cursor.getMonth() + 1
          ).padStart(2, "0"),
          String(
            cursor.getDate()
          ).padStart(2, "0"),
        ].join("-");

        runningTotal +=
          dailyTotals.get(key) || 0;

        data.push({
          date:
            cursor.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
              }
            ),
          total: runningTotal,
        });

        cursor.setDate(
          cursor.getDate() + 1
        );
      }

      return data;
    }, [
      myEntries,
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

      const goal =
        Number(project.goal);

      const chartCompleted =
        Math.min(
          total,
          goal
        );

      const chartRemaining =
        Math.max(
          goal - total,
          0
        );

      return [
        {
          name: "Completed",
          value: chartCompleted,
        },
        {
          name: "Remaining",
          value: chartRemaining,
        },
      ];
    }, [
      project,
      total,
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
      !Number.isFinite(
        salawatAmount
      ) ||
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
        project_id:
          project.id,
        participant_name:
          userName,
        amount:
          salawatAmount,
      })
      .select(
        "id, project_id, participant_name, amount, created_at"
      )
      .single();

    setAdding(false);

    if (insertError) {
      console.error(
        insertError
      );

      setError(
        "Unable to save your Salawat. Please try again."
      );

      return;
    }

    const cleanEntry: SalawatEntry = {
      id: Number(data.id),
      project_id:
        data.project_id,
      participant_name:
        data.participant_name,
      amount:
        Number(data.amount),
      created_at:
        data.created_at,
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
        <p className="font-medium text-[#174c3c]">
          Loading Salawat project...
        </p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center px-5">

        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-sm">

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
    <main className="min-h-screen bg-[#f7f3e9] px-4 py-4 sm:px-5">

      <div className="mx-auto w-full max-w-3xl">

        {/* COMPACT PROJECT HEADER */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white/60 px-4 py-3 shadow-sm sm:px-5">

          {/* TOP ROW */}

          <div className="flex items-start justify-between gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="mt-1 whitespace-nowrap text-sm font-medium text-[#174c3c]"
            >
              ← Leave Project
            </button>

            <div className="flex flex-col items-end">

              <div className="flex items-center gap-2">

                {project.show_participants && (

                  <button
                    type="button"
                    onClick={() =>
                      setShowScorecard(true)
                    }
                    className="rounded-full bg-[#174c3c] px-3 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#103d30] sm:px-4 sm:text-sm"
                  >
                    🏆 Scorecard
                  </button>

                )}

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
                  className="rounded-full border border-[#174c3c] px-3 py-2 text-xs font-semibold text-[#174c3c]"
                >
                  Admin
                </button>

              </div>

              <p className="mt-1 pr-1 text-[11px] text-gray-500 sm:text-xs">

                Project ID:{" "}

                <span className="font-semibold text-[#174c3c]">
                  {project.project_code}
                </span>

              </p>

            </div>

          </div>

          {/* CENTER CONTENT */}

          <div className="-mt-6 flex flex-col items-center text-center sm:-mt-7">

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

            <h1 className="mt-2 text-xl font-bold leading-tight text-[#174c3c] sm:text-2xl">
              {project.project_name}
            </h1>

            <p className="mt-1 text-sm text-gray-600">

              Assalamu Alaikum,{" "}

              <span className="font-medium text-gray-800">
                {userName}
              </span>

            </p>

          </div>

        </div>

        {/* ENHANCED PROJECT GOAL */}

        <div
          className={`mb-5 overflow-hidden rounded-3xl border bg-white p-6 shadow-sm ${
            percentage >= 100
              ? "border-[#d8bf68]"
              : "border-[#e5ded0]"
          }`}
        >

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Community Goal
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#174c3c]">
              Project Goal
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Together toward{" "}
              <span className="font-semibold text-gray-800">
                {Number(
                  project.goal
                ).toLocaleString()}
              </span>{" "}
              Salawat
            </p>

          </div>

          <div className="relative mx-auto mt-4 h-72 w-72 max-w-full">

            <div
              className={`absolute inset-[30px] rounded-full blur-2xl ${
                percentage >= 100
                  ? "bg-[#e9d78a]/25"
                  : "bg-[#174c3c]/10"
              }`}
            />

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
                  innerRadius={88}
                  outerRadius={116}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  cornerRadius={10}
                  paddingAngle={1}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationBegin={100}
                >

                  <Cell
                    fill={
                      percentage >= 100
                        ? "#b58a2a"
                        : "#174c3c"
                    }
                  />

                  <Cell
                    fill="#edf0ec"
                  />

                </Pie>

              </PieChart>

            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">

              <span className="absolute text-8xl text-[#174c3c]/[0.035]">
                ﷺ
              </span>

              {percentage >= 100 && (
                <div className="mb-1 text-2xl">
                  🎉
                </div>
              )}

              <p
                className={`relative text-5xl font-black ${
                  percentage >= 100
                    ? "text-[#9a741e]"
                    : "text-[#174c3c]"
                }`}
              >
                {percentage.toFixed(0)}%
              </p>

              <p className="relative mt-1 text-sm font-medium text-gray-500">
                Complete
              </p>

              <div className="relative mt-3 rounded-full bg-[#f7f3e9] px-4 py-1.5">

                <span className="text-sm font-bold text-gray-800">
                  {total.toLocaleString()}
                </span>

                <span className="ml-1 text-xs text-gray-500">
                  Salawat
                </span>

              </div>

            </div>

          </div>

          <div
            className={`mx-auto -mt-1 max-w-sm rounded-2xl px-5 py-4 text-center ${
              percentage >= 100
                ? "bg-[#fff7dc]"
                : "bg-[#f4f8f6]"
            }`}
          >

            <p className="text-2xl">
              {progressStatus.icon}
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                percentage >= 100
                  ? "text-[#8b691d]"
                  : "text-[#174c3c]"
              }`}
            >
              {progressStatus.title}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {progressStatus.text}
            </p>

          </div>

          {nextProjectMilestone ? (

            <div className="mt-5 text-center">

              <p className="text-sm text-gray-500">
                Next milestone
              </p>

              <p className="mt-1 font-semibold text-[#174c3c]">

                {nextProjectMilestone.remaining.toLocaleString()}{" "}
                more Salawat to reach{" "}

                <span className="font-bold">
                  {nextProjectMilestone.percent}%
                </span>

              </p>

            </div>

          ) : (

            <div className="mt-5 rounded-2xl bg-[#fff7dc] px-4 py-3 text-center">

              <p className="font-bold text-[#8b691d]">
                🎉 Alhamdulillah! The project goal has been reached.
              </p>

              {total >
                Number(project.goal) && (

                <p className="mt-1 text-sm text-[#8b7b46]">

                  {(
                    total -
                    Number(
                      project.goal
                    )
                  ).toLocaleString()}{" "}
                  Salawat beyond the original goal.

                </p>

              )}

            </div>

          )}

          <div className="mt-7">

            <div className="relative">

              <div className="absolute left-5 right-5 top-4 h-1 rounded-full bg-gray-200" />

              <div
                className="absolute left-5 top-4 h-1 rounded-full bg-[#174c3c] transition-all duration-1000"
                style={{
                  width: `calc(${Math.min(
                    percentage,
                    100
                  )}% - ${Math.min(
                    percentage,
                    100
                  ) * 0.4}px)`,
                  maxWidth:
                    "calc(100% - 40px)",
                }}
              />

              <div className="relative grid grid-cols-4">

                {[25, 50, 75, 100].map(
                  (milestone) => {

                    const reached =
                      percentage >= milestone;

                    const next =
                      nextProjectMilestone?.percent ===
                      milestone;

                    return (
                      <div
                        key={milestone}
                        className="flex flex-col items-center"
                      >

                        <div
                          className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                            reached
                              ? "border-[#174c3c] bg-[#174c3c] text-white shadow-sm"
                              : next
                              ? "border-[#174c3c] bg-white text-[#174c3c] shadow-sm"
                              : "border-gray-300 bg-white text-gray-400"
                          }`}
                        >
                          {reached
                            ? "✓"
                            : milestone}
                        </div>

                        <p
                          className={`mt-2 text-xs font-semibold ${
                            reached ||
                            next
                              ? "text-[#174c3c]"
                              : "text-gray-400"
                          }`}
                        >
                          {milestone}%
                        </p>

                        {next && (

                          <span className="mt-1 rounded-full bg-[#eaf7f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#174c3c]">
                            Next
                          </span>

                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

          <div className="mt-7 grid grid-cols-3 gap-2">

            <div className="rounded-2xl bg-[#eaf7f0] p-3 text-center sm:p-4">

              <p className="text-[11px] font-medium text-[#56806b] sm:text-xs">
                Completed
              </p>

              <p className="mt-1 text-base font-bold text-[#174c3c] sm:text-xl">
                {total.toLocaleString()}
              </p>

            </div>

            <div className="rounded-2xl bg-[#fff7dc] p-3 text-center sm:p-4">

              <p className="text-[11px] font-medium text-[#8b7b46] sm:text-xs">
                Remaining
              </p>

              <p className="mt-1 text-base font-bold text-[#7a6115] sm:text-xl">
                {remaining.toLocaleString()}
              </p>

            </div>

            <div className="rounded-2xl bg-[#edf5fb] p-3 text-center sm:p-4">

              <p className="text-[11px] font-medium text-[#628197] sm:text-xs">
                Next Milestone
              </p>

              <p className="mt-1 text-base font-bold text-[#265575] sm:text-xl">

                {nextProjectMilestone
                  ? `${nextProjectMilestone.percent}%`
                  : "Done ✓"}

              </p>

            </div>

          </div>

        </div>

        {/* COMMUNITY DAILY GOAL */}

        <div className="mb-5 rounded-3xl bg-[#174c3c] p-6 text-white shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-sm text-white/70">
                Community&apos;s Daily Goal
              </p>

              <p className="mt-1 text-3xl font-bold">
                {communityTodayTotal.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-white/70">
                of{" "}
                {dailyGoal.toLocaleString()}{" "}
                Salawat today
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
              ? "✓ Community daily goal completed!"
              : `${dailyRemaining.toLocaleString()} Salawat remaining today`}

          </p>

        </div>

        {/* PERSONAL SUMMARY */}

        <div className="mb-5 grid gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-[#cfe9db] bg-[#eaf7f0] p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-[#326b50]">
                Today
              </p>

              <span className="text-xl">
                🌿
              </span>

            </div>

            <p className="mt-2 text-3xl font-bold text-[#174c3c]">
              {todayTotal.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-[#56806b]">
              Salawat today
            </p>

          </div>

          <div className="rounded-2xl border border-[#eadba6] bg-[#fff7dc] p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-[#806b24]">
                Last 7 Days
              </p>

              <span className="text-xl">
                ✨
              </span>

            </div>

            <p className="mt-2 text-3xl font-bold text-[#7a6115]">
              {myLast7DaysTotal.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-[#8b7b46]">
              Your weekly progress
            </p>

          </div>

          <div className="rounded-2xl border border-[#cfddea] bg-[#edf5fb] p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-[#3c6685]">
                Your Total
              </p>

              <span className="text-xl">
                ⭐
              </span>

            </div>

            <p className="mt-2 text-3xl font-bold text-[#265575]">
              {myTotal.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-[#628197]">
              All-time contribution
            </p>

          </div>

        </div>

        {/* SCORECARD CTA */}

        {project.show_participants && (

          <button
            type="button"
            onClick={() =>
              setShowScorecard(true)
            }
            className="mb-5 w-full rounded-3xl bg-[#174c3c] p-5 text-left text-white shadow-md transition hover:bg-[#103d30] hover:shadow-lg"
          >

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl">
                  🏆
                </div>

                <div>

                  <p className="text-lg font-bold">
                    Community Scorecard
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    See everyone&apos;s progress and contribution
                  </p>

                </div>

              </div>

              <span className="text-2xl">
                →
              </span>

            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">

              <div className="rounded-xl bg-white/10 p-3">

                <p className="text-xs text-white/60">
                  Participants
                </p>

                <p className="mt-1 font-bold">
                  {participantTotals.length}
                </p>

              </div>

              <div className="rounded-xl bg-white/10 p-3">

                <p className="text-xs text-white/60">
                  Project Total
                </p>

                <p className="mt-1 font-bold">
                  {total.toLocaleString()}
                </p>

              </div>

              <div className="rounded-xl bg-white/10 p-3">

                <p className="text-xs text-white/60">
                  Your Rank
                </p>

                <p className="mt-1 font-bold">
                  {myRank
                    ? `#${myRank}`
                    : "—"}
                </p>

              </div>

            </div>

          </button>

        )}

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

          <input
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
            placeholder="Custom amount"
            className="mt-5 w-full rounded-xl border border-gray-300 px-4 py-3"
          />

          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-3 text-sm font-medium text-green-700">
              ✓ {success}
            </p>
          )}

          <button
            type="button"
            disabled={adding}
            onClick={() =>
              addSalawat()
            }
            className="mt-4 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white disabled:opacity-60"
          >
            {adding
              ? "Saving..."
              : "Add Salawat"}
          </button>

        </div>

        {/* PROJECT ACTIVITY */}

        <div className="mb-5 rounded-3xl border border-[#e5ded0] bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-900">
            Project Activity
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Total project Salawat during the last 7 days.
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
                      Number(
                        value
                      ).toLocaleString(),
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

        {/* PERSONAL OVERALL JOURNEY */}

        <div className="mb-5 rounded-3xl border border-[#cfddea] bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-[#3c6685]">
                Your Journey
              </p>

              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                Overall Salawat Progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your cumulative Salawat progress from your first contribution until today.
              </p>

            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5fb] text-xl">
              📈
            </div>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">

            <div className="rounded-2xl bg-[#eaf7f0] p-3 text-center">

              <p className="text-xs text-[#56806b]">
                Today
              </p>

              <p className="mt-1 font-bold text-[#174c3c]">
                {todayTotal.toLocaleString()}
              </p>

            </div>

            <div className="rounded-2xl bg-[#fff7dc] p-3 text-center">

              <p className="text-xs text-[#8b7b46]">
                7 Days
              </p>

              <p className="mt-1 font-bold text-[#7a6115]">
                {myLast7DaysTotal.toLocaleString()}
              </p>

            </div>

            <div className="rounded-2xl bg-[#edf5fb] p-3 text-center">

              <p className="text-xs text-[#628197]">
                Overall
              </p>

              <p className="mt-1 font-bold text-[#265575]">
                {myTotal.toLocaleString()}
              </p>

            </div>

          </div>

          {myOverallProgressData.length >
          0 ? (

            <div className="mt-7 h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    myOverallProgressData
                  }
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                    tick={{
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={55}
                    tickFormatter={(
                      value
                    ) =>
                      Number(
                        value
                      ).toLocaleString()
                    }
                  />

                  <Tooltip
                    formatter={(
                      value
                    ) => [
                      Number(
                        value
                      ).toLocaleString(),
                      "Total Salawat",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#265575"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{
                      r: 6,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="mt-6 rounded-2xl bg-[#f7f3e9] p-8 text-center">

              <div className="text-3xl">
                🌱
              </div>

              <p className="mt-3 font-semibold text-gray-800">
                Your journey starts here
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add your first Salawat to begin your progress graph.
              </p>

            </div>

          )}

          {myOverallProgressData.length >
            0 && (

            <div className="mt-4 rounded-2xl bg-[#f7f3e9] px-4 py-3 text-center">

              <p className="text-sm text-gray-500">
                Your Salawat journey
              </p>

              <p className="mt-1 font-semibold text-[#174c3c]">
                {myTotal.toLocaleString()} Salawat and counting ✨
              </p>

            </div>

          )}

        </div>

        {/* SCORECARD MODAL */}

        {showScorecard && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-5">

            <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-sm font-semibold text-[#174c3c]">
                    🏆 Community Progress
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-gray-900">
                    Scorecard
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {project.project_name}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowScorecard(
                      false
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f3e9] text-2xl text-gray-600"
                >
                  ×
                </button>

              </div>

              {/* SUMMARY */}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <div className="rounded-2xl bg-[#174c3c] p-4 text-white">

                  <p className="text-xs text-white/70">
                    Total Salawat
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {total.toLocaleString()}
                  </p>

                </div>

                <div className="rounded-2xl bg-[#f7f3e9] p-4">

                  <p className="text-xs text-gray-500">
                    Participants
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#174c3c]">
                    {participantTotals.length}
                  </p>

                </div>

                <div className="rounded-2xl bg-[#edf5fb] p-4">

                  <p className="text-xs text-[#628197]">
                    Your Total
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#265575]">
                    {myTotal.toLocaleString()}
                  </p>

                </div>

                <div className="rounded-2xl bg-[#fff7dc] p-4">

                  <p className="text-xs text-[#8b7b46]">
                    Your Rank
                  </p>

                  <p className="mt-1 text-xl font-bold text-[#7a6115]">
                    {myRank
                      ? `#${myRank}`
                      : "—"}
                  </p>

                </div>

              </div>

              {/* TOP CONTRIBUTORS */}

              {participantTotals.length >
                0 && (

                <div className="mt-7">

                  <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-400">
                    Top Contributors
                  </p>

                  <div className="grid grid-cols-3 items-end gap-2">

                    <div className="text-center">

                      <div className="mb-2 text-3xl">
                        🥈
                      </div>

                      <div className="rounded-2xl bg-[#f7f3e9] p-3 sm:p-4">

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {participantTotals[1]?.name ||
                            "—"}
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#174c3c]">
                          {participantTotals[1]
                            ? participantTotals[1].total.toLocaleString()
                            : "—"}
                        </p>

                      </div>

                    </div>

                    <div className="text-center">

                      <div className="mb-2 text-4xl">
                        🥇
                      </div>

                      <div className="rounded-2xl bg-[#174c3c] p-4 text-white shadow-md sm:p-5">

                        <p className="truncate text-sm font-bold">
                          {participantTotals[0]?.name ||
                            "—"}
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {participantTotals[0]
                            ? participantTotals[0].total.toLocaleString()
                            : "—"}
                        </p>

                      </div>

                    </div>

                    <div className="text-center">

                      <div className="mb-2 text-3xl">
                        🥉
                      </div>

                      <div className="rounded-2xl bg-[#f7f3e9] p-3 sm:p-4">

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {participantTotals[2]?.name ||
                            "—"}
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#174c3c]">
                          {participantTotals[2]
                            ? participantTotals[2].total.toLocaleString()
                            : "—"}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

              {/* CONTRIBUTION CHART */}

              {scorecardChartData.length >
                0 && (

                <div className="mt-7 rounded-3xl border border-[#e5ded0] p-5">

                  <h3 className="font-semibold text-gray-900">
                    Contribution Chart
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Top contributors by total Salawat
                  </p>

                  <div className="mt-5 h-80">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={
                          scorecardChartData
                        }
                        barCategoryGap="32%"
                        margin={{
                          top: 20,
                          right: 15,
                          left: 10,
                          bottom: 45,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />

                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-22}
                          textAnchor="end"
                          height={80}
                          tick={{
                            fontSize: 11,
                            fill: "#5f6368",
                          }}
                        />

                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={65}
                          tick={{
                            fontSize: 11,
                            fill: "#6b7280",
                          }}
                          tickFormatter={(
                            value
                          ) => {
                            const number =
                              Number(value);

                            if (
                              number >=
                              1000000
                            ) {
                              return `${(
                                number /
                                1000000
                              ).toFixed(
                                1
                              )}M`;
                            }

                            if (
                              number >=
                              1000
                            ) {
                              return `${Math.round(
                                number /
                                  1000
                              )}K`;
                            }

                            return number.toLocaleString();
                          }}
                        />

                        <Tooltip
                          formatter={(
                            value
                          ) => [
                            Number(
                              value
                            ).toLocaleString(),
                            "Salawat",
                          ]}
                        />

                        <Bar
                          dataKey="total"
                          fill="#174c3c"
                          radius={[
                            7,
                            7,
                            0,
                            0,
                          ]}
                          maxBarSize={34}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                </div>

              )}

              {/* EVERYONE */}

              <div className="mt-7">

                <div className="flex items-center justify-between">

                  <h3 className="text-lg font-semibold text-gray-900">
                    Everyone&apos;s Progress
                  </h3>

                  <span className="text-xs text-gray-400">
                    {participantTotals.length}{" "}
                    participant
                    {participantTotals.length ===
                    1
                      ? ""
                      : "s"}
                  </span>

                </div>

                <div className="mt-4 space-y-3">

                  {participantTotals.map(
                    (
                      participant,
                      index
                    ) => {

                      const participantPercentage =
                        total > 0
                          ? (participant.total /
                              total) *
                            100
                          : 0;

                      const isMe =
                        participant.name
                          .trim()
                          .toLowerCase() ===
                        userName
                          .trim()
                          .toLowerCase();

                      const medal =
                        index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${index + 1}`;

                      return (
                        <div
                          key={`${participant.name}-${index}`}
                          className={`rounded-2xl border p-4 ${
                            isMe
                              ? "border-[#174c3c] bg-[#f4f8f6]"
                              : "border-[#ece7dc] bg-[#f7f3e9]"
                          }`}
                        >

                          <div className="flex items-center justify-between gap-3">

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm">
                                {medal}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-gray-900">
                                  {participant.name}
                                  {isMe
                                    ? " (You)"
                                    : ""}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {participantPercentage.toFixed(
                                    1
                                  )}
                                  % of project total
                                </p>

                              </div>

                            </div>

                            <p className="shrink-0 font-bold text-[#174c3c]">
                              {participant.total.toLocaleString()}
                            </p>

                          </div>

                          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">

                            <div
                              className="h-full rounded-full bg-[#174c3c]"
                              style={{
                                width: `${Math.min(
                                  participantPercentage,
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowScorecard(false)
                }
                className="mt-7 w-full rounded-xl bg-[#174c3c] py-3.5 font-semibold text-white"
              >
                Close Scorecard
              </button>

            </div>

          </div>

        )}

        {/* CONFIRM QUICK ADD */}

        {pendingAmount !== null && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">

            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="text-xl font-semibold">
                Confirm Salawat
              </h2>

              <p className="mt-3 text-gray-600">

                Add{" "}

                <strong className="text-[#174c3c]">
                  {pendingAmount.toLocaleString()}
                </strong>{" "}

                Salawat?

              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  type="button"
                  disabled={adding}
                  onClick={() =>
                    setPendingAmount(
                      null
                    )
                  }
                  className="rounded-xl border border-gray-300 py-3 font-semibold text-gray-700"
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
        <main className="min-h-screen bg-[#f7f3e9] flex items-center justify-center">

          <p className="font-medium text-[#174c3c]">
            Loading Salawat project...
          </p>

        </main>
      }
    >
      <ProjectContent />
    </Suspense>
  );
}