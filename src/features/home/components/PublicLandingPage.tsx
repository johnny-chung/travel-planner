import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import { signInWithAuth0Action } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const showcaseCards = [
  {
    title: "See your itinerary and map together",
    copy: "Lay out each stop on a real route, keep the day sequence visible, and understand the trip at a glance instead of juggling separate notes and map tabs.",
    extraImg: "/material/Cat_1.png",
    mediaType: "video" as const,
    mediaSrc: "/material/Recording_1.mp4",
    mediaAlt: "Planner map and itinerary recording",
    mediaSide: "left" as const,
  },
  {
    title: "Plan your route effortlessly",
    copy: "See the trip as a timeline and a map, calculate movement between stops, and keep the day sequence clear while the itinerary evolves.",
    extraImg: "/material/Compass.png",
    mediaType: "image" as const,
    mediaSrc: "/material/Route.jpg",
    mediaAlt: "Route illustration",
    mediaSide: "right" as const,
  },
  {
    title: "Keep transport, stays, notes, and timing in one plan",
    copy: "Flights, hotels, route details, documents, and day-by-day stops belong in the same trip, so the plan stays readable from first sketch to travel day.",
    mediaType: "video" as const,
    mediaSrc: "/material/Transport_recording.mp4",
    mediaAlt: "Add Flight recording",
    mediaSide: "left" as const,
  },
  {
    title: "Plan together and keep everyone on the same page",
    copy: "Share the trip, collaborate with friends, and keep the schedule readable for everyone instead of passing details around in separate chats.",
    extraImg: "/material/Notebook.png",
    mediaType: "video" as const,
    mediaSrc: "/material/Recording_2.mp4",
    mediaAlt: "Collaboration planning recording",
    mediaSide: "left" as const,
  },
  {
    title: "Track expenses without losing the trip context",
    copy: "Keep spending alongside the itinerary, so transport, stays, shared costs, and trip planning stay connected in the same workspace.",
    mediaType: "video" as const,
    mediaSrc: "/material/Recording_3.mp4",
    mediaAlt: "Expense tracking recording",
    mediaSide: "right" as const,
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
                <h1 className="text-3xl md:text-[clamp(3.3rem,8vw,7rem)] font-semibold leading-[0.93] tracking-[-0.05em] text-[#fff6ec]">
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
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-[#b66e37]">
              Travel Planner
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#4a3223] sm:text-4xl">
              Plan you trips with Friends and track you expense in one place.
            </h2>
          </div>

          <div className="space-y-5">
            {showcaseCards.map((card) => {
              const isMediaLeft = card.mediaSide === "left";

              return (
                <article
                  key={card.title}
                  className="overflow-hidden rounded-[2.25rem] border border-[#d9b58c]/60 bg-[#fff9f0] shadow-[0_18px_45px_rgba(86,58,35,0.08)]"
                >
                  <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-stretch">
                    <div
                      className={[
                        "border-[#d9b58c]/50 bg-[#f1dfc5]",
                        isMediaLeft
                          ? "border-b lg:border-b-0 lg:border-r"
                          : "border-b lg:order-2 lg:border-b-0 lg:border-l",
                      ].join(" ")}
                    >
                      <div className="h-full p-4 sm:p-5">
                        <div className="flex h-full min-h-64 items-center justify-center overflow-hidden rounded-[1.7rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_rgba(238,216,186,0.9))] p-4">
                          {card.mediaType === "video" ? (
                            <video
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="h-full max-h-[24rem] w-full rounded-[1.35rem] object-cover shadow-[0_22px_50px_rgba(86,58,35,0.18)]"
                            >
                              <source src={card.mediaSrc} type="video/mp4" />
                            </video>
                          ) : (
                            <Image
                              src={card.mediaSrc}
                              alt={card.mediaAlt}
                              width={420}
                              height={420}
                              className="h-full max-h-[22rem] w-[70%] object-contain"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className={[
                        "flex items-center p-6 sm:p-8 lg:p-10",
                        isMediaLeft ? "" : "lg:order-1",
                      ].join(" ")}
                    >
                      <div className="max-w-xl">
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#4a3223] sm:text-[2rem]">
                          {card.title}
                        </h3>
                        <p className="mt-4 text-sm leading-7 text-[#6f5138] sm:text-base">
                          {card.copy}
                        </p>
                        {card.extraImg ? (
                          <div className={`w-full hidden md:flex md:mt-6 ${isMediaLeft? "justify-end": "justify-start"}`}>
                            <Image
                              src={card.extraImg}
                              alt={"deco"}
                              width={200}
                              height={200}
                              className="h-full max-h-[22rem] w-[25%] object-contain"
                            />
                          </div>
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d7b48f]/60 bg-[#efe1cb] px-4 py-8 text-sm text-[#6e5038] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">Copyright © GoodmanLtd</div>
      </footer>
    </main>
  );
}
