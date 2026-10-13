import Navbar from '@/components/Navbar'
import Dashboard from '@/components/Dashboard'
import { getProducts, getProductTypes, getStats } from '@/app/actions/product'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [products, types, stats] = await Promise.all([
    getProducts(),
    getProductTypes(),
    getStats(),
  ])

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || process.env.APP_VERSION || 'v1.0.0'

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col justify-between">
      <div>
        <Navbar />
        <Dashboard
          initialProducts={products}
          initialTypes={types}
          initialStats={stats}
        />
      </div>

      {/* Footer System Version */}
      <footer className="mt-16 border-t border-white/5 py-8 text-center text-xs text-white/40">
        <p>
          NexaStore Management System &middot; Version <span className="font-mono text-indigo-400 font-semibold">{appVersion}</span> &middot; Zero-Downtime High Availability &middot; Telegram Alerts
        </p>
      </footer>
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] h-[30%] w-[30%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-pink-600/5 blur-[120px]" />
      </div>
    </div>
  )
}
