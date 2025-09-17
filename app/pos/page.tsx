'use client';
import { useMemo, useState } from "react";

type Step = 0|1|2|3|4|5|6|7;
type Service = 'dine_in'|'pickup'|'delivery'|null;

type OrderItem = {
  slot: 'base'|'papas_o_sopa'|'toppings'|'drink';
  name: string;
  price: number; // MXN
};

export default function POS() {
  const [step, setStep] = useState<Step>(0);
  const [service, setService] = useState<Service>(null);
  const [deliveryZone, setDeliveryZone] = useState<'zibata'|'fuera'|null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [tipPct, setTipPct] = useState(10);
  const [customer, setCustomer] = useState({ name: '', email: '' });

  // util: NO duplicar al regresar (sustituye por slot)
  function upsertItem(next: OrderItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.slot === next.slot);
      if (idx === -1) return [...prev, next];
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }

  const subtotal = useMemo(() => items.reduce((s,i)=>s+i.price,0), [items]);

  const shipping = useMemo(() => {
    if (service !== 'delivery') return 0;
    if (deliveryZone === 'zibata') return subtotal >= 250 ? 0 : 35;
    if (deliveryZone === 'fuera') return 35;
    return 0;
  }, [service, deliveryZone, subtotal]);

  const tip = Math.round(subtotal * (tipPct / 100));
  const total = subtotal + shipping + tip;

  const next = () => setStep(s => (s < 7 ? (s+1 as Step) : s));
  const back = () => setStep(s => (s > 0 ? (s-1 as Step) : s));

  // (Temporal) orderId simple; luego lo reemplazamos por el UUID de Supabase
  const tempOrderId = useMemo(
    () => `ORD-${Date.now()}`,
    [] // se genera una vez por carga
  );

  async function pagarConMercadoPago() {
    try {
      const resp = await fetch('/api/payments/mp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: tempOrderId,          // luego: usar id real de Supabase
          title: 'Pedido Maiztros',
          totalMXN: total,
          payer: {
            name: customer.name || undefined,
            email: customer.email || undefined,
          }
        })
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url; // redirige a Mercado Pago
      } else {
        alert('No se pudo generar el link: ' + (data.error || ''));
      }
    } catch (e:any) {
      alert('Error generando el link: ' + e.message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">POS — Maiztros</h1>

      <div className="card">
        <div className="flex items-center justify-between gap-2">
          <div>Paso {step+1} / 8</div>
          <div className="space-x-2">
            {step>0 && <button onClick={back} className="px-3 py-1 rounded border border-white/20">⏪ Regresar</button>}
            {step<7 && <button onClick={next} className="px-3 py-1 rounded border border-white/20">Siguiente ⏩</button>}
          </div>
        </div>
      </div>

      {/* Paso 0: ¿Dónde consumirás? */}
      {step===0 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">¿Dónde consumirás?</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{setService('dine_in'); next();}}>
              🍽️ Comer en el local
            </button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{setService('pickup'); next();}}>
              🧧 Para llevar / Recojo
            </button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{setService('delivery'); next();}}>
              🏠 A domicilio
            </button>
          </div>
        </div>
      )}

      {/* Paso 1: Base */}
      {step===1 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">Elige tu base</h2>
          <div className="grid gap-2 md:grid-cols-3">
            {[
              {name:'Esquite Chico', price:54},
              {name:'Esquite Mediano', price:74},
              {name:'Esquite Grande', price:88},
              {name:'Construpapas', price:84},
              {name:'Obra Maestra', price:84},
              {name:'Ramaiztro', price:104},
              {name:'Don Maiztro', price:124},
            ].map((p)=>(
              <button key={p.name} className="p-4 rounded border border-white/20 text-left"
                onClick={()=>{ upsertItem({slot:'base', name:p.name, price:p.price}); next(); }}>
                <div className="font-semibold">{p.name}</div>
                <div>${p.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Papas / Maruchan / Ramen (+$24) */}
      {step===2 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">¿Papas, Maruchan o Ramen?</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'papas_o_sopa', name:'Papas (elige sabor en el siguiente paso)', price:0}); next(); }}>
              🥔 Papas
            </button>
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'papas_o_sopa', name:'Maruchan', price:0}); next(); }}>
              🍜 Maruchan
            </button>
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'papas_o_sopa', name:'Ramen (+$24)', price:24}); next(); }}>
              🍥 Ramen (+$24)
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Toppings (1=$12, 2=$17, 3+=$22) */}
      {step===3 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">Toppings</h2>
          <p className="mb-2 opacity-80">1 = $12 | 2 = $17 | 3+ = $22 (Don Maiztro: 1 gratis)</p>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'toppings', name:'1 topping', price:12}); next(); }}>
              1 topping (+$12)
            </button>
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'toppings', name:'2 toppings', price:17}); next(); }}>
              2 toppings (+$17)
            </button>
            <button className="p-4 rounded border border-white/20 text-left"
              onClick={()=>{ upsertItem({slot:'toppings', name:'3+ toppings', price:22}); next(); }}>
              3+ toppings (+$22)
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Bebidas */}
      {step===4 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">Bebidas</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{ upsertItem({slot:'drink', name:'Boing', price:29}); next(); }}>🧃 Boing $29</button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{ upsertItem({slot:'drink', name:'Coca/Var', price:27}); next(); }}>🥤 Coca $27</button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{ upsertItem({slot:'drink', name:'Schweppes', price:34}); next(); }}>🍸 Schweppes $34</button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{ upsertItem({slot:'drink', name:'Agua', price:17}); next(); }}>💧 Agua $17</button>
            <button className="p-4 rounded border border-white/20 text-left" onClick={()=>{ upsertItem({slot:'drink', name:'Sin bebida', price:0}); next(); }}>🚫 Sin bebida</button>
          </div>
        </div>
      )}

      {/* Paso 5: Entrega */}
      {step===5 && (
        <div className="card">
          <h2 className="text-xl font-medium mb-3">Entrega</h2>
          {service==='delivery' ? (
            <div className="grid gap-2 md:grid-cols-2">
              <button className="p-4 rounded border border-white/20 text-left" onClick={()=> setDeliveryZone('zibata')}>
                Zibatá — envío $0 ≥ $250; si no, +$35
              </button>
              <button className="p-4 rounded border border-white/20 text-left" onClick={()=> setDeliveryZone('fuera')}>
                Fuera de Zibatá — +$35
              </button>
            </div>
          ) : (
            <p className="opacity-80">Para {service==='pickup'?'recojo':'comer aquí'}, sin envío.</p>
          )}
        </div>
      )}

      {/* Paso 6: Cliente + Propina + Notas */}
      {step===6 && (
        <div className="card space-y-3">
          <h2 className="text-xl font-medium">Datos del cliente</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-sm opacity-70">Nombre</span>
              <input className="w-full mt-1 bg-transparent border border-white/20 rounded p-2"
                     value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})}/>
            </label>
            <label className="block">
              <span className="text-sm opacity-70">Email</span>
              <input className="w-full mt-1 bg-transparent border border-white/20 rounded p-2"
                     value={customer.email} onChange={e=>setCustomer({...customer, email:e.target.value})}/>
            </label>
          </div>

          <h3 className="text-lg font-medium">Propina sugerida</h3>
          <div className="flex gap-2">
            {[0,10,15].map(p=>(
              <button key={p} className="px-3 py-1 rounded border border-white/20"
                onClick={()=>setTipPct(p)}>
                {p}%
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-sm opacity-70">Notas</span>
            <textarea className="w-full mt-1 bg-transparent border border-white/20 rounded p-2" rows={2}
              placeholder="Sin limón, poco chile, etc."
              value={notes} onChange={e=>setNotes(e.target.value)} />
          </label>
        </div>
      )}

      {/* Paso 7: Resumen + Pago */}
      {step===7 && (
        <div className="card space-y-3">
          <h2 className="text-xl font-medium">Resumen</h2>
          <ul className="list-disc pl-5">
            {items.map(i=>(
              <li key={i.slot}><b>{i.name}</b> — ${i.price}</li>
            ))}
          </ul>
          <div className="pt-2 space-y-1">
            <div>Subtotal: ${subtotal}</div>
            <div>Envío: ${shipping}</div>
            <div>Propina: ${tip}</div>
            <div className="font-semibold">Total: ${total}</div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <a className="px-3 py-2 rounded border border-white/20"
               href={`https://wa.me/524421454605?text=${encodeURIComponent(`Pedido Maiztros\nTotal: $${total}\nNotas: ${notes || '-'}`)}`}
               target="_blank">
              📲 Enviar por WhatsApp
            </a>
            <button className="px-3 py-2 rounded border border-white/20"
              onClick={pagarConMercadoPago}>
              💳 Pagar con Mercado Pago
            </button>
          </div>
          <p className="text-xs opacity-70">OrderId temporal: {tempOrderId} (luego lo reemplazamos por el UUID real de Supabase).</p>
        </div>
      )}
    </div>
  );
}
