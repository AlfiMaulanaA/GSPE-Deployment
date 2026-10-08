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

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <Dashboard
        initialProducts={products}
        initialTypes={types}
        initialStats={stats}
      />
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] h-[30%] w-[30%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[50%] w-[50%] rounded-full bg-pink-600/5 blur-[120px]" />
      </div>
    </div>
  )
}
