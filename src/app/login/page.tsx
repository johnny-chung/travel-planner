import BrandLogo from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/button";
import { signInWithAuth0Action } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <BrandLogo
              size={80}
              priority
              showLabel={false}
              iconClassName="h-20 w-20 rounded-3xl bg-white/20 p-2 shadow-xl backdrop-blur-sm"
            />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Roamer&apos;s Ledger</h1>
          <p className="text-blue-100 mt-2 text-base">Your personal travel planner</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue planning your adventures</p>

          <form action={signInWithAuth0Action}>
            <input type="hidden" name="redirectTo" value="/auth/post-login" />
            <Button type="submit" className="w-full h-12 text-base rounded-xl font-semibold bg-blue-600 hover:bg-blue-700">
              Continue with Auth0
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>
          </p>
        </div>

        <p className="text-center text-blue-100 text-sm mt-6">
          Plan • Explore • Remember
        </p>
      </div>
    </div>
  );
}
