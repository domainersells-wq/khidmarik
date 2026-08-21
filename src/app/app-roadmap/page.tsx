
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ListChecks, MessageCircle, PackageCheck, SearchCode, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App Roadmap | Khidmatik',
  description: 'Future feature ideas and roadmap for the Khidmatik application.',
};

const features = [
  {
    id: "project-based-ordering",
    title: "Project-Based Ordering (الطلب المتكامل للمشاريع)",
    icon: PackageCheck,
    description: "Streamline purchasing products and booking installation services in a single, integrated step.",
    points: [
      "User selects 'start new project' (e.g., 'install new chandelier').",
      "App displays relevant products (e.g., chandeliers) from partner stores.",
      "After product selection, app asks if a technician is needed for installation.",
      "One-click displays available technicians (e.g., electricians) with their installation prices.",
      "User pays for both product and installation service in a single transaction."
    ]
  },
  {
    id: "smart-search",
    title: "Smart and Advanced Search (البحث الذكي والمتقدم)",
    icon: SearchCode,
    description: "Intuitive and powerful search capabilities to help users find exactly what they need.",
    points: [
      "Search by voice and image (e.g., say 'I need a plumber' or upload a photo of a leaking tap).",
      "Smart filters for professionals: highest-rated, nearest, available now, specialist in (specific brand).",
      "Smart filters for stores: fastest delivery, current offers/discounts, supports pay-on-delivery."
    ]
  },
  {
    id: "trust-transparency",
    title: "Building Trust and Transparency (بناء الثقة والشفافية)",
    icon: ShieldCheck,
    description: "Ensuring user confidence, especially when inviting professionals into their homes.",
    points: [
      "Verified Profiles for professionals: ID verified badge, criminal record check badge (if legally permissible), photo gallery of past work.",
      "Detailed user ratings: Beyond stars, ratings on timeliness, quality of work, cleanliness.",
      "Transparent Pricing: Fixed prices for common tasks (e.g., AC installation), and a 'request quote' feature for complex jobs."
    ]
  },
  {
    id: "customization-comfort",
    title: "Customization and Comfort (التخصيص والراحة)",
    icon: ListChecks,
    description: "Making the app feel personalized and highly convenient for each user.",
    points: [
      "Advanced Scheduling: Book deliveries or technician services for specific future times/dates.",
      "My Lists: Users can create custom lists like 'weekly groceries', 'garden repair tools', 'emergency contacts (plumber, electrician)'.",
      "One-Click Reorder: For previously ordered products or services."
    ]
  },
  {
    id: "effective-communication",
    title: "Effective Communication (التواصل الفعال)",
    icon: MessageCircle,
    description: "Facilitating clear and easy communication between users and service providers.",
    points: [
      "In-App Chat: With options to send photos and videos to accurately describe issues or confirm details.",
      "Live Tracking: For delivery personnel or technicians en route, with estimated time of arrival."
    ]
  },
  {
    id: "loyalty-rewards",
    title: "Smart Loyalty & Rewards (برامج الولاء والمكافآت الذكية - نقاطي)",
    icon: Sparkles,
    description: "Engaging users and encouraging repeat business with a rewarding loyalty program.",
    points: [
      "Points System ('Neqati'): Earn points for orders, writing helpful reviews, or inviting friends.",
      "Flexible Redemption: Exchange points for discounts, small free services (e.g., free delivery, initial problem diagnosis), or donate to local charities in Sidi Bel Abbès (adds social impact)."
    ]
  },
  {
    id: "empowering-providers",
    title: "Empowering Providers (تمكين مزودي الخدمة)",
    icon: Users,
    description: "Providing robust tools for businesses and professionals to enhance their service delivery.",
    points: [
      "Smart Dashboard for Providers: Easy interface to manage schedules, track earnings, and communicate with customers.",
      "Quote Generation Tool: Help professionals (e.g., plumbers) send professional quotes via the app.",
      "Simple Inventory Management: For small stores to update product availability.",
      "Wholesale Material Purchasing: Partner with major suppliers in Sidi Bel Abbès to offer discounted materials (wires, pipes, etc.) to registered professionals."
    ]
  },
  {
    id: "proactive-services",
    title: "Proactive Services & Subscriptions (الخدمات الاستباقية والاشتراكات)",
    icon: Zap,
    description: "Transforming the app into a proactive personal assistant for users' needs.",
    points: [
      "Periodic Maintenance Packages: Discounted subscriptions for regular services (e.g., 'AC Maintenance Package - 2 visits/year', 'Home Cleaning Package - weekly'). Provides peace of mind for users and stable income for professionals.",
      "Smart Reminders: Based on past orders, app sends intelligent reminders (e.g., after 6 months of a water filter repair: 'Time to change your water filter. Book a technician?'). Shows users the app understands their needs."
    ]
  }
];

export default function AppRoadmapPage() {
  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold font-headline text-primary">App Roadmap & Feature Ideas</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A collection of exciting future possibilities for Khidmatik, designed to enhance user experience and provider capabilities.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const FeatureIcon = feature.icon;
          return (
            <Card key={feature.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FeatureIcon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
                  {feature.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <footer className="text-center py-8 text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Khidmatik. These are conceptual ideas and subject to change.</p>
      </footer>
    </div>
  );
}
