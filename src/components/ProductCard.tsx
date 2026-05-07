'use client'

import React from 'react'
import { Edit2, Trash2, Tag, Box, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProductProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    stock: number
    category: string | null
    image: string | null
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function ProductCard({ product, onEdit, onDelete }: ProductProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card group overflow-hidden"
    >
      <div className="relative h-48 w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
        ) : (
          <Box size={64} className="text-white/20 group-hover:text-indigo-400/40 transition-colors" />
        )}
        <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button 
            onClick={() => onEdit(product.id)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-indigo-600 transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(product.id)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-600 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20">
            <Tag size={10} /> {product.category || 'Uncategorized'}
          </span>
          <span className="text-xs text-white/40 italic"># {product.id.slice(-6)}</span>
        </div>
        
        <h3 className="mb-1 text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{product.name}</h3>
        <p className="mb-6 line-clamp-2 text-sm text-white/50">{product.description || 'No description provided.'}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-white/30 tracking-widest font-bold">Price</span>
            <div className="flex items-center gap-1 text-xl font-black text-white">
              <DollarSign size={16} className="text-emerald-400" />
              <span>{product.price.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase text-white/30 tracking-widest font-bold">In Stock</span>
            <span className={`text-sm font-bold ${product.stock > 10 ? 'text-white' : 'text-amber-400'}`}>
              {product.stock} units
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
