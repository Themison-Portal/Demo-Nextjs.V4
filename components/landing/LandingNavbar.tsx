import Link from "next/link";
import Image from "next/image";

export function LandingNavbar() {
  return (
    <nav className="fixed top-4 left-[25%] right-0 z-50 bg-white/30 backdrop-blur-md w-[50%] rounded-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="https://www.themison.com/"
              className="flex items-center space-x-2"
            >
              <Image
                src="/logo.svg"
                alt="THEMISON"
                width={120}
                height={32}
                className="h-8 w-[60%] filter grayscale contrast-250"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="https://www.themison.com/contact"
              className="hidden sm:inline-flex px-4 py-2 bg-black text-white rounded-md hover:bg-blue-800 transition-colors font-medium text-sm"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
