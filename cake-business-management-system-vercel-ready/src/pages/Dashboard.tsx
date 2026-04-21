import React, { useState } from 'react';
import { TrendingUp, DollarSign, Package, Award, Target, Edit2, Check, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppState } from '../types';
import { getRecipeItemsCost } from '../utils/costs';

interface DashboardPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ state, setState }) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(state.monthlyGoal.value.toString());

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalRevenue = state.sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
  
  const totalCost = state.sales.reduce((sum, sale) => {
    const recipe = state.recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return sum;
    const recipeCost =
      getRecipeItemsCost(recipe.ingredients, state.ingredients) +
      getRecipeItemsCost(recipe.packaging, state.ingredients);

    return sum + (recipeCost * sale.quantity);
  }, 0);

  const netProfit = totalRevenue - totalCost;
  
  // Goal calculations
  const goalProgress = Math.min((totalRevenue / state.monthlyGoal.value) * 100, 100);
  const remainingToGoal = Math.max(state.monthlyGoal.value - totalRevenue, 0);
  const isGoalReached = totalRevenue >= state.monthlyGoal.value;

  const handleSaveGoal = () => {
    const newGoal = parseFloat(tempGoal);
    if (!isNaN(newGoal) && newGoal > 0) {
      setState(prev => ({ ...prev, monthlyGoal: { value: newGoal, month: prev.monthlyGoal.month } }));
      setIsEditingGoal(false);
    }
  };

  // Sales by Flavor for the chart
  const flavorData = state.recipes.map(recipe => {
    const salesCount = state.sales
      .filter(s => s.recipeId === recipe.id)
      .reduce((sum, s) => sum + s.quantity, 0);
    return {
      name: recipe.name,
      value: salesCount
    };
  }).filter(d => d.value > 0);

  // Seller performance
  const luizaSales = state.sales.filter(s => s.seller === 'Luiza').reduce((sum, s) => sum + s.quantity, 0);
  const priscilaSales = state.sales.filter(s => s.seller === 'Priscila').reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Monthly Goal Card */}
      <div className="bg-gradient-to-br from-amber-500 via-rose-500 to-pink-500 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Meta do Mês</h3>
                <p className="text-xs text-white/80">Acompanhe seu faturamento</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              {isEditingGoal ? <Check size={18} /> : <Edit2 size={18} />}
            </button>
          </div>
        
        {isEditingGoal ? (
          <div className="space-y-3">
            <label className="text-sm text-rose-100">Defina sua meta de faturamento:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl text-slate-800 font-bold"
                placeholder="5000"
              />
              <button
                onClick={handleSaveGoal}
                className="px-4 py-2 bg-white text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-3xl font-black">R$ {formatCurrency(totalRevenue)}</div>
                <div className="text-rose-100 text-sm">de R$ {formatCurrency(state.monthlyGoal.value)}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{goalProgress.toFixed(0)}%</div>
                <div className="text-rose-100 text-xs">atingido</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-3 mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalReached ? 'bg-green-400' : 'bg-white'
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            
            {isGoalReached ? (
              <div className="flex items-center gap-2 text-green-300 text-sm font-medium">
                <TrendingUp size={16} />
                <span>Parabéns! Meta batida! 🎉</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-100 text-sm">
                <TrendingDown size={16} />
                <span>Faltam R$ {formatCurrency(remainingToGoal)} para a meta</span>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <DollarSign size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Receita</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">R$ {formatCurrency(totalRevenue)}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-3xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido</span>
          </div>
          <div className="text-2xl font-black text-blue-700">R$ {formatCurrency(netProfit)}</div>
        </div>
      </div>

      {/* Detailed Financials */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-xl">
            <DollarSign size={18} className="text-amber-600" />
          </div>
          Análise Financeira
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
            <span className="text-sm text-slate-600 font-medium">Faturamento Bruto</span>
            <span className="font-bold text-slate-800">R$ {formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
            <span className="text-sm text-rose-600 font-medium">Custos de Produção</span>
            <span className="font-bold text-rose-700">- R$ {formatCurrency(totalCost)}</span>
          </div>
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-700">Margem de Lucro</span>
            <span className={`text-xl font-black ${netProfit >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
              {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-2 bg-rose-100 rounded-xl">
            <Package size={18} className="text-rose-600" />
          </div>
          Sabores mais Vendidos
        </h3>
        <div className="h-64 w-full">
          {flavorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flavorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {flavorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f43f5e' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
              Sem dados de vendas para exibir.
            </div>
          )}
        </div>
      </div>

      {/* Competition/Partnership */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Award size={18} className="text-yellow-600" />
          </div>
          Performance do Casal
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
            <div className="text-xs font-bold text-purple-400 uppercase mb-1">Luiza</div>
            <div className="text-2xl font-black text-purple-600">{luizaSales} <span className="text-sm font-normal">un.</span></div>
          </div>
          <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 text-center">
            <div className="text-xs font-bold text-pink-400 uppercase mb-1">Priscila</div>
            <div className="text-2xl font-black text-pink-600">{priscilaSales} <span className="text-sm font-normal">un.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
