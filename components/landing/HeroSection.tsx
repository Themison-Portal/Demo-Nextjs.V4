import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070')`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Smarter Workflows,{" "}
                <span className="inline-flex items-center gap-3">
                  <span className="bg-white text-black px-2 py inline-block rounded-md">
                    Faster
                  </span>
                  <span className="bg-white text-black px-2 py inline-block rounded-md">
                    Trials
                  </span>
                </span>
              </h1>
            </div>

            {/* Trusted Partners */}
          </div>

          {/* Right Column - Access Options */}
          <div className="space-y-6">
            {/* Clinical Trial Sites Access */}
            <div className="bg-white/95 backdrop-blur-sm rounded-md p-8 shadow-2xl border border-gray-200">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                    Built for
                  </p>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Clinical Trial Sites
                  </h2>
                  <p className="text-gray-600">
                    Access the main App to manage your clinical trials
                    efficiently.
                  </p>
                </div>
                <Link
                  href="#beta"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-md hover:bg-blue-800 transition-all font-semibold group"
                >
                  Request Access
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-xs text-center text-gray-500">
                  App in private beta
                </p>
              </div>
            </div>

            {/* Themison Staff Access */}
            <div className="bg-white/90 backdrop-blur-sm rounded-md p-6 shadow-xl border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Themison Members
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Exclusive access for the Themison team. Internal console for
                  organization management.
                </p>
                <Link
                  href={ROUTES.CONSOLE.SIGNIN}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-blue-800 hover:text-white transition-colors font-medium border border-gray-300"
                >
                  Staff Console
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Beta Access CTA */}
            <div className="text-center pt-4">
              <Link
                href="#beta"
                className="inline-flex items-center gap-2 text-white hover:text-cyan-400 transition-colors font-medium"
              >
                Join the Private Beta
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
