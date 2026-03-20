import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, Map, ScrollText } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import { signInWithAuth0Action } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    title: "See your itinerary and map together",
    copy: "Lay out each stop on a real route, keep the day sequence visible, and understand the trip at a glance instead of juggling separate notes and map tabs.",
    image: "/material/Compass_Map.png",
    alt: "Compass and map illustration",
  },
  {
    title: "Keep transport, stays, notes, and timing in one plan",
    copy: "Flights, hotels, route details, documents, and day-by-day stops belong in the same trip, so the plan stays readable from first sketch to travel day.",
    image: "/material/Scroll_2.png",
    alt: "Scroll illustration",
  },
  {
    title: "Plan together and keep everyone on the same page",
    copy: "Share the trip, collaborate with friends, and keep the schedule readable for everyone instead of passing details around in separate chats.",
    image: "/material/Cat_1.png",
    alt: "Cat illustration",
  },
];

const detailCards = [
  {
    title: "Plan your route effortlessly",
    copy: "See the trip as a timeline and a map, calculate movement between stops, and keep the day sequence clear while the itinerary evolves.",
    icon: BookOpenText,
  },
  {
    title: "Collaborate and share with friends",
    copy: "Invite people into the same trip, share the plan details, and keep one version of the itinerary instead of everyone maintaining their own copy.",
    icon: Map,
  },
  {
    title: "Track expenses without losing the trip context",
    copy: "Keep spending alongside the itinerary, so transport, stays, shared costs, and trip planning stay connected in the same workspace.",
    icon: ScrollText,
  },
];

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5ead8] text-[#3c2a1c]">
      <section className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/material/carousell.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#1e130d]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(227,168,86,0.28),_transparent_48%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="md:hidden">
            <div className="mx-auto flex items-center justify-between bg-[#fff7ea]/12 px-4 py-3 backdrop-blur-md sm:px-6">
              <BrandLogo
                size={40}
                priority
                iconClassName="h-10 w-10 rounded-full bg-[#ebb06e]/24 p-1.5"
                labelClassName="text-base text-[#fff3df]"
              />
              <div className="flex items-center gap-2">
                <form action={signInWithAuth0Action}>
                  <input
                    type="hidden"
                    name="redirectTo"
                    value="/auth/post-login"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 rounded-full border-[#e6c29b]/50 bg-[#fff7ea]/10 px-5 text-[#fff3df] hover:bg-[#fff7ea]/20"
                  >
                    Sign in
                  </Button>
                </form>
                <Link href="/try">
                  <Button className="h-11 rounded-full bg-[#b96e35] px-5 text-[#fff6ec] hover:bg-[#a25d2b]">
                    Try it out
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <div className="flex flex-1 items-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl justify-center text-center">
              <div className="w-full max-w-5xl">
              <h1 className="text-[clamp(3.3rem,8vw,7rem)] font-semibold leading-[0.93] tracking-[-0.05em] text-[#fff6ec]">
                Roamer&apos;s Ledger
                <span className="block text-[#ebb06e]">
                  your itinerary, map, and travel notes in one place
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#f3debf]">
                Plan the route, keep the schedule readable, organize stays and
                transport, collaborate with friends, and track trip expenses
                without splitting everything across spreadsheets, map tabs,
                chat threads, and scattered booking links.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/try">
                  <Button className="h-12 min-w-40 rounded-full bg-[#b96e35] px-6 text-[#fff6ec] hover:bg-[#a25d2b]">
                    Try it out
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <form action={signInWithAuth0Action}>
                  <input
                    type="hidden"
                    name="redirectTo"
                    value="/auth/post-login"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-12 min-w-40 rounded-full border-[#e6c29b]/50 bg-[#fff7ea]/10 px-6 text-[#fff3df] hover:bg-[#fff7ea]/20"
                  >
                    Sign in
                  </Button>
                </form>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d7b48f]/60 bg-[#f6ecdc] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-[#b66e37]">
              One Place
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#4a3223] sm:text-4xl">
              The planner is designed to keep the trip in one system, not split
              across five tools.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[2rem] border border-[#d9b58c]/60 bg-[#fff9f0] p-5 shadow-[0_18px_45px_rgba(86,58,35,0.08)]"
              >
                <div className="rounded-[1.5rem] bg-[#f1dfc5] p-4">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    width={420}
                    height={300}
                    className="h-40 w-full object-contain"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#4a3223]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6f5138]">
                  {card.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[2.25rem] border border-[#d7b48f]/60 bg-[#fff8ed] p-6 shadow-[0_20px_50px_rgba(86,58,35,0.08)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] bg-[#f1dfc5] p-4">
                <Image
                  src="/material/Notebook.png"
                  alt="Notebook illustration"
                  width={348}
                  height={323}
                  className="h-40 w-full object-contain"
                />
              </div>
              <div className="rounded-[1.6rem] bg-[#edd9bc] p-4">
                <Image
                  src="/material/Compass.png"
                  alt="Compass illustration"
                  width={325}
                  height={324}
                  className="h-40 w-full object-contain"
                />
              </div>
              <div className="rounded-[1.6rem] bg-[#f4e6d1] p-4">
                <Image
                  src="/material/Pin_maker_2.png"
                  alt="Travel pin illustration"
                  width={239}
                  height={192}
                  className="h-32 w-full object-contain"
                />
              </div>
              <div className="rounded-[1.6rem] bg-[#f0dcc0] p-4">
                <Image
                  src="/material/Scroll.png"
                  alt="Scroll illustration"
                  width={400}
                  height={209}
                  className="h-32 w-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {detailCards.map(({ title, copy, icon: Icon }) => (
              <div
                key={title}
                className="rounded-[1.8rem] border border-[#d9b58c]/60 bg-[#fffaf3] p-5"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2dfc3] text-[#ab6534]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#4a3223]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6f5138]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d7b48f]/60 bg-[#efe1cb] px-4 py-8 text-sm text-[#6e5038] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">Copyright © GoodmanLtd</div>
      </footer>
    </main>
  );
}
