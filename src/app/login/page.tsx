import BrandLogo from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { signInWithAuth0Action } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.16),transparent_38%),linear-gradient(180deg,rgba(247,245,240,1)_0%,rgba(239,235,228,1)_100%)] p-4 dark:bg-[radial-gradient(circle_at_top,rgba(91,143,137,0.18),transparent_30%),linear-gradient(180deg,rgba(27,24,22,1)_0%,rgba(19,17,16,1)_100%)]">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-5 flex justify-center">
            <BrandLogo
              size={80}
              priority
              showLabel={false}
              iconClassName="h-20 w-20 rounded-2xl border border-white/30 bg-white/50 p-2 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-white/10"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Roamer&apos;s Ledger</h1>
          <p className="mt-2 text-base text-muted-foreground">Your personal travel planner</p>
        </div>

        <div className="rounded-[1.6rem] border border-border/80 bg-card/95 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-1 text-2xl font-bold text-foreground">Welcome back</h2>
          <p className="mb-8 text-sm text-muted-foreground">Sign in to continue planning your adventures</p>

          <form action={signInWithAuth0Action}>
            <input type="hidden" name="redirectTo" value="/auth/post-login" />
            <Button type="submit" className="h-12 w-full rounded-xl bg-primary text-base font-semibold hover:bg-primary/90">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Plan • Explore • Remember
        </p>
      </div>
    </div>
  );
}
