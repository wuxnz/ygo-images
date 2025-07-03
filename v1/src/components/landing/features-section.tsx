import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Easy Tournament Creation",
    description:
      "Set up tournaments in minutes with our intuitive creation tools",
    badge: "New",
  },
  {
    title: "Real-time Bracket Management",
    description:
      "Automatically generate and update brackets as matches progress",
  },
  {
    title: "Player Registration",
    description:
      "Allow players to easily join tournaments with secure authentication",
  },
  {
    title: "Prize Distribution",
    description:
      "Manage and distribute prizes to winners with integrated payment systems",
  },
  {
    title: "Live Notifications",
    description:
      "Keep participants updated with real-time match alerts and updates",
  },
  {
    title: "Comprehensive Stats",
    description:
      "Track player performance with detailed statistics and analytics",
  },
];

export function FeaturesSection() {
  return (
    <section>
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Powerful Tournament Features
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            Everything you need to run successful tournaments from start to
            finish
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="h-full transition-transform hover:scale-105"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {feature.title}
                  {feature.badge && (
                    <Badge variant="secondary">{feature.badge}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
