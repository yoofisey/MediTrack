import PricingPage from "@/components/PricingPage";

export const metadata = {
  title: "Pricing",
  description:
    "Adhera plans — start free forever, upgrade to Pro or Family for unlimited medications, adherence reports, and caregiver tools. Local pricing for Ghana, Nigeria, Kenya and more.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | Adhera",
    description:
      "Free, Pro, and Family plans for medication tracking, reminders, and family caregiving.",
    url: "https://www.useadhera.com/pricing",
  },
};

export default function Page() {
  return <PricingPage />;
}
