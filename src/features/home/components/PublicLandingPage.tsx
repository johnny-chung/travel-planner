import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { signInWithAuth0Action } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { getRequestDictionary } from "@/features/i18n/server";
import { localizeHref } from "@/features/i18n/config";

export default async function PublicLandingPage() {
  const { dictionary, locale } = await getRequestDictionary();
  const showcaseCards = [
    {
      title: dictionary.landing.featureItineraryTitle,
      copy: dictionary.landing.featureItineraryCopy,
      extraImg: "/material/Cat_1.png",
      mediaType: "video" as const,
      mediaSrc: "/material/Recording_1.mp4",
      mediaAlt: "Planner map and itinerary recording",
      mediaSide: "left" as const,
    },
    {
      title: dictionary.landing.featureRouteTitle,
      copy: dictionary.landing.featureRouteCopy,
      extraImg: "/material/Compass.png",
      mediaType: "image" as const,
      mediaSrc: "/material/Route.jpg",
      mediaAlt: "Route illustration",
      mediaSide: "right" as const,
    },
    {
      title: dictionary.landing.featureLogisticsTitle,
      copy: dictionary.landing.featureLogisticsCopy,
      mediaType: "video" as const,
      mediaSrc: "/material/Transport_recording.mp4",
      mediaAlt: "Transport planning recording",
      mediaSide: "left" as const,
    },
    {
      title: dictionary.landing.featureCollaborateTitle,
      copy: dictionary.landing.featureCollaborateCopy,
      extraImg: "/material/Notebook.png",
      mediaType: "video" as const,
      mediaSrc: "/material/Recording_2.mp4",
      mediaAlt: "Collaboration planning recording",
      mediaSide: "left" as const,
    },
    {
      title: dictionary.landing.featureExpenseTitle,
      copy: dictionary.landing.featureExpenseCopy,
      mediaType: "video" as const,
      mediaSrc: "/material/Recording_3.mp4",
      mediaAlt: "Expense tracking recording",
      mediaSide: "right" as const,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-[#f6f4ef] text-[#231c18]">
      <section className="relative min-h-screen overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/material/Hero_video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#101816]/76" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(111,177,162,0.24),_transparent_46%)]" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="md:hidden">
            <div className="mx-auto flex items-center justify-between bg-[#fffdf8]/10 px-4 py-3 backdrop-blur-md sm:px-6">
              <BrandLogo
                size={40}
                priority
                iconClassName="h-10 w-10 rounded-lg bg-white/10 p-1.5"
                labelClassName="text-base text-[#f7f2e8]"
              />
              <div className="flex items-center gap-2">
                <LanguageSwitcher variant="solid" className="h-11 px-3" />
                <form action={signInWithAuth0Action}>
                  <input
                    type="hidden"
                    name="redirectTo"
                    value={localizeHref(locale, "/auth/post-login")}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 rounded-lg border-white/15 bg-white/8 px-5 text-[#f7f2e8] hover:bg-white/12"
                  >
                    {dictionary.landing.signIn}
                  </Button>
                </form>
                <Link href={localizeHref(locale, "/try")}>
                  <Button className="h-11 rounded-lg bg-[#2f6e62] px-5 text-[#f7f2e8] hover:bg-[#285b51]">
                    {dictionary.landing.tryItOut}
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <div className="absolute right-4 top-4 hidden z-20 md:flex items-center gap-2 sm:right-6 lg:right-8">
            <LanguageSwitcher variant="solid" className="h-11 px-3" />
            <form action={signInWithAuth0Action}>
              <input
                type="hidden"
                name="redirectTo"
                value={localizeHref(locale, "/auth/post-login")}
              />
              <Button
                type="submit"
                variant="outline"
                className="h-11 rounded-lg border-white/15 bg-white/8 px-5 text-[#f7f2e8] hover:bg-white/12"
              >
                {dictionary.landing.signIn}
              </Button>
            </form>
            <Link href={localizeHref(locale, "/try")}>
              <Button className="h-11 rounded-lg bg-[#2f6e62] px-5 text-[#f7f2e8] hover:bg-[#285b51]">
                {dictionary.landing.tryItOut}
              </Button>
            </Link>
          </div>

          <div className="flex flex-1 items-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl justify-center text-center">
              <div className="w-full max-w-5xl">
                <h1 className="font-brand text-3xl font-semibold leading-[0.93] tracking-[-0.05em] text-[#fff6ec] md:text-[clamp(3.3rem,8vw,7rem)]">
                  {dictionary.landing.heroTitle}
                </h1>
                {locale !== "en" && dictionary.landing.heroNameTranslation ? (
                  <h3 className="font-brand mt-3 text-xl font-medium leading-none tracking-[-0.03em] text-[#e8f1ec] md:text-4xl">
                    {dictionary.landing.heroNameTranslation}
                  </h3>
                ) : null}
                <h2 className="mt-6 text-xl text-[#9fd3c8] md:text-5xl">
                  {dictionary.landing.heroSubtitle}
                </h2>
                <p className="mx-auto mt-6 max-w-3xl text-md leading-8 text-[#8eac9c] md:text-xl">
                  {dictionary.landing.heroBody}
                </p>
                <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-[#dce9e2]">
                  {dictionary.landing.heroFree}
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href={localizeHref(locale, "/try")}>
                    <Button className="h-12 min-w-40 rounded-lg bg-[#2f6e62] px-6 text-[#f7f2e8] hover:bg-[#285b51]">
                      {dictionary.landing.tryItOut}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <form action={signInWithAuth0Action}>
                    <input
                      type="hidden"
                      name="redirectTo"
                      value={localizeHref(locale, "/auth/post-login")}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-12 min-w-40 rounded-lg border-white/15 bg-white/8 px-6 text-[#f7f2e8] hover:bg-white/12"
                    >
                      {dictionary.landing.signIn}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d7d2c7] bg-[#f1eee8] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-[#6d6a64]">
              {dictionary.landing.sectionEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#231c18] sm:text-4xl">
              {dictionary.landing.sectionTitle}
            </h2>
          </div>

          <div className="space-y-5">
            {showcaseCards.map((card) => {
              const isMediaLeft = card.mediaSide === "left";

              return (
                <article
                  key={card.title}
                  className="overflow-hidden rounded-xl border border-[#d7d2c7] bg-[#fffdf8] shadow-[0_16px_36px_rgba(31,26,23,0.06)]"
                >
                  <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-stretch">
                    <div
                      className={[
                        "border-[#d7d2c7] bg-[#ece8de]",
                        isMediaLeft
                          ? "border-b lg:border-b-0 lg:border-r"
                          : "border-b lg:order-2 lg:border-b-0 lg:border-l",
                      ].join(" ")}
                    >
                      <div className="h-full p-4 sm:p-5">
                        <div className="flex h-full min-h-64 items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_rgba(232,228,219,0.94))] p-4">
                          {card.mediaType === "video" ? (
                            <video
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="h-full max-h-[24rem] w-full rounded-md object-cover shadow-[0_18px_38px_rgba(31,26,23,0.12)]"
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
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#231c18] sm:text-[2rem]">
                          {card.title}
                        </h3>
                        <p className="mt-4 text-sm leading-7 text-[#5b524b] sm:text-base">
                          {card.copy}
                        </p>
                        {card.extraImg ? (
                          <div
                            className={`hidden w-full md:mt-6 md:flex ${isMediaLeft ? "justify-end" : "justify-start"}`}
                          >
                            <Image
                              src={card.extraImg}
                              alt="Decorative illustration"
                              width={200}
                              height={200}
                              className="h-full max-h-[22rem] w-[25%] object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d7d2c7] bg-[#f1eee8] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-[11px] text-[#84786d]">
            {dictionary.landing.featuresLabel}:{" "}
            <Link
              href={localizeHref(locale, "/features/itinerary-planner")}
              className="hover:text-[#2f6e62] hover:underline"
            >
              {dictionary.landing.featureItineraryLink}
            </Link>
            {" · "}
            <Link
              href={localizeHref(locale, "/features/route-planner")}
              className="hover:text-[#2f6e62] hover:underline"
            >
              {dictionary.landing.featureRouteLink}
            </Link>
            {" · "}
            <Link
              href={localizeHref(locale, "/features/group-trip-planning")}
              className="hover:text-[#2f6e62] hover:underline"
            >
              {dictionary.landing.featureGroupLink}
            </Link>
            {" · "}
            <Link
              href={localizeHref(locale, "/features/travel-expense-tracker")}
              className="hover:text-[#2f6e62] hover:underline"
            >
              {dictionary.landing.featureExpenseLink}
            </Link>
            {" · "}
            <Link
              href={localizeHref(locale, "/features/trip-pdf-export")}
              className="hover:text-[#2f6e62] hover:underline"
            >
              {dictionary.landing.featurePdfLink}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
