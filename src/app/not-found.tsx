import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mb-6">
        <MapPin className="w-10 h-10 text-blue-400" />
      </div>

      <p className="text-6xl font-bold text-gray-200 mb-2">404</p>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
        The page you&apos;re looking for doesn&apos;t exist, or you may not have access to it.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
