import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const testimonials = [
  {
    name: "Alex Johnson",
    role: "Tournament Organizer",
    content:
      "Top Deck Circuit has completely transformed how we run our esports events. Setup is a breeze and participants love the real-time updates!",
    avatar: "/avatars/01.png",
    initials: "AJ",
  },
  {
    name: "Sarah Williams",
    role: "Professional Gamer",
    content:
      "I've competed in over 50 tournaments using Top Deck Circuit. The bracket system is flawless and prize distribution is always smooth.",
    avatar: "/avatars/02.png",
    initials: "SW",
  },
  {
    name: "Michael Chen",
    role: "Community Manager",
    content:
      "Our community engagement has doubled since switching to Top Deck Circuit. The notification system keeps everyone informed and excited.",
    avatar: "/avatars/03.png",
    initials: "MC",
  },
];

export function TestimonialsSection() {
  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            What Our Users Say
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            Hear from tournament organizers and competitors who use Top Deck
            Circuit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                    <AvatarFallback>{testimonial.initials}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <h3 className="font-bold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 italic dark:text-gray-300">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
