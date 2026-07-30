import { LegalPage } from "@/components/legal-page";
import { SITE, UPDATED, pageMetadata, updatedLabel } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of service",
  description:
    "Resume Canvas is free, open-source software provided as-is. You own the resumes you create with it.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="Free, open-source software. You own what you write."
      updated={updatedLabel(UPDATED.terms)}
    >
      <section>
        <h2>Using the service</h2>
        <p>
          {SITE.name} is provided free of charge for personal and commercial
          use. There is no account to create and no licence to purchase. You may
          use it to build resumes for yourself or for others.
        </p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>
          You retain every right to the resumes you create. We claim no
          ownership over your content, and while you are writing it is stored in
          your browser rather than on a server. The one exception is a share
          link you choose to create, described below.
        </p>
      </section>

      <section>
        <h2>Share links</h2>
        <p>
          Creating a share link uploads an encrypted copy of your resume so that
          anyone holding the link can view it. Because the key stays in the link
          and never reaches us, we cannot read what we store, cannot recover a
          link you have lost, and cannot show you who has opened one. Every link
          expires after the period you choose, up to one year, and is then
          deleted.
        </p>
        <p>
          Do not use share links to store or distribute anything other than a
          resume, and do not upload content you have no right to share. We may
          remove stored files and limit access to the feature to keep it working
          for everyone.
        </p>
      </section>

      <section>
        <h2>Your responsibility</h2>
        <p>
          Because your work is stored only in your browser, keeping a copy is up
          to you. Clearing your browser data, switching device or using a
          private window will lose it. Export a PDF when you have something
          worth keeping.
        </p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          The software is provided &ldquo;as is&rdquo;, without warranty of any
          kind, express or implied. We do not guarantee that it will be
          uninterrupted or error-free, and we are not liable for any loss
          arising from its use — including lost resume data or the outcome of
          any job application.
        </p>
      </section>

      <section>
        <h2>Licence</h2>
        <p>
          The source is available under the MIT licence. You are free to read,
          modify and self-host it; see the{" "}
          <a className="underline" href={SITE.repo}>
            repository
          </a>{" "}
          for the full text.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          These terms may change as the project develops. Continued use after a
          change means you accept the revised terms.
        </p>
      </section>
    </LegalPage>
  );
}
