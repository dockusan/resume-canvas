import { LegalPage } from "@/components/legal-page";
import { SITE, UPDATED, pageMetadata, updatedLabel } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "Resume Canvas stores your resume in your own browser. No accounts, no servers, no analytics and no third-party tracking.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="The short version: your resume stays on your device unless you deliberately share a link — and even then we cannot read it."
      updated={updatedLabel(UPDATED.privacy)}
    >
      <section>
        <h2>What we collect</h2>
        <p>
          Nothing. {SITE.name} has no accounts, no sign-up and no back end that
          receives your resume as you write. We do not run analytics,
          advertising or third-party tracking scripts.
        </p>
        <p>
          There is exactly one way anything leaves your device, and only if you
          ask for it: creating a share link. That is described in full below.
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
        <h2>Sharing a resume</h2>
        <p>
          If you choose to create a share link, your resume is encrypted in your
          browser first. What is uploaded is the encrypted file and the random
          value needed to decrypt it in combination with the key — nothing else.
          We do not store your name, your IP address, your browser or the page
          you came from alongside it.
        </p>
        <p>
          The decryption key is generated on your device and placed in the part
          of the link after the <code>#</code>. Browsers never transmit that
          part in a request, so the key never reaches our server. The practical
          consequence is that we hold a file we are unable to read, and that
          anyone who has the complete link can read it — so treat a share link
          as you would the resume itself.
        </p>
        <p>
          You choose how long a link lasts, up to one year. When it lapses the
          encrypted file is deleted automatically and the link stops working.
          Shared pages are marked <code>noindex</code> and excluded in{" "}
          <code>robots.txt</code> so that search engines do not list them.
        </p>
      </section>

      <section>
        <h2>Photos and files</h2>
        <p>
          A photo you add is resized in your browser and stored in that same
          local storage. It is not uploaded unless you create a share link, in
          which case it is encrypted along with the rest of the resume.
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
          Those logs are not linked to any resume content, which the server only
          ever receives in a form it cannot decrypt. To limit abuse of the share
          endpoint we count recent requests against a one-way hash of the
          caller&rsquo;s address, held for an hour and never stored with a
          share.
        </p>
      </section>

      <section>
        <h2>Your control</h2>
        <ul>
          <li>Clear your data at any time from within the builder.</li>
          <li>
            Choose whether to share at all — nothing is uploaded until you
            create a link, and every link expires.
          </li>
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
