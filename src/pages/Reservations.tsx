import React, { useState } from 'react';
import { Bookmark, Calendar, CheckCircle2, Trash2, User } from 'lucide-react';
import { AppState, Reservation, Sale } from '../types';

interface ReservationsPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const ReservationsPage: React.FC<ReservationsPageProps> = ({ state, setState }) => {
  const [reservationData, setReservationData] = useState({
    customerName: '',
    recipeId: '',
    seller: 'Luiza' as 'Luiza' | 'Priscila',
    quantity: 1,
  });

  const selectedReadyStock = state.readyStock.find(item => item.recipeId === reservationData.recipeId);
  const hasEnoughStock = !reservationData.recipeId
    || (selectedReadyStock ? selectedReadyStock.quantity >= reservationData.quantity : false);

  const createReservation = () => {
    if (!reservationData.customerName || !reservationData.recipeId || reservationData.quantity <= 0) {
      return;
    }

    const recipe = state.recipes.find(item => item.id === reservationData.recipeId);
    const readyStockItem = state.readyStock.find(item => item.recipeId === reservationData.recipeId);

    if (!recipe || !readyStockItem || readyStockItem.quantity < reservationData.quantity) {
      return;
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      customerName: reservationData.customerName,
      recipeId: recipe.id,
      recipeName: recipe.name,
      seller: reservationData.seller,
      date: new Date().toISOString(),
      price: recipe.salePrice,
      quantity: reservationData.quantity,
    };

    setState(prev => ({
      ...prev,
      reservations: [reservation, ...prev.reservations],
      readyStock: prev.readyStock
        .map(item =>
          item.recipeId === reservation.recipeId
            ? { ...item, quantity: Math.max(0, item.quantity - reservation.quantity) }
            : item
        )
        .filter(item => item.quantity > 0),
    }));

    setReservationData({
      customerName: '',
      recipeId: '',
      seller: reservationData.seller,
      quantity: 1,
    });
  };

  const completeReservation = (reservationId: string) => {
    setState(prev => {
      const reservation = prev.reservations.find(item => item.id === reservationId);

      if (!reservation) {
        return prev;
      }

      const sale: Sale = {
        id: crypto.randomUUID(),
        recipeId: reservation.recipeId,
        recipeName: reservation.recipeName,
        seller: reservation.seller,
        date: new Date().toISOString(),
        price: reservation.price,
        quantity: reservation.quantity,
      };

      return {
        ...prev,
        reservations: prev.reservations.filter(item => item.id !== reservationId),
        sales: [sale, ...prev.sales],
      };
    });
  };

  const cancelReservation = (reservationId: string) => {
    setState(prev => {
      const reservation = prev.reservations.find(item => item.id === reservationId);

      if (!reservation) {
        return prev;
      }

      const existingReadyStock = prev.readyStock.find(item => item.recipeId === reservation.recipeId);
      const updatedReadyStock = existingReadyStock
        ? prev.readyStock.map(item =>
            item.recipeId === reservation.recipeId
              ? { ...item, quantity: item.quantity + reservation.quantity }
              : item
          )
        : [
            ...prev.readyStock,
            {
              recipeId: reservation.recipeId,
              recipeName: reservation.recipeName,
              quantity: reservation.quantity,
            },
          ];

      return {
        ...prev,
        reservations: prev.reservations.filter(item => item.id !== reservationId),
        readyStock: updatedReadyStock,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Bookmark className="text-rose-500" />
          Nova Reserva
        </h2>
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A reserva segura o bolo no estoque, mas so entra no faturamento quando voces marcarem como retirado e pago.
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome de quem reservou</label>
            <input
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              placeholder="Ex: Maria"
              value={reservationData.customerName}
              onChange={e => setReservationData({ ...reservationData, customerName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sabor</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
              value={reservationData.recipeId}
              onChange={e => setReservationData({ ...reservationData, recipeId: e.target.value })}
            >
              <option value="">Selecione o sabor...</option>
              {state.readyStock
                .filter(item => item.quantity > 0)
                .map(item => {
                  const recipe = state.recipes.find(recipeItem => recipeItem.id === item.recipeId);

                  if (!recipe) {
                    return null;
                  }

                  return (
                    <option key={item.recipeId} value={item.recipeId}>
                      {recipe.name} • {item.quantity} em estoque
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quem fez?</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReservationData({ ...reservationData, seller: 'Luiza' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${reservationData.seller === 'Luiza' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Luiza
                </button>
                <button
                  type="button"
                  onClick={() => setReservationData({ ...reservationData, seller: 'Priscila' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${reservationData.seller === 'Priscila' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Priscila
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-400 outline-none"
                value={reservationData.quantity}
                onChange={e => setReservationData({ ...reservationData, quantity: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          {reservationData.recipeId && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${hasEnoughStock ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {hasEnoughStock
                ? `Estoque separado para essa reserva: ${selectedReadyStock?.quantity ?? 0} unidade(s) disponivel(is).`
                : `Estoque insuficiente para essa reserva. Disponivel agora: ${selectedReadyStock?.quantity ?? 0} unidade(s).`}
            </div>
          )}

          <button
            type="button"
            onClick={createReservation}
            disabled={!reservationData.customerName || !reservationData.recipeId || reservationData.quantity <= 0 || !hasEnoughStock}
            className="w-full bg-rose-500 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-md hover:bg-rose-600 transition-all"
          >
            Salvar Reserva
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-slate-800 px-2">Reservas em Aberto</h2>
        {state.reservations.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic">Nenhuma reserva registrada.</div>
        )}
        {state.reservations.map(reservation => (
          <div key={reservation.id} className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold">
                {reservation.quantity}x
              </div>
              <div>
                <div className="font-bold text-slate-700">{reservation.customerName}</div>
                <div className="text-sm text-slate-500">{reservation.recipeName}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <User size={10} /> {reservation.seller} • <Calendar size={10} /> {new Date(reservation.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="font-bold text-slate-700">R$ {(reservation.price * reservation.quantity).toFixed(2)}</div>
              <button
                type="button"
                onClick={() => completeReservation(reservation.id)}
                className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                aria-label={`Concluir reserva de ${reservation.customerName}`}
                title="Marcar como retirado e pago"
              >
                <CheckCircle2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => cancelReservation(reservation.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                aria-label={`Cancelar reserva de ${reservation.customerName}`}
                title="Cancelar reserva e devolver ao estoque"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
