import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - The Pigeon Post",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>

      <p className="text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using The Pigeon Post (the &quot;Service&quot;), you agree to
          be bound by these Terms of Service (the &quot;Terms&quot;). If you do not
          agree to these Terms, you may not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Use of the Service</h2>
        <p>
          You agree to use the Service only for lawful purposes and in accordance
          with these Terms. You are responsible for any content or activity that
          occurs under your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Accounts &amp; Security</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activities that occur under your account. You
          agree to notify us promptly of any unauthorized use of your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Prohibited Activities</h2>
        <p>
          You agree not to engage in any activity that interferes with or
          disrupts the Service, attempts to gain unauthorized access, or violates
          applicable laws or the rights of others.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
        <p>
          The Service, including its content, features, and functionality, is
          owned by us or our licensors and is protected by copyright, trademark,
          and other laws. You may not copy, modify, or distribute any part of the
          Service without our prior written consent.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          6. Disclaimers &amp; Limitation of Liability
        </h2>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis,
          without warranties of any kind, whether express or implied. To the
          fullest extent permitted by law, we disclaim all warranties and will
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or any loss of profits or data.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">7. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time, for
          any reason, including if you violate these Terms. Upon termination,
          your right to use the Service will immediately cease.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">8. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. When we make changes, we
          will update the &quot;Last updated&quot; date above. Your continued use of
          the Service after any changes take effect constitutes your acceptance
          of the revised Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">9. Contact</h2>
        <p>
          If you have any questions about these Terms of Service, you can contact
          us at your usual support email or contact form.
        </p>
      </section>
    </div>
  );
}

