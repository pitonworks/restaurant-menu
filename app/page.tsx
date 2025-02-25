import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Restaurant Menu',
  description: 'Welcome to our restaurant menu',
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Our Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Menu items will be dynamically loaded here */}
      </div>
    </div>
  )
} 