"use client"

import { useState, useEffect } from "react"
import { deleteProduct, getProducts, getStats, getProductTypes } from "@/app/actions/product"
import ProductForm from "./ProductForm"
import { Plus, Edit2, Trash2 } from 'lucide-react'

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

  // State untuk Modal Form
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id)
      refreshData()
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
    refreshData()
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
          <p className="text-white/60">by Alfi Maulana DevOps Engineer</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>New Product</span>
        </button>
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

      {/* Product List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Product Inventory</h2>
          <span className="text-white/40 text-sm">{products.length} Items Found</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
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

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-lg font-bold text-white block">Rp {p.price.toLocaleString()}</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-tighter">Current Price</span>
                </div>

                <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-2 text-white/20 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                    title="Edit Product"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete Product"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-20 glass rounded-3xl border border-white/5">
              <p className="text-white/40">No products found. Start by adding one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        product={editingProduct}
        types={types}
      />
    </div>
  )
}
