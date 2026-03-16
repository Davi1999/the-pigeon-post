import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - The Pigeon Post",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <section className="space-y-3">
        <p>
          This Privacy Policy explains how we handle information when you use The
          Pigeon Post (the &quot;Service&quot;). By using the Service, you agree to the
          collection and use of information in accordance with this Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <span className="font-medium">Account information:</span> such as
            your name, email address, and login details when you create or use an
            account.
          </li>
          <li>
            <span className="font-medium">Usage information:</span> basic
            information about how you use the Service, such as pages viewed and
            general activity.
          </li>
          <li>
            <span className="font-medium">Technical information:</span>{" "}
            information automatically sent by your browser or device, such as IP
            address, browser type, and approximate device information, which
            helps us keep the Service secure and reliable.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. How We Use Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide, operate, and maintain the Service.</li>
          <li>Personalize your experience and improve the Service.</li>
          <li>Communicate with you about the Service, including updates.</li>
          <li>Monitor usage and protect the security and integrity of the Service.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We may share information with
          trusted third parties that help us operate, provide, or improve the
          Service (for example, infrastructure or analytics providers), subject
          to appropriate safeguards.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Data Retention</h2>
        <p>
          We retain personal information for as long as necessary to provide the
          Service, comply with our legal obligations, resolve disputes, and
          enforce our agreements. We may retain aggregated or de-identified
          information for longer periods.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Your Choices</h2>
        <p>
          You may be able to update certain account information directly in the
          Service. If you no longer wish to use the Service, you can stop using
          it at any time. You may also contact us if you have questions about
          your information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">6. Security</h2>
        <p>
          We use reasonable measures to help protect personal information from
          loss, misuse, and unauthorized access. However, no method of
          transmission over the internet or method of electronic storage is
          completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we make
          changes, we will update the &quot;Last updated&quot; date above. Your continued
          use of the Service after any changes take effect constitutes your
          acceptance of the revised Policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Contact</h2>
        <p>
          If you have any questions about this Privacy Policy, you can contact us
          at your usual support email or contact form.
        </p>
      </section>
    </div>
  );
}

