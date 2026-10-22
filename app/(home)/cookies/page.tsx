import { LegalPage } from "@/components/legal-page";
import { UPDATED, pageMetadata, updatedLabel } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie policy",
  description:
    "Resume Canvas sets no tracking cookies. Your resume and a few preferences are kept in your own browser's local storage, never sent anywhere.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie policy"
      intro="No tracking cookies, no advertising cookies, no consent banner needed."
      updated={updatedLabel(UPDATED.cookies)}
    >
      <section>
        <h2>What we store</h2>
        <p>
          {"We use "}
          <strong>local storage</strong>
          {", not cookies, and only for:"}
        </p>
        <ul>
          <li>the resume you are working on;</li>
          <li>whether you chose the light or dark theme;</li>
          <li>a job description you paste into the ATS tab, if you do;</li>
          <li>
            the list of share links you have created, so the share dialog can
            show when each one expires.
          </li>
        </ul>
        <p>
          All of it stays on your device and is never transmitted by itself. The
          resume only leaves when you create a share link or use an AI tool, as
          the privacy policy explains.
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
          Clearing site data in your browser removes all of the above. The
          resume cannot be recovered afterwards, so use Export resume file in
          the builder&rsquo;s menu first if you want to keep it; you can import
          that file again later.
        </p>
      </section>
    </LegalPage>
  );
}
