import React from 'react';
import { Home, Package, Utensils, ShoppingCart, ClipboardList } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'ingredients', label: 'Estoque', icon: Package },
    { id: 'recipes', label: 'Receitas', icon: Utensils },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'production', label: 'Produção', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-rose-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-amber-200 p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col justify-center items-center">
          <img 
            src="/logo-bon-vivant.png" 
            alt="Bon Vivant - Bolos no pote artesanais" 
            className="h-24 object-contain"
          />
          <p className="text-amber-700 font-medium text-sm mt-2 italic">
            ✨ A construção do nosso sonho ✨
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 p-2 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              type="button"
              key={item.id}
              aria-label={item.label}
              onClick={() => setActiveTab(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive 
                  ? 'text-rose-600 bg-rose-50' 
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-50/50'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
