"use client";

import { Fragment } from "react";
import { Run, parseRuns } from "@/lib/richtext/runs";

/**
 * Renders stored inline markup as real React elements.
 *
 * Deliberately not `dangerouslySetInnerHTML`: everything goes through the run
 * parser, so only bold, italic, underline and safe-scheme links can ever
 * reach the page, whatever ends up in storage.
 */
export function RichText({ value }: { value: string }) {
  if (!value) return null;
  if (!value.includes("<")) return <>{value}</>;
  return (
    <>
      {parseRuns(value).map((run, i) => (
        <Fragment key={i}>{renderRun(run)}</Fragment>
      ))}
    </>
  );
}

function renderRun(run: Run): React.ReactNode {
  let node: React.ReactNode = run.text;
  if (run.bold) node = <b>{node}</b>;
  if (run.italic) node = <i>{node}</i>;
  if (run.underline) node = <u>{node}</u>;
  if (run.link) {
    node = (
      <a
        href={run.link}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {node}
      </a>
    );
  }
  return node;
}
