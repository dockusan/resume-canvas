"use client";

import { AtsCheck, runAtsChecks } from "@/lib/ats/checks";
import { matchKeywords } from "@/lib/ats/keywords";
import { toAtsText } from "@/lib/export/ats";
import { useDocument } from "@/lib/schema/use-document";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { useMemo, useState } from "react";
import { Group } from "./controls";
import { RequirementsMatch } from "./requirements-match";

const JD_KEY = "rc-job-description";

const STATUS_ICON = {
  pass: <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />,
  warn: <CircleAlert className="w-4 h-4 text-amber-500 shrink-0" />,
  fail: <CircleX className="w-4 h-4 text-red-600 shrink-0" />,
} as const;

function scoreTone(score: number) {
  if (score >= 85) return { ring: "stroke-emerald-500", label: "Strong" };
  if (score >= 65) return { ring: "stroke-amber-500", label: "Needs polish" };
  return { ring: "stroke-red-500", label: "Needs work" };
}

function ScoreRing({ score, caption }: { score: number; caption: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={cn(tone.ring, "transition-all")}
          strokeDasharray={`${(score / 100) * c} ${c}`}
          transform="rotate(-90 32 32)"
        />
        <text
          x="32"
          y="37"
          textAnchor="middle"
          className="fill-foreground text-[15px] font-semibold"
        >
          {score}
        </text>
      </svg>
      <div>
        <div className="text-[15px] font-medium">{tone.label}</div>
        <div className="text-[11px] text-muted-foreground">{caption}</div>
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: AtsCheck }) {
  return (
    <li className="flex gap-2 py-1.5">
      {STATUS_ICON[check.status]}
      <div className="min-w-0">
        <div className="text-[13px] leading-tight">{check.label}</div>
        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5 break-words">
          {check.detail}
        </div>
      </div>
    </li>
  );
}

/**
 * ATS readiness: a scored checklist of what parsers and recruiters trip
 * over, plus keyword matching against a pasted job description. Everything
 * runs locally; the job text is kept in this browser only.
 */
export function AtsPanel({ pageCount }: { pageCount: number }) {
  const doc = useDocument();
  const data = useResumeStore((s) => s.resumeData);
  const settings = useResumeStore((s) => s.settings);
  // Only ever mounted after the user opens the ATS tab, so reading storage
  // in the initializer can't disagree with a server render.
  const [jobText, setJobText] = useState(() => {
    try {
      return localStorage.getItem(JD_KEY) ?? "";
    } catch {
      // Storage can be unavailable (private mode); the box just starts empty.
      return "";
    }
  });

  const saveJob = (value: string) => {
    setJobText(value);
    try {
      localStorage.setItem(JD_KEY, value);
    } catch {
      // Not persisted; still usable for this session.
    }
  };

  const report = useMemo(
    () =>
      runAtsChecks(data, doc, {
        pageCount,
        showPhoto: settings.showPhoto !== false,
      }),
    [data, doc, pageCount, settings.showPhoto],
  );

  const resumeText = useMemo(
    () => toAtsText(doc, data, settings),
    [doc, data, settings],
  );
  const match = useMemo(
    () => (jobText.trim() ? matchKeywords(jobText, resumeText) : null),
    [jobText, resumeText],
  );

  const failing = report.checks.filter((c) => c.status !== "pass");
  const groups = ["Contact", "Content", "Impact", "Format"] as const;

  return (
    <div className="px-3">
      <Group title="ATS score">
        <ScoreRing
          score={report.score}
          caption={
            failing.length
              ? `${failing.length} thing${failing.length > 1 ? "s" : ""} to improve`
              : "Every check passes"
          }
        />
      </Group>

      {groups.map((group) => {
        const checks = report.checks.filter((c) => c.group === group);
        if (!checks.length) return null;
        // Problems first, so the list reads as a to-do.
        const order = { fail: 0, warn: 1, pass: 2 };
        checks.sort((a, b) => order[a.status] - order[b.status]);
        return (
          <Group key={group} title={group}>
            <ul className="-my-1.5">
              {checks.map((c) => (
                <CheckRow key={c.id} check={c} />
              ))}
            </ul>
          </Group>
        );
      })}

      <Group title="Match a job description">
        <textarea
          value={jobText}
          onChange={(e) => saveJob(e.target.value)}
          placeholder="Paste the job posting here to see which of its keywords your resume already covers."
          rows={6}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-[13px] leading-snug resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          Stays in this browser. Nothing is uploaded.
        </p>
        {jobText.trim() && <RequirementsMatch jobText={jobText} />}
        {match && (
          <div className="space-y-3 border-t pt-3">
            <div className="text-[12px] font-medium">Keywords</div>
            <ScoreRing
              score={match.score}
              caption={`${match.matched.length} of ${
                match.matched.length + match.missing.length
              } keywords found`}
            />
            {match.missing.length > 0 && (
              <div>
                <div className="text-[12px] font-medium mb-1">
                  Missing — add where they truly apply
                </div>
                <div className="flex flex-wrap gap-1">
                  {match.missing.map((k) => (
                    <span
                      key={k.term}
                      className="rounded border border-red-500/30 bg-red-500/5 px-1.5 py-0.5 text-[11px]"
                      title={`Mentioned ${k.count}× in the posting`}
                    >
                      {k.term}
                      {k.count > 1 && (
                        <span className="opacity-60"> ×{k.count}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {match.matched.length > 0 && (
              <div>
                <div className="text-[12px] font-medium mb-1">
                  Already covered
                </div>
                <div className="flex flex-wrap gap-1">
                  {match.matched.map((k) => (
                    <span
                      key={k.term}
                      className="rounded border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 text-[11px]"
                    >
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Group>
    </div>
  );
}
