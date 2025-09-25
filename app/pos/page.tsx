'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Money, OrderItem, OrderPayload, Totals } from '@/types/order';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Service = OrderPayload['service'] | null;

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const pesoToMoney = (value: number): Money => ({ cents: Math.round(value * 100) });
const formatFromCents = (cents: number) => moneyFormatter.format(cents / 100);

export default function POS() {
  const [step, setStep] = useState<Step>(0);
  const [service, setService] = useState<Service>(null);
  const [deliveryZone, setDeliveryZone] = useState<'zibata' | 'fuera' | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [tipPct, setTipPct] = useState<number>(10);
  const [customer, setCustomer] = useState({ name: '', email: '' });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  function upsertItem(next: OrderItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.slot === next.slot);
      if (idx === -1) return [...prev, next];
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price.cents, 0),
    [items]
  );

  const shipping = useMemo(() => {
    if (service !== 'delivery') return 0;
    if (deliveryZone === 'zibata') return subtotal >= 25000 ? 0 : 3500;
    if (deliveryZone === 'fuera') return 3500;
    return 0;
  }, [service, deliveryZone, subtotal]);

  const tip = useMemo(() => Math.round((subtotal * tipPct) / 100), [subtotal, tipPct]);
  const total = useMemo(() => subtotal + shipping + tip, [subtotal, shipping, tip]);

  const totals: Totals = useMemo(
    () => ({
      subtotal: { cents: subtotal },
      shipping: { cents: shipping },
      tip: { cents: tip },
      total: { cents: total },
    }),
    [subtotal, shipping, tip, total]
  );

  const next = useCallback(() => {
    setStep((s) => (s < 7 ? ((s + 1) as Step) : s));
  }, []);

  const back = useCallback(() => {
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  }, []);

  const persistOrder = useCallback(async (): Promise<string> => {
    if (orderId) return orderId;
    if (!service) {
      throw new Error('Selecciona el tipo de servicio.');
    }
    if (items.length === 0) {
      throw new Error('Selecciona al menos un artículo.');
    }
    if (service === 'delivery' && !deliveryZone) {
      throw new Error('Selecciona la zona de entrega.');
    }

    const payload: OrderPayload = {
      customer: {
        name: customer.name.trim(),
        ...(customer.email.trim() ? { email: customer.email.trim() } : {}),
      },
      service,
      ...(service === 'delivery' && deliveryZone ? { deliveryZone } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      totals,
      items,
    };

    if (!payload.customer.name) {
      throw new Error('El nombre del cliente es requerido.');
    }

    setIsPersisting(true);
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const json: { id?: string; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'No se pudo crear la orden');
      }
      if (!json.id) {
        throw new Error('Respuesta sin ID de orden');
      }
      setOrderId(json.id);
      return json.id;
    } finally {
      setIsPersisting(false);
    }
  }, [customer, deliveryZone, items, notes, orderId, service, totals]);

  const pagarConMercadoPago = useCallback(async () => {
    try {
      setIsPaying(true);
      const supabaseOrderId = await persistOrder();
      const resp = await fetch('/api/payments/mp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: supabaseOrderId,
          title: 'Pedido Maiztros',
          totalMXN: totals.total.cents / 100,
          payer: {
            name: customer.name.trim() || undefined,
            email: customer.email.trim() || undefined,
          },
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No se pudo generar el link de pago');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      alert('Error en pago: ' + message);
    } finally {
      setIsPaying(false);
    }
  }, [customer.email, customer.name, persistOrder, totals.total.cents]);

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold'>POS — Maiztros</h1>

      <div className='card'>
        <div className='flex items-center justify-between gap-2'>
          <div>Paso {step + 1} / 8</div>
          <div className='space-x-2'>
            {step > 0 && (
              <button onClick={back} className='px-3 py-1 rounded border border-white/20'>
                ⏪ Regresar
              </button>
            )}
            {step < 7 && (
              <button onClick={next} className='px-3 py-1 rounded border border-white/20'>
                Siguiente ⏩
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Paso 0: ¿Dónde consumirás? */}
      {step === 0 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>¿Dónde consumirás?</h2>
          <div className='grid gap-2 md:grid-cols-3'>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                setService('dine_in');
                setDeliveryZone(null);
                next();
              }}
            >
              🍽️ Comer en el local
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                setService('pickup');
                setDeliveryZone(null);
                next();
              }}
            >
              🧧 Para llevar / Recojo
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                setService('delivery');
                setDeliveryZone(null);
                next();
              }}
            >
              🏠 A domicilio
            </button>
          </div>
        </div>
      )}

      {/* Paso 1: Base */}
      {step === 1 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>Elige tu base</h2>
          <div className='grid gap-2 md:grid-cols-3'>
            {[
              { name: 'Esquite Chico', price: 54 },
              { name: 'Esquite Mediano', price: 74 },
              { name: 'Esquite Grande', price: 88 },
              { name: 'Construpapas', price: 84 },
              { name: 'Obra Maestra', price: 84 },
              { name: 'Ramaiztro', price: 104 },
              { name: 'Don Maiztro', price: 124 },
            ].map((p) => (
              <button
                key={p.name}
                className='p-4 rounded border border-white/20 text-left'
                onClick={() => {
                  upsertItem({ slot: 'base', name: p.name, price: pesoToMoney(p.price) });
                  next();
                }}
              >
                <div className='font-semibold'>{p.name}</div>
                <div>{formatFromCents(pesoToMoney(p.price).cents)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Papas / Maruchan / Ramen (+$24) */}
      {step === 2 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>¿Papas, Maruchan o Ramen?</h2>
          <div className='grid gap-2 md:grid-cols-3'>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({
                  slot: 'papas_o_sopa',
                  name: 'Papas (elige sabor en el siguiente paso)',
                  price: pesoToMoney(0),
                });
                next();
              }}
            >
              🥔 Papas
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'papas_o_sopa', name: 'Maruchan', price: pesoToMoney(0) });
                next();
              }}
            >
              🍜 Maruchan
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'papas_o_sopa', name: 'Ramen (+$24)', price: pesoToMoney(24) });
                next();
              }}
            >
              🍥 Ramen (+$24)
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Toppings (1=$12, 2=$17, 3+=$22) */}
      {step === 3 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>Toppings</h2>
          <p className='mb-2 opacity-80'>1 = $12 | 2 = $17 | 3+ = $22 (Don Maiztro: 1 gratis)</p>
          <div className='grid gap-2 md:grid-cols-3'>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'toppings', name: '1 topping', price: pesoToMoney(12) });
                next();
              }}
            >
              1 topping (+$12)
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'toppings', name: '2 toppings', price: pesoToMoney(17) });
                next();
              }}
            >
              2 toppings (+$17)
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'toppings', name: '3+ toppings', price: pesoToMoney(22) });
                next();
              }}
            >
              3+ toppings (+$22)
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Bebidas */}
      {step === 4 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>Bebidas</h2>
          <div className='grid gap-2 md:grid-cols-3'>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'drink', name: 'Boing', price: pesoToMoney(29) });
                next();
              }}
            >
              🧃 Boing {formatFromCents(pesoToMoney(29).cents)}
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'drink', name: 'Coca/Var', price: pesoToMoney(27) });
                next();
              }}
            >
              🥤 Coca {formatFromCents(pesoToMoney(27).cents)}
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'drink', name: 'Schweppes', price: pesoToMoney(34) });
                next();
              }}
            >
              🍸 Schweppes {formatFromCents(pesoToMoney(34).cents)}
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'drink', name: 'Agua', price: pesoToMoney(17) });
                next();
              }}
            >
              💧 Agua {formatFromCents(pesoToMoney(17).cents)}
            </button>
            <button
              className='p-4 rounded border border-white/20 text-left'
              onClick={() => {
                upsertItem({ slot: 'drink', name: 'Sin bebida', price: pesoToMoney(0) });
                next();
              }}
            >
              🚫 Sin bebida
            </button>
          </div>
        </div>
      )}

      {/* Paso 5: Entrega */}
      {step === 5 && (
        <div className='card'>
          <h2 className='text-xl font-medium mb-3'>Entrega</h2>
          {service === 'delivery' ? (
            <div className='grid gap-2 md:grid-cols-2'>
              <button
                className='p-4 rounded border border-white/20 text-left'
                onClick={() => setDeliveryZone('zibata')}
              >
                Zibatá — envío $0 ≥ $250; si no, +$35
              </button>
              <button
                className='p-4 rounded border border-white/20 text-left'
                onClick={() => setDeliveryZone('fuera')}
              >
                Fuera de Zibatá — +$35
              </button>
            </div>
          ) : (
            <p className='opacity-80'>Para {service === 'pickup' ? 'recojo' : 'comer aquí'}, sin envío.</p>
          )}
        </div>
      )}

      {/* Paso 6: Cliente + Propina + Notas */}
      {step === 6 && (
        <div className='card space-y-3'>
          <h2 className='text-xl font-medium'>Datos del cliente</h2>
          <div className='grid gap-3 md:grid-cols-2'>
            <label className='block'>
              <span className='text-sm opacity-70'>Nombre</span>
              <input
                className='w-full mt-1 bg-transparent border border-white/20 rounded p-2'
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </label>
            <label className='block'>
              <span className='text-sm opacity-70'>Email</span>
              <input
                className='w-full mt-1 bg-transparent border border-white/20 rounded p-2'
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </label>
          </div>

          <h3 className='text-lg font-medium'>Propina sugerida</h3>
          <div className='flex gap-2'>
            {[0, 10, 15].map((p) => (
              <button key={p} className='px-3 py-1 rounded border border-white/20' onClick={() => setTipPct(p)}>
                {p}%
              </button>
            ))}
          </div>

          <label className='block'>
            <span className='text-sm opacity-70'>Notas</span>
            <textarea
              className='w-full mt-1 bg-transparent border border-white/20 rounded p-2'
              rows={2}
              placeholder='Sin limón, poco chile, etc.'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Paso 7: Resumen + Pago */}
      {step === 7 && (
        <div className='card space-y-3'>
          <h2 className='text-xl font-medium'>Resumen</h2>
          <ul className='list-disc pl-5'>
            {items.map((i) => (
              <li key={i.slot}>
                <b>{i.name}</b> — {formatFromCents(i.price.cents)}
              </li>
            ))}
          </ul>
          <div className='pt-2 space-y-1'>
            <div>Subtotal: {formatFromCents(subtotal)}</div>
            <div>Envío: {formatFromCents(shipping)}</div>
            <div>Propina: {formatFromCents(tip)}</div>
            <div className='font-semibold'>Total: {formatFromCents(total)}</div>
          </div>
          <div className='flex flex-wrap gap-2 pt-2'>
            <a
              className='px-3 py-2 rounded border border-white/20'
              href={`https://wa.me/524421454605?text=${encodeURIComponent(
                `Pedido Maiztros\nTotal: ${formatFromCents(total)}\nNotas: ${notes || '-'}`
              )}`}
              target='_blank'
            >
              📲 Enviar por WhatsApp
            </a>
            <button
              className='px-3 py-2 rounded border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed'
              onClick={pagarConMercadoPago}
              disabled={isPersisting || isPaying}
            >
              {isPaying ? 'Procesando…' : '💳 Pagar con Mercado Pago'}
            </button>
          </div>
          <p className='text-xs opacity-70'>
            {orderId ? `Orden creada con ID: ${orderId}` : 'La orden se generará al iniciar el pago.'}
          </p>
        </div>
      )}
    </div>
  );
}
