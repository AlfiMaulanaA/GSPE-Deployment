'use client'

import React, { useState } from 'react'
import { X, Save, Box, DollarSign, List, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createProduct, updateProduct } from '@/app/actions/product'

interface ProductFormProps {
  product?: any
  isOpen: boolean
  onClose: () => void
}

export default function ProductForm({ product, isOpen, onClose }: ProductFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    
    if (product) {
      await updateProduct(product.id, formData)
    } else {
      await createProduct(formData)
    }
    
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white">
                {product ? 'Edit Product' : 'New Product'}
              </h2>
              <button 
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Product Name</label>
                    <div className="relative">
                      <Box className="absolute left-4 top-3.5 text-white/20" size={18} />
                      <input 
                        name="name" 
                        defaultValue={product?.name}
                        placeholder="e.g. Premium Mechanical Keyboard" 
                        required 
                        className="input-field pl-12 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Description</label>
                    <textarea 
                      name="description" 
                      defaultValue={product?.description}
                      placeholder="Describe your product in detail..." 
                      rows={3}
                      className="input-field text-white"
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 text-white/20" size={18} />
                    <input 
                      name="price" 
                      type="number" 
                      step="0.01"
                      defaultValue={product?.price}
                      placeholder="0.00" 
                      required 
                      className="input-field pl-12 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Inventory Stock</label>
                  <div className="relative">
                    <Box className="absolute left-4 top-3.5 text-white/20" size={18} />
                    <input 
                      name="stock" 
                      type="number" 
                      defaultValue={product?.stock}
                      placeholder="0" 
                      required 
                      className="input-field pl-12 text-white"
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Category</label>
                  <div className="relative">
                    <List className="absolute left-4 top-3.5 text-white/20" size={18} />
                    <input 
                      name="category" 
                      defaultValue={product?.category}
                      placeholder="e.g. Electronics" 
                      className="input-field pl-12 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-3.5 text-white/20" size={18} />
                    <input 
                      name="image" 
                      defaultValue={product?.image}
                      placeholder="https://images.unsplash.com/..." 
                      className="input-field pl-12 text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-10 flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-white/5 py-4 font-bold text-white transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary flex-[2] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      <Save size={18} />
                      <span>{product ? 'Update Product' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
