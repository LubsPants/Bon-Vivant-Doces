import { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { IngredientsPage } from './pages/Ingredients';
import { RecipesPage } from './pages/Recipes';
import { SalesPage } from './pages/Sales';
import { ProductionPage } from './pages/Production';
import { useSupabaseAppState } from './hooks/useSupabaseAppState';

function App() {
  const { state, setState, isLoading, isConfigured } = useSupabaseAppState();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage state={state} setState={setState} />;
      case 'ingredients':
        return <IngredientsPage state={state} setState={setState} />;
      case 'recipes':
        return <RecipesPage state={state} setState={setState} />;
      case 'sales':
        return <SalesPage state={state} setState={setState} />;
      case 'production':
        return <ProductionPage state={state} setState={setState} />;
      default:
        return <DashboardPage state={state} setState={setState} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {!isConfigured ? (
        <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-3">
          <h2 className="text-xl font-bold text-slate-800">Conectar com o Supabase</h2>
          <p className="text-slate-600">
            Falta configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no projeto e na Vercel.
          </p>
          <p className="text-sm text-slate-500">
            Depois disso, o app passa a salvar os dados online em vez de usar o navegador.
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-600">Carregando dados do sistema...</p>
        </div>
      ) : (
        renderContent()
      )}
    </Layout>
  );
}

export default App;
