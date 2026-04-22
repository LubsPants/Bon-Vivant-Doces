import { useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/Dashboard';
import { IngredientsPage } from './pages/Ingredients';
import { RecipesPage } from './pages/Recipes';
import { SalesPage } from './pages/Sales';
import { ProductionPage } from './pages/Production';
import { ReservationsPage } from './pages/Reservations';
import { useSupabaseAppState } from './hooks/useSupabaseAppState';

function App() {
  const { state, setState, isLoading, isConfigured, syncStatus, error } = useSupabaseAppState();
  const [activeTab, setActiveTab] = useState('dashboard');

  const syncMessage = {
    loading: 'Conectando com o sistema online...',
    ready: 'Tudo sincronizado entre os aparelhos.',
    saving: 'Salvando alteracoes...',
    error: error ?? 'Houve um problema para sincronizar agora.',
    setup_required: 'Configure o Supabase para compartilhar os dados entre os aparelhos.',
  }[syncStatus];

  const syncStyles = {
    loading: 'border-sky-200 bg-sky-50 text-sky-700',
    ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    saving: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    setup_required: 'border-slate-200 bg-slate-50 text-slate-700',
  }[syncStatus];

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
      case 'reservations':
        return <ReservationsPage state={state} setState={setState} />;
      case 'production':
        return <ProductionPage state={state} setState={setState} />;
      default:
        return <DashboardPage state={state} setState={setState} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${syncStyles}`}>
        {syncMessage}
      </div>

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
