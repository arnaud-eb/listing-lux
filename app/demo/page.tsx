import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f7] flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="text-5xl mb-6">🏡</div>
        <h1 className="font-serif text-3xl font-bold text-[#1a2332] mb-4">
          Demo Coming Soon
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We&apos;re preparing a pre-loaded demo with sample Luxembourg property listings.
          In the meantime, try creating your own listing.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/">← Back to Home</Link>
          </Button>
          <Button asChild className="bg-[#C5A059] text-white hover:bg-[#C5A059]/90 border-0">
            <Link href="/create">Create a Listing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
