import Link from "next/link";
import { Diamond } from "lucide-react";

interface LogoProps {
  /** Text color for "ListingLux" — defaults to navy-deep */
  textClassName?: string;
}

export default function Logo({ textClassName = "text-navy-deep" }: LogoProps) {
  return (
    <Link className="flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 outline-none" href="/" aria-label="ListingLux — Back to home">
      <Diamond className="text-gold size-7" />
      <h2
        className={`text-xl font-bold tracking-tight font-serif ${textClassName}`}
      >
        ListingLux
      </h2>
    </Link>
  );
}
