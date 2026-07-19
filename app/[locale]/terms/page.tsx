import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service - Meffin",
  description: "The terms for using Meffin.",
};

type Content = {
  title: string;
  updated: string;
  intro: string;
  backLabel: string;
  sections: LegalSection[];
};

const content: Record<"en" | "fr", Content> = {
  en: {
    title: "Terms of Service",
    updated: "Last updated: July 19, 2026",
    backLabel: "← Back to Meffin",
    intro:
      "These terms cover your use of Meffin. By using the app, you agree to them.",
    sections: [
      {
        heading: "Using Meffin",
        paragraphs: [
          "Meffin is a personal budgeting app. We grant you a personal, non-transferable right to use it. Don't misuse it, try to break it, or use it to break the law.",
        ],
      },
      {
        heading: "Your account",
        bullets: [
          "You're responsible for your account and for keeping your sign-in secure.",
          "Give accurate information when you sign up.",
          "You must be at least 13 years old to use Meffin.",
        ],
      },
      {
        heading: "Your data is yours",
        paragraphs: [
          "You own the budget data you put into Meffin. You can export or delete it at any time. We only use it to provide the service, as described in the Privacy Policy.",
        ],
      },
      {
        heading: "Availability",
        paragraphs: [
          "We work to keep Meffin running, but we can't promise it will always be available or error-free. We may change or discontinue features.",
        ],
      },
      {
        heading: "As is",
        paragraphs: [
          'Meffin is provided "as is," without warranties of any kind. It\'s a budgeting tool, not financial advice.',
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the extent the law allows, we aren't liable for any indirect or incidental damages arising from your use of Meffin.",
        ],
      },
      {
        heading: "Ending your use",
        paragraphs: [
          "You can stop using Meffin and delete your account at any time. We may suspend accounts that break these terms.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "We may update these terms. We'll change the date above and note significant changes in the app. Continuing to use Meffin means you accept the update.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: ["These terms are governed by the laws of France."],
      },
      {
        heading: "Contact",
        paragraphs: ["Questions? Email support@meffin.app."],
      },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    updated: "Dernière mise à jour : 19 juillet 2026",
    backLabel: "← Retour à Meffin",
    intro:
      "Ces conditions encadrent votre utilisation de Meffin. En utilisant l'application, vous les acceptez.",
    sections: [
      {
        heading: "Utiliser Meffin",
        paragraphs: [
          "Meffin est une application de budget personnel. Nous vous accordons un droit d'utilisation personnel et non transférable. Ne l'utilisez pas à mauvais escient, n'essayez pas de la casser et ne l'utilisez pas pour enfreindre la loi.",
        ],
      },
      {
        heading: "Votre compte",
        bullets: [
          "Vous êtes responsable de votre compte et de la sécurité de vos identifiants.",
          "Fournissez des informations exactes lors de votre inscription.",
          "Vous devez avoir au moins 13 ans pour utiliser Meffin.",
        ],
      },
      {
        heading: "Vos données vous appartiennent",
        paragraphs: [
          "Vous êtes propriétaire des données de budget que vous saisissez dans Meffin. Vous pouvez les exporter ou les supprimer à tout moment. Nous les utilisons uniquement pour fournir le service, comme décrit dans la Politique de confidentialité.",
        ],
      },
      {
        heading: "Disponibilité",
        paragraphs: [
          "Nous faisons de notre mieux pour que Meffin fonctionne, mais nous ne pouvons pas garantir une disponibilité permanente ni l'absence d'erreurs. Nous pouvons modifier ou interrompre des fonctionnalités.",
        ],
      },
      {
        heading: "En l'état",
        paragraphs: [
          "Meffin est fourni « en l'état », sans garantie d'aucune sorte. C'est un outil de budget, pas un conseil financier.",
        ],
      },
      {
        heading: "Limitation de responsabilité",
        paragraphs: [
          "Dans les limites permises par la loi, nous ne sommes pas responsables des dommages indirects ou accessoires résultant de votre utilisation de Meffin.",
        ],
      },
      {
        heading: "Fin d'utilisation",
        paragraphs: [
          "Vous pouvez cesser d'utiliser Meffin et supprimer votre compte à tout moment. Nous pouvons suspendre les comptes qui enfreignent ces conditions.",
        ],
      },
      {
        heading: "Modifications",
        paragraphs: [
          "Nous pouvons mettre à jour ces conditions. Nous modifierons la date ci-dessus et signalerons les changements importants dans l'application. Continuer à utiliser Meffin vaut acceptation de la mise à jour.",
        ],
      },
      {
        heading: "Droit applicable",
        paragraphs: ["Ces conditions sont régies par le droit français."],
      },
      {
        heading: "Contact",
        paragraphs: ["Des questions ? Écrivez à support@meffin.app."],
      },
    ],
  },
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = content[locale === "fr" ? "fr" : "en"];
  return (
    <LegalShell
      locale={locale}
      title={c.title}
      updated={c.updated}
      intro={c.intro}
      sections={c.sections}
      backLabel={c.backLabel}
    />
  );
}
