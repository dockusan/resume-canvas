"use client";

import { TemplateThumbnail } from "@/components/home/sample-resume";
import { Button } from "@/components/shared/button";
import {
  TemplateInfo,
  USE_CASES,
  UseCase,
} from "@/lib/schema/template-catalog";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

type Layout = "any" | "one" | "two";
type Photo = "any" | "with" | "without";

interface Filters {
  use: UseCase | "all";
  layout: Layout;
  photo: Photo;
}

const NONE: Filters = { use: "all", layout: "any", photo: "any" };

const LAYOUTS: { id: Layout; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "one", label: "One column" },
  { id: "two", label: "Two columns" },
];

const PHOTOS: { id: Photo; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "with", label: "Room for a photo" },
  { id: "without", label: "No photo" },
];

/** Where a template is opened from: the builder, restyled, content kept. */
export const builderHref = (id: string) =>
  `/builder?template=${encodeURIComponent(id)}`;

function matches(t: TemplateInfo, f: Filters) {
  return (
    (f.use === "all" || t.uses.includes(f.use)) &&
    (f.layout === "any" || t.columns === (f.layout === "one" ? 1 : 2)) &&
    (f.photo === "any" || t.photo === (f.photo === "with"))
  );
}

/**
 * Filters live in the URL, so a filtered view can be linked to. The query
 * string is the store: the server renders it empty — every template, which
 * is also what anyone without JavaScript sees — and hydration picks up the
 * real one.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getSearch = () => window.location.search;
const getServerSearch = () => "";

function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const use = params.get("use");
  const layout = params.get("layout");
  const photo = params.get("photo");
  return {
    use: USE_CASES.some((u) => u.id === use) ? (use as UseCase) : "all",
    layout: LAYOUTS.some((l) => l.id === layout) ? (layout as Layout) : "any",
    photo: PHOTOS.some((p) => p.id === photo) ? (photo as Photo) : "any",
  };
}

function writeFilters(f: Filters) {
  const params = new URLSearchParams();
  if (f.use !== "all") params.set("use", f.use);
  if (f.layout !== "any") params.set("layout", f.layout);
  if (f.photo !== "any") params.set("photo", f.photo);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
  listeners.forEach((listener) => listener());
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-full border bg-background p-0.5"
      >
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              value === o.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TemplateGallery({ templates }: { templates: TemplateInfo[] }) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const filters = useMemo(() => parseFilters(search), [search]);
  const update = (patch: Partial<Filters>) =>
    writeFilters({ ...filters, ...patch });

  const shown = templates.filter((t) => matches(t, filters));
  const filtered =
    filters.use !== "all" ||
    filters.layout !== "any" ||
    filters.photo !== "any";

  return (
    <div className="mx-auto mt-14 max-w-6xl">
      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <div
          role="group"
          aria-label="What it's for"
          className="flex flex-wrap gap-2"
        >
          {[{ id: "all" as const, label: "All templates" }, ...USE_CASES].map(
            (u) => (
              <button
                key={u.id}
                type="button"
                aria-pressed={filters.use === u.id}
                onClick={() => update({ use: u.id })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  filters.use === u.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-foreground/30",
                )}
              >
                {u.label}
              </button>
            ),
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Segmented
            label="Layout"
            value={filters.layout}
            options={LAYOUTS}
            onChange={(layout) => update({ layout })}
          />
          <Segmented
            label="Photo"
            value={filters.photo}
            options={PHOTOS}
            onChange={(photo) => update({ photo })}
          />
        </div>
      </div>

      <p
        className="mt-6 text-sm text-muted-foreground"
        aria-live="polite"
        role="status"
      >
        {filtered
          ? `${shown.length} of ${templates.length} templates match.`
          : `All ${templates.length} templates.`}{" "}
        {filtered && (
          <button
            type="button"
            onClick={() => update(NONE)}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No template matches all of those.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Loosen a filter — or pick any template and restyle it; columns,
            photo and colours all stay editable.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <li key={t.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
                <Link
                  href={builderHref(t.id)}
                  aria-label={`Use the ${t.name} template`}
                  className="group block bg-muted/40 p-5"
                >
                  <TemplateThumbnail
                    presetId={t.id}
                    photo={t.photo}
                    className="rounded-sm shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold">{t.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {t.columns === 2 ? "Two columns" : "One column"}
                      {t.photo ? " · photo optional" : " · no photo"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-primary">
                    Best for {t.best.toLowerCase()}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t.detail}
                  </p>
                  <div className="mt-auto pt-5">
                    <Button asChild className="w-full">
                      <Link href={builderHref(t.id)}>
                        Use {t.name}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
