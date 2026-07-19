import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy - Meffin",
  description: "How Meffin collects, uses, and protects your data.",
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
    title: "Privacy Policy",
    updated: "Last updated: July 19, 2026",
    backLabel: "← Back to Meffin",
    intro:
      "Meffin is a simple monthly budget tracker. This policy explains what we collect, why, and what you can do about it. We keep it short because we collect little.",
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Account details: your name and email address. If you sign in with Google or Apple, we receive these from them. Apple may give you a private relay email instead of your real one — that still works.",
          "Your budget data: the transactions, amounts, categories, lists, currency, and language you add to Meffin.",
          "If you share a budget with a partner, the data you share becomes visible to them.",
          "Basic technical data needed to keep you signed in, such as a session cookie. We don't run third-party ad or analytics trackers.",
        ],
      },
      {
        heading: "How we use it",
        bullets: [
          "To run the app: store your budget, sync it across your devices, and sign you in.",
          "To keep your account secure.",
          "We do not sell your data, and we don't use it for advertising.",
        ],
      },
      {
        heading: "Who we share it with",
        bullets: [
          "A partner you choose to share a budget with.",
          "Infrastructure providers that host the app and database on our behalf. They process data only to run the service.",
          "Authorities, if the law requires it.",
        ],
      },
      {
        heading: "How long we keep it",
        paragraphs: [
          "We keep your data while your account is active. When you delete your account from the app, your data — transactions, lists, and categories — is permanently removed. This can't be undone.",
        ],
      },
      {
        heading: "Your choices",
        bullets: [
          "See and edit your data any time inside the app.",
          "Export your transactions as a spreadsheet.",
          "Delete your account, and everything with it, from the profile screen.",
        ],
      },
      {
        heading: "Security",
        paragraphs: [
          "Passwords are hashed, connections are encrypted in transit, and sign-in is handled by trusted providers. No system is perfect, but we take reasonable steps to protect your data.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "Meffin isn't meant for children under 13, and we don't knowingly collect their data.",
        ],
      },
      {
        heading: "Changes",
        paragraphs: [
          "If we change this policy, we'll update the date at the top and note significant changes in the app.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions or requests about your data? Email us at support@meffin.app.",
        ],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 19 juillet 2026",
    backLabel: "← Retour à Meffin",
    intro:
      "Meffin est une application simple de suivi de budget mensuel. Cette politique explique ce que nous collectons, pourquoi, et ce que vous pouvez y faire. Elle est courte parce que nous collectons peu.",
    sections: [
      {
        heading: "Ce que nous collectons",
        bullets: [
          "Vos informations de compte : nom et adresse e-mail. Si vous vous connectez avec Google ou Apple, nous les recevons de leur part. Apple peut vous fournir une adresse relais privée plutôt que la vôtre — cela fonctionne aussi.",
          "Vos données de budget : les transactions, montants, catégories, listes, devise et langue que vous ajoutez dans Meffin.",
          "Si vous partagez un budget avec un partenaire, les données partagées lui deviennent visibles.",
          "Des données techniques de base nécessaires pour vous garder connecté, comme un cookie de session. Nous n'utilisons pas de traqueurs publicitaires ou d'analyse tiers.",
        ],
      },
      {
        heading: "Comment nous les utilisons",
        bullets: [
          "Pour faire fonctionner l'application : enregistrer votre budget, le synchroniser entre vos appareils et vous connecter.",
          "Pour sécuriser votre compte.",
          "Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires.",
        ],
      },
      {
        heading: "Avec qui nous les partageons",
        bullets: [
          "Un partenaire avec qui vous choisissez de partager un budget.",
          "Les prestataires d'infrastructure qui hébergent l'application et la base de données pour notre compte. Ils traitent les données uniquement pour faire fonctionner le service.",
          "Les autorités, si la loi l'exige.",
        ],
      },
      {
        heading: "Combien de temps nous les conservons",
        paragraphs: [
          "Nous conservons vos données tant que votre compte est actif. Lorsque vous supprimez votre compte depuis l'application, vos données — transactions, listes et catégories — sont définitivement effacées. Cette action est irréversible.",
        ],
      },
      {
        heading: "Vos choix",
        bullets: [
          "Consulter et modifier vos données à tout moment dans l'application.",
          "Exporter vos transactions sous forme de tableur.",
          "Supprimer votre compte, et tout ce qu'il contient, depuis l'écran de profil.",
        ],
      },
      {
        heading: "Sécurité",
        paragraphs: [
          "Les mots de passe sont hachés, les connexions sont chiffrées en transit et la connexion est gérée par des prestataires de confiance. Aucun système n'est parfait, mais nous prenons des mesures raisonnables pour protéger vos données.",
        ],
      },
      {
        heading: "Enfants",
        paragraphs: [
          "Meffin n'est pas destiné aux enfants de moins de 13 ans, et nous ne collectons pas sciemment leurs données.",
        ],
      },
      {
        heading: "Modifications",
        paragraphs: [
          "Si nous modifions cette politique, nous mettrons à jour la date en haut et signalerons les changements importants dans l'application.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Des questions ou des demandes concernant vos données ? Écrivez-nous à support@meffin.app.",
        ],
      },
    ],
  },
};

export default async function PrivacyPage({
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
