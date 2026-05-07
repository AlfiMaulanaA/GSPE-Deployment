"use client"

import { useState, useEffect } from "react"
import { createProduct, deleteProduct, getProducts, getStats, getProductTypes } from "@/app/actions/product"

export default function Dashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    totalValue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    setLoading(true)
    const [productsData, statsData, typesData] = await Promise.all([
      getProducts(),
      getStats(),
      getProductTypes()
    ])
    setProducts(productsData)
    setStats(statsData)
    setTypes(typesData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await createProduct(formData)
    e.currentTarget.reset()
    refreshData()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await deleteProduct(id)
      refreshData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GSPE Product Dashboard</h1>
          <p className="text-white/60">Manage your industrial inventory with style.</p>
        </div>
        <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
          <span className="text-white font-bold">GS</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Products", value: stats.totalProducts, color: "bg-blue-500" },
          { label: "Out of Stock", value: stats.outOfStock, color: "bg-red-500" },
          { label: "Low Stock", value: stats.lowStock, color: "bg-amber-500" },
          { label: "Total Value", value: `Rp ${stats.totalValue.toLocaleString()}`, color: "bg-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border border-white/10 flex flex-col justify-between group hover:scale-105 transition-transform cursor-default">
            <span className="text-white/50 text-sm font-medium">{stat.label}</span>
            <span className="text-2xl font-bold text-white mt-2">{stat.value}</span>
            <div className={`h-1 w-full ${stat.color} mt-4 rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add Product */}
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl h-fit">
          <h2 className="text-xl font-semibold mb-6 text-white">Add New Product</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Product Name</label>
              <input name="name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="e.g. Nexabrick CM4" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Type</label>
              <select name="typeId" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                <option value="" className="bg-slate-900">Select Type</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Price (Rp)</label>
                <input name="price" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1">Stock</label>
                <input name="stock" type="number" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Description</label>
              <textarea name="description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24" placeholder="Brief description..."></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95">
              Add Product
            </button>
          </form>
        </div>

        {/* Product List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Product Inventory</h2>
            <span className="text-white/40 text-sm">{products.length} Items</span>
          </div>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map((p) => (
              <div key={p.id} className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/5 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {p.type?.name === 'Hardware' ? '🏗️' : p.type?.name === 'Software' ? '💻' : '⚙️'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">{p.type?.name}</span>
                      <span className="text-white/40 text-xs">{p.stock} units in stock</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <span className="text-lg font-bold text-white">Rp {p.price.toLocaleString()}</span>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 000-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
