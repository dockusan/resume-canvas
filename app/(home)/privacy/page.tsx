import { LegalPage } from "@/components/legal-page";
import { SITE, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "Resume Canvas stores your resume in your own browser. No accounts, no servers, no analytics and no third-party tracking.",
  path: "/privacy",
});

const UPDATED = "30 July 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="The short version: your resume never leaves your device."
      updated={UPDATED}
    >
      <section>
        <h2>What we collect</h2>
        <p>
          Nothing. {SITE.name} has no accounts, no sign-up and no back end that
          receives your resume. We do not run analytics, advertising or
          third-party tracking scripts.
        </p>
      </section>

      <section>
        <h2>Where your resume is stored</h2>
        <p>
          Everything you type is saved to your browser&rsquo;s local storage on
          your own machine. It stays there until you clear it, either with the
          &ldquo;Start over&rdquo; action in the builder or by clearing your
          browser data. Because it is stored per-browser, your resume will not
          appear on another device or in a private window.
        </p>
      </section>

      <section>
        <h2>Photos and files</h2>
        <p>
          A photo you add is encoded and stored in that same local storage. It
          is never uploaded.
        </p>
      </section>

      <section>
        <h2>Exporting</h2>
        <p>
          PDF export uses your browser&rsquo;s own print engine, and the
          plain-text export is generated in the page. Neither sends your content
          anywhere.
        </p>
      </section>

      <section>
        <h2>Fonts</h2>
        <p>
          Typefaces are served from this site rather than a third-party font
          CDN, so loading a page does not disclose your visit to another
          company.
        </p>
      </section>

      <section>
        <h2>Hosting logs</h2>
        <p>
          The site is served by a hosting provider that, like any web server,
          may record standard request logs such as IP address and user agent.
          Those logs are not linked to your resume content, which the server
          never receives.
        </p>
      </section>

      <section>
        <h2>Your control</h2>
        <ul>
          <li>Clear your data at any time from within the builder.</li>
          <li>
            Inspect exactly what is stored — the code is open source and runs in
            your browser.
          </li>
          <li>Use the site without providing any personal detail to us.</li>
        </ul>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Open an issue on{" "}
          <a className="underline" href={SITE.repo}>
            GitHub
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
