import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative px-6 py-16 lg:px-20 lg:py-24 bg-navy-deep text-white overflow-hidden">
      {/* Radial gold glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#d4af3522,transparent_70%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto grid grid-cols-2 gap-12 items-center max-lg:grid-cols-1">
        {/* Text column */}
        <div className="flex flex-col gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
            </span>
            Now supporting Luxembourgish
          </div>

          <h1 className="font-serif text-6xl font-bold leading-tight max-md:text-4xl">
            Generate Property Listings in 4 Languages —{" "}
            <span className="text-gold italic">In 5 Minutes</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
            Elevate your portfolio with professional real estate copy in German,
            French, English, and Luxembourgish. Tailored for the high-end luxury
            market with precision and speed.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/create"
              className="h-14 px-8 rounded-lg bg-gold text-navy-deep font-bold text-lg shadow-xl shadow-gold/20 hover:bg-gold/90 transition-all inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep outline-none"
            >
              Try Demo Free
            </Link>
            <Link
              href="/create"
              className="h-14 px-8 rounded-lg border border-slate-500 text-white font-bold text-lg hover:bg-white/10 transition-all inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep outline-none"
            >
              Create Your Listing
            </Link>
          </div>
        </div>

        {/* Image column */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-gold to-transparent rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-slate-800">
            <Image
              src="/images/hero-villa.jpg"
              alt="Luxury modern villa exterior with sunset lighting"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
