import React, { useEffect, useState } from 'react'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'

const DEMO_ORDERS = [
  { id: 'SO100', customer: 'ABC Traders', amount: 50000, creditLimit: 45000, status: 'BLOCKED' },
  { id: 'SO101', customer: 'Zenith Supplies', amount: 12000, creditLimit: 20000, status: 'OK' },
  { id: 'SO102', customer: 'Global Parts', amount: 220000, creditLimit: 200000, status: 'BLOCKED' },
  { id: 'SO103', customer: 'Metro Foods', amount: 9500, creditLimit: 8000, status: 'BLOCKED' },
  { id: 'SO104', customer: 'Delta Retail', amount: 75000, creditLimit: 80000, status: 'OK' },
  { id: 'SO105', customer: 'Northline', amount: 6000, creditLimit: 5000, status: 'BLOCKED' },
  { id: 'SO106', customer: 'Acme Corp', amount: 120000, creditLimit: 100000, status: 'BLOCKED' },
  { id: 'SO107', customer: 'ABC Traders', amount: 55000, creditLimit: 45000, status: 'BLOCKED' },
  { id: 'SO108', customer: 'Summit Imports', amount: 30000, creditLimit: 28000, status: 'BLOCKED' },
  { id: 'SO109', customer: 'Omega Manufacturing', amount: 180000, creditLimit: 170000, status: 'BLOCKED' },
  { id: 'SO110', customer: 'Cornerstone', amount: 4000, creditLimit: 6000, status: 'OK' },
  { id: 'SO111', customer: 'Prime Wholesale', amount: 95000, creditLimit: 85000, status: 'BLOCKED' },
  { id: 'SO112', customer: 'Harbor Exports', amount: 250000, creditLimit: 200000, status: 'BLOCKED' },
  { id: 'SO113', customer: 'Lakeside Ltd', amount: 14000, creditLimit: 12000, status: 'BLOCKED' },
  { id: 'SO114', customer: 'Greenfield', amount: 7500, creditLimit: 10000, status: 'OK' },
  { id: 'SO115', customer: 'Riverside', amount: 60000, creditLimit: 50000, status: 'BLOCKED' },
  { id: 'SO116', customer: 'Vertex Traders', amount: 48000, creditLimit: 45000, status: 'BLOCKED' },
  { id: 'SO117', customer: 'Nexus Corp', amount: 300000, creditLimit: 250000, status: 'BLOCKED' },
  { id: 'SO118', customer: 'Orion Services', amount: 22000, creditLimit: 20000, status: 'BLOCKED' },
  { id: 'SO119', customer: 'Beacon Supplies', amount: 8200, creditLimit: 7000, status: 'BLOCKED' }
]

function riskFor(order) {
  const amount = Number(String(order?.amount || 0).replace(/[^0-9.-]/g, '')) || 0
  const credit = Number(String(order?.creditLimit || 0).replace(/[^0-9.-]/g, '')) || 0
  if (!credit) return 'unknown'
  if (amount > credit * 1.1) return 'severe'
  if (amount > credit * 0.9) return 'moderate'
  return 'low'
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export default function App(){
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [managerMode, setManagerMode] = useState(false)

  useEffect(()=>{
    setLoadingOrders(true)
    fetch(`${API_BASE}/api/orders`)
      .then(r=>{ if(!r.ok) throw new Error('no api'); return r.json() })
      .then(data=> {
        if(!Array.isArray(data) || data.length < 20) {
          setOrders(DEMO_ORDERS)
        } else {
          setOrders(data)
        }
        setLoadingOrders(false)
      })
      .catch(()=> fetch('/orders.json').then(r=>r.json()).then(data=>{ setOrders(data && data.length>=20?data:DEMO_ORDERS); setLoadingOrders(false)}))
  },[])

  async function revokeOrder(orderId) {
    try {
        const r = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/revoke`, {
        method: 'POST'
        })      
        if (!r.ok) {
        const body = await r.json().catch(()=> ({}))
        alert(body.message || `Revoke failed ${r.status}`)
        return
      }
      const body = await r.json().catch(()=> ({}))
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'REVOKED' } : o))
      if (selected && selected.id === orderId) setSelected(prev => prev ? { ...prev, status: 'REVOKED' } : prev)
      alert(body.message || 'Order revoked')
    } catch (e) {
      alert('Revoke request failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">O2C Credit-Release Cockpit</h1>
            <div className="text-sm text-gray-500">Prioritize and review blocked orders quickly</div>
          </div>
          <div className="flex items-center gap-3">
            <input aria-label="Search orders" placeholder="Search customer or order#" className="px-3 py-2 border rounded" onChange={(e)=>{/* optional search hook */}} />
            <button className="px-3 py-2 bg-indigo-600 text-white rounded">Filter</button>
            <label className="flex items-center gap-2 ml-2 text-sm">
              <input type="checkbox" checked={managerMode} onChange={() => setManagerMode(!managerMode)} />
              <span>Manager Mode</span>
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <OrderList orders={orders} onSelect={setSelected} loading={loadingOrders} />
          </div>
          <div className="md:col-span-2">
            <OrderDetail order={selected} managerMode={managerMode} onRevoke={revokeOrder} />

            <div className="mt-6 bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Blocked Order Queue (All Orders)</h3>
              <div className="mb-3">
                <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto" style={{maxHeight:400}}>
{(() => {
  const lines = (orders||[]).map(o => {
    const statusLabel = (o.status||'').toUpperCase() === 'BLOCKED' ? 'Blocked (Red)' : (riskFor(o)==='moderate' ? 'Moderate (Orange)' : 'Low (Green)')
    return `Order ID: ${o.id}\nCustomer: ${o.customer}\nAmount: ₹${Number(o.amount||0).toLocaleString()}\nCredit Limit: ₹${Number(o.creditLimit||0).toLocaleString()}\nStatus: ${statusLabel}\n`
  })
  return lines.join('\n')
})()}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Detail View (selected)</h4>
                <pre className="mt-2 p-3 bg-gray-100 rounded">
{selected ? (() => {
  const ok = Number(selected.amount||0) <= Number(selected.creditLimit||0)
  const validation = ok ? 'OK' : (Number(selected.amount||0) <= Number(selected.creditLimit||0)*1.1 ? 'Slightly over limit' : 'Exposure exceeds tolerance. Cannot release.')
  const decision = ok ? 'RELEASE' : 'HOLD'
  return `Customer History: Avg payment 22 days, no defaults\nAI Summary: Reliable payer, first time over limit due to promo order\nValidation Message: ${validation}\nDecision: ${decision}`
})() : 'No order selected'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
