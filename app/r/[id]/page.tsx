import { SharedResume } from "@/components/share/shared-resume";
import type { Metadata } from "next";

/**
 * Nobody's resume should ever turn up in a search result. The share id is
 * unguessable, but that only protects against enumeration — a crawler that
 * follows a link posted anywhere public would index the real thing.
 */
export const metadata: Metadata = {
  title: "Shared resume",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SharedResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Rendered client-side and nowhere else: the decryption key lives in the
  // URL fragment, which never reaches this server.
  return <SharedResume id={id} />;
}
