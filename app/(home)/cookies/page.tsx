import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie policy",
  description:
    "Resume Canvas sets no tracking cookies. Only your theme preference and your resume are stored, both locally in your browser.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="No tracking cookies, no advertising cookies, no consent banner needed."
      updated="30 July 2026"
    >
      <section>
        <h2>What we store</h2>
        <p>
          {"We use "}
          <strong>local storage</strong>
          {
            ", not cookies, and only for two things: the resume you are working on, and whether you chose the light or dark theme. Both stay on your device and are never transmitted."
          }
        </p>
      </section>

      <section>
        <h2>What we do not use</h2>
        <ul>
          <li>No analytics or measurement cookies.</li>
          <li>No advertising or retargeting cookies.</li>
          <li>No social media embeds that set cookies.</li>
          <li>No cross-site identifiers of any kind.</li>
        </ul>
      </section>

      <section>
        <h2>Clearing it</h2>
        <p>
          Clearing site data in your browser removes both the theme preference
          and your resume. The resume cannot be recovered afterwards, so export
          a PDF first if you want to keep it.
        </p>
      </section>
    </LegalPage>
  );
}
