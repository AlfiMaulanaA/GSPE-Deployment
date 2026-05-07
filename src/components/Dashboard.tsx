'use client'

import React, { useState } from 'react'
import { Plus, Search, Filter, Loader2, PackageSearch } from 'lucide-react'
import ProductCard from './ProductCard'
import ProductForm from './ProductForm'
import { deleteProduct } from '@/app/actions/product'
import { motion } from 'framer-motion'

interface DashboardProps {
  initialProducts: any[]
}

export default function Dashboard({ initialProducts }: DashboardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const handleEdit = (id: string) => {
    const product = initialProducts.find(p => p.id === id)
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  return (
    <main className="container mx-auto min-h-[calc(100vh-80px)] p-6 pb-20">
      {/* Header Section */}
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-4xl font-black text-white">Product Catalog</h2>
          <p className="text-white/40">Manage your inventory, prices, and stock levels.</p>
        </div>
        
        <button 
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Toolbar Section */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-white/30" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 text-white"
          />
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Grid Section */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-white/20">
            <PackageSearch size={40} />
          </div>
          <h3 className="text-xl font-bold text-white">No products found</h3>
          <p className="text-white/40">Try adjusting your search or add a new product to get started.</p>
        </motion.div>
      )}

      {/* Modal Form */}
      <ProductForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        product={editingProduct}
      />
    </main>
  )
}
