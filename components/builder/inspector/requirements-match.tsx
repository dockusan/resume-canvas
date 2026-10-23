"use client";

import { Button } from "@/components/ui/button";
import { suggestMatches, useAiEnabled } from "@/lib/ai/client";
import { MatchSuggestion } from "@/lib/ai/types";
import {
  Evidence,
  Priority,
  RequirementMatch,
  extractRequirements,
  matchRequirements,
  resumeEvidence,
} from "@/lib/ats/requirements";
import { toPlainText } from "@/lib/richtext/runs";
import { SectionKey, useResumeStore } from "@/lib/store/useResumeStore";
import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  CircleHelp,
  CircleX,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

const GROUPS: { id: Priority; title: string }[] = [
  { id: "must", title: "Must-haves" },
  { id: "nice", title: "Nice to have" },
  { id: "duty", title: "What you'd do" },
];

const ICON = {
  shown: <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" />,
  partial: <CircleDashed className="h-4 w-4 shrink-0 text-amber-500" />,
  missing: <CircleX className="h-4 w-4 shrink-0 text-red-600" />,
} as const;

const LABEL = {
  shown: "Shown",
  partial: "Partly shown",
  missing: "Not shown",
} as const;

const clip = (text: string, max = 90) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * Replace the `index`th point of a description with `text`, leaving the other
 * lines (and any formatting in them) as they were.
 */
function replacePoint(description: string, index: number, text: string) {
  let seen = -1;
  return description
    .split("\n")
    .map((raw) => {
      const isPoint = toPlainText(raw)
        .replace(/^\s*[•\-*◦▪]\s*/, "")
        .trim();
      if (!isPoint) return raw;
      seen += 1;
      return seen === index ? text : raw;
    })
    .join("\n");
}

function Row({ match }: { match: RequirementMatch }) {
  const top = match.evidence[0];
  return (
    <li className="flex gap-2 py-1.5">
      <span title={LABEL[match.status]}>{ICON[match.status]}</span>
      <div className="min-w-0 text-[12px] leading-snug">
        <p className="text-[13px] text-foreground">
          {match.requirement.text}
          <span className="sr-only"> — {LABEL[match.status]}</span>
        </p>
        {match.years !== undefined && (
          <p className="mt-0.5 text-muted-foreground">
            Your roles span about {match.years} year
            {match.years === 1 ? "" : "s"}.
          </p>
        )}
        {top && (
          <p className="mt-0.5 text-muted-foreground break-words">
            {match.status === "partial" ? "Partly in " : "In "}
            <span className="text-foreground">{top.where}</span>
            {top.text !== top.where && <>: &ldquo;{clip(top.text)}&rdquo;</>}
          </p>
        )}
        {match.status === "partial" && match.missingTerms.length > 0 && (
          <p className="mt-0.5 text-muted-foreground">
            Not mentioned: {match.missingTerms.join(", ")}
          </p>
        )}
        {match.status === "missing" && (
          <p className="mt-0.5 text-muted-foreground">
            If it&rsquo;s true, say so in a point under the most relevant role.
          </p>
        )}
      </div>
    </li>
  );
}

function Suggestion({
  suggestion,
  requirement,
  evidence,
  onApply,
  applied,
}: {
  suggestion: MatchSuggestion;
  requirement: string;
  evidence?: Evidence;
  onApply: () => void;
  applied: boolean;
}) {
  return (
    <li className="space-y-1.5 rounded-md border p-2.5 text-[12px] leading-snug">
      <p className="font-medium">{requirement}</p>
      {suggestion.revised && evidence ? (
        <>
          <p className="text-muted-foreground">In {evidence.where}:</p>
          <p className="text-muted-foreground line-through decoration-muted-foreground/40">
            {evidence.text}
          </p>
          <p className="flex gap-1.5">
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{suggestion.revised}</span>
          </p>
          {suggestion.why && (
            <p className="text-[11px] text-muted-foreground">
              {suggestion.why}
            </p>
          )}
          <Button
            size="sm"
            variant={applied ? "outline" : "default"}
            disabled={applied}
            onClick={onApply}
            className="h-7"
          >
            {applied ? "Applied — undo to revert" : "Use this wording"}
          </Button>
        </>
      ) : (
        <p className="flex gap-1.5 text-muted-foreground">
          <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{suggestion.question}</span>
        </p>
      )}
    </li>
  );
}

/**
 * The posting's requirements, each marked shown, partly shown or not shown
 * with the line of the resume that shows it. Optionally, AI suggests edits
 * that bring out what the resume already supports — never new claims.
 */
export function RequirementsMatch({ jobText }: { jobText: string }) {
  const data = useResumeStore((s) => s.resumeData);
  const updateItem = useResumeStore((s) => s.updateItem);
  const aiEnabled = useAiEnabled();
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | {
        kind: "done";
        suggestions: MatchSuggestion[];
        evidence: Map<string, Evidence>;
        applied: Set<string>;
      }
  >({ kind: "idle" });

  const requirements = useMemo(() => extractRequirements(jobText), [jobText]);
  const matches = useMemo(
    () => matchRequirements(requirements, data),
    [requirements, data],
  );

  if (!requirements.length) {
    return (
      <p className="text-[12px] text-muted-foreground">
        No requirements found yet. Paste the whole posting, including its
        requirements list.
      </p>
    );
  }

  const gaps = matches.filter(
    (m) => m.status !== "shown" && m.requirement.priority !== "duty",
  );

  const suggest = async () => {
    setState({ kind: "loading" });
    const evidence = resumeEvidence(data);
    try {
      const suggestions = await suggestMatches({
        requirements: gaps
          .slice(0, 15)
          .map((m) => ({ id: m.requirement.id, text: m.requirement.text })),
        evidence: evidence.map((e) => ({
          id: e.id,
          where: e.where,
          text: e.text,
          editable: !!e.ref,
        })),
      });
      setState({
        kind: "done",
        suggestions,
        evidence: new Map(evidence.map((e) => [e.id, e])),
        applied: new Set(),
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  };

  const apply = (s: MatchSuggestion) => {
    if (state.kind !== "done") return;
    const ref = state.evidence.get(s.evidenceId)?.ref;
    if (!ref) return;
    const list = ref.section.startsWith("custom:")
      ? (data.customSections.find(
          (c) => c.id === ref.section.slice("custom:".length),
        )?.items ?? [])
      : ((
          data as unknown as Record<
            string,
            { id: string; description?: string }[]
          >
        )[ref.section] ?? []);
    const item = list.find((i) => i.id === ref.itemId);
    if (!item) return;
    updateItem(ref.section as SectionKey, ref.itemId, {
      description: replacePoint(item.description ?? "", ref.line, s.revised),
    });
    setState({
      ...state,
      applied: new Set(state.applied).add(s.requirementId),
    });
  };

  const counts = (p: Priority) => {
    const of = matches.filter((m) => m.requirement.priority === p);
    return {
      shown: of.filter((m) => m.status === "shown").length,
      total: of.length,
    };
  };
  const must = counts("must");
  const nice = counts("nice");

  return (
    <div className="space-y-3">
      <p className="text-[13px]">
        {must.total > 0 && (
          <>
            <span className="font-medium">
              {must.shown} of {must.total}
            </span>{" "}
            must-haves shown
          </>
        )}
        {must.total > 0 && nice.total > 0 && " · "}
        {nice.total > 0 && (
          <>
            {nice.shown} of {nice.total} nice-to-haves
          </>
        )}
      </p>

      {GROUPS.map((group) => {
        const rows = matches.filter((m) => m.requirement.priority === group.id);
        if (!rows.length) return null;
        return (
          <div key={group.id}>
            <div className="text-[12px] font-medium">{group.title}</div>
            <ul aria-label={group.title} className="-my-0.5">
              {rows.map((m) => (
                <Row key={m.requirement.id} match={m} />
              ))}
            </ul>
          </div>
        );
      })}

      {aiEnabled && gaps.length > 0 && (
        <div className="space-y-2 rounded-md bg-muted/40 p-2.5">
          <p className="text-[12px] text-muted-foreground">
            AI can reword points you already have so they show these
            requirements. It won&rsquo;t add anything your resume doesn&rsquo;t
            say; where nothing supports a requirement, it asks you instead.
            Sends the requirements and your resume&rsquo;s lines.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={state.kind === "loading"}
            onClick={suggest}
          >
            {state.kind === "loading" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            Suggest edits from my resume
          </Button>
          {state.kind === "error" && (
            <p role="alert" className="text-[12px] text-red-600">
              {state.message}
            </p>
          )}
          {state.kind === "done" &&
            (state.suggestions.length ? (
              <ul aria-label="Suggested edits" className="space-y-2">
                {state.suggestions.map((s) => (
                  <Suggestion
                    key={s.requirementId}
                    suggestion={s}
                    requirement={
                      requirements.find((r) => r.id === s.requirementId)
                        ?.text ?? ""
                    }
                    evidence={state.evidence.get(s.evidenceId)}
                    applied={state.applied.has(s.requirementId)}
                    onApply={() => apply(s)}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Nothing to suggest that your resume supports.
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
