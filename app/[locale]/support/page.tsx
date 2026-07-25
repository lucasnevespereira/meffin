import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, type LegalSection } from "@/components/legal/legal-shell";

const SUPPORT_EMAIL = "lnevespereira@proton.me";

export const metadata: Metadata = {
  title: "Meffin Support",
  description: "Get help with Meffin and contact its developer.",
};

const content = {
  en: {
    title: "Meffin Support",
    intro: "Need help with Meffin? Start with the guidance below or contact us directly.",
    contactHeading: "Contact",
    contactLead: "For app issues, feedback, or feature requests, email",
    contactHint:
      "When reporting a problem, include your device, operating system, Meffin version, and the steps that led to it. Screenshots are helpful when available.",
    troubleshootingHeading: "Troubleshooting",
    troubleshooting: [
      "Make sure you are using the latest available version of Meffin.",
      "If you cannot sign in, use the same sign-in method you used when creating your account.",
      "Try closing and reopening the app before contacting support.",
    ],
    accountHeading: "Account and data",
    accountText:
      "For help accessing your account or questions about your personal data, contact us from the email address associated with your account whenever possible.",
    linksHeading: "Policies",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    backLabel: "← Back to Meffin",
  },
  fr: {
    title: "Assistance Meffin",
    intro:
      "Besoin d'aide avec Meffin ? Consultez les conseils ci-dessous ou contactez-nous directement.",
    contactHeading: "Contact",
    contactLead:
      "Pour un problème, un commentaire ou une suggestion de fonctionnalité, écrivez à",
    contactHint:
      "Lorsque vous signalez un problème, indiquez votre appareil, votre système d'exploitation, la version de Meffin et les étapes qui ont mené au problème. Une capture d'écran peut également nous aider.",
    troubleshootingHeading: "Dépannage",
    troubleshooting: [
      "Vérifiez que vous utilisez la dernière version disponible de Meffin.",
      "Si vous ne pouvez pas vous connecter, utilisez la même méthode de connexion que lors de la création de votre compte.",
      "Essayez de fermer puis de rouvrir l'application avant de contacter l'assistance.",
    ],
    accountHeading: "Compte et données",
    accountText:
      "Pour obtenir de l'aide avec votre compte ou poser une question sur vos données personnelles, contactez-nous si possible depuis l'adresse email associée à votre compte.",
    linksHeading: "Politiques",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    backLabel: "← Retour à Meffin",
  },
} as const;

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "fr" ? "fr" : "en";
  const c = content[locale];

  const sections: LegalSection[] = [
    {
      heading: c.contactHeading,
      paragraphs: [
        <>
          {c.contactLead}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </>,
        c.contactHint,
      ],
    },
    {
      heading: c.troubleshootingHeading,
      bullets: [...c.troubleshooting],
    },
    {
      heading: c.accountHeading,
      paragraphs: [c.accountText],
    },
    {
      heading: c.linksHeading,
      paragraphs: [
        <span className="flex flex-wrap gap-x-5 gap-y-2" key="policy-links">
          <Link
            href={`/${locale}/privacy`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {c.privacy}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {c.terms}
          </Link>
        </span>,
      ],
    },
  ];

  return (
    <LegalShell
      locale={locale}
      title={c.title}
      intro={c.intro}
      sections={sections}
      backLabel={c.backLabel}
    />
  );
}
