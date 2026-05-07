import React from 'react'
import { Package2 } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
            <Package2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">NEXA<span className="text-indigo-400">STORE</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Management System</p>
          </div>
        </div>
        
        <div className="hidden items-center gap-8 md:flex">
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Products</a>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Inventory</a>
          <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Analytics</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 p-[1px]">
            <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
              <span className="text-[10px] font-bold">JD</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
