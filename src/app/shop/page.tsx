"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/splash-endpoints";
import Sidebar from "@/components/layout/Sidebar";

interface ShopItem {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  type: string;
  price: number;
}

interface ShopData {
  featured: ShopItem[];
  daily: ShopItem[];
  generatedAt?: string;
}

const RARITY_STYLES: Record<string, { bg: string; border: string; label: string }> = {
  common:    { bg: "from-gray-500/40 to-gray-700/60",     border: "border-gray-500/50",   label: "text-gray-300" },
  uncommon:  { bg: "from-green-600/40 to-green-900/60",   border: "border-green-500/50",  label: "text-green-300" },
  rare:      { bg: "from-blue-500/40 to-blue-900/60",     border: "border-blue-400/50",   label: "text-blue-300" },
  epic:      { bg: "from-purple-500/40 to-purple-900/60", border: "border-purple-400/50", label: "text-purple-300" },
  legendary: { bg: "from-yellow-500/40 to-orange-800/60", border: "border-yellow-400/50", label: "text-yellow-300" },
};

function getRarity(r: string) {
  return RARITY_STYLES[r?.toLowerCase()] ?? RARITY_STYLES.rare;
}

function ItemCard({ item }: { item: ShopItem }) {
  const r = getRarity(item.rarity);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl overflow-hidden border ${r.border} bg-[#080a0f] group cursor-pointer hover:scale-[1.03] transition-transform duration-200 shadow-lg`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${r.bg} opacity-80`} />
      <div className="relative">
        <div className="h-36 flex items-center justify-center p-2">
          {item.icon ? (
            <img
              src={item.icon}
              alt={item.name}
              className="h-full w-full object-contain drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
            />
          ) : (
            <ShoppingBag className="w-12 h-12 text-white/20" />
          )}
        </div>
        <div className="px-3 pb-3">
          <p className={`text-[10px] uppercase tracking-widest font-semibold ${r.label} mb-0.5`}>{item.rarity}</p>
          <h3 className="text-xs font-bold text-white leading-tight truncate">{item.name}</h3>
          <div className="mt-2 flex items-center gap-1">
            <img src="https://fortnite-api.com/images/vbuck.png" alt="V-Bucks" className="w-3.5 h-3.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-xs font-bold text-white">{item.price.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const [shop, setShop] = useState<ShopData>({ featured: [], daily: [] });
  const [loading, setLoading] = useState(true);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(endpoints.GET_SHOP);
      setShop({ featured: res.data.featured || [], daily: res.data.daily || [] });
    } catch {
      setShop({ featured: [], daily: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShop(); }, []);

  const isEmpty = shop.featured.length === 0 && shop.daily.length === 0;

  return (
    <div className="flex h-screen bg-[#05070a] text-white overflow-hidden">
      <Sidebar />
      <motion.main
        className="flex-1 flex flex-col overflow-y-auto"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Item Shop</h1>
          </div>
          <button
            onClick={fetchShop}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-64 bg-[#080a0f]/80 border border-white/10 rounded-xl">
              <ShoppingBag className="w-10 h-10 text-cyan-400 mb-3" />
              <p className="text-sm font-semibold text-white mb-1">No Items Available</p>
              <p className="text-xs text-gray-500">Check back later for new items.</p>
            </div>
          ) : (
            <>
              {shop.featured.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Featured</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {shop.featured.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
                </section>
              )}
              {shop.daily.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Daily</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
                    {shop.daily.map(item => <ItemCard key={item.id} item={item} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </motion.main>
    </div>
  );
}
