import React from 'react'

function riskFor(order) {
  const amount = Number(String(order?.amount || 0).replace(/[^0-9.-]/g, '')) || 0
  const credit = Number(String(order?.creditLimit || 0).replace(/[^0-9.-]/g, '')) || 0
  if (!credit) return 'unknown'
  if (amount > credit * 1.1) return 'severe'
  if (amount > credit * 0.9) return 'moderate'
  return 'low'
}

export default function OrderList({ orders = [], onSelect, loading = false }){
  const sorted = Array.isArray(orders) ? [...orders].sort((a,b)=> {
    const rank = r => r==='severe'?0:r==='moderate'?1:r==='low'?2:3
    return rank(riskFor(a)) - rank(riskFor(b))
  }) : []

  if (loading) return <div className="bg-white p-4 rounded shadow card-shadow">Loading…</div>

  return (
    <div className="bg-white p-4 rounded shadow card-shadow">
      <h2 className="font-medium mb-2">Orders</h2>
      <ul>
        {sorted.map(o => {
          const risk = riskFor(o)
          const rowClass = risk === 'severe' ? 'bg-red-100 hover:bg-red-200 border-red-200' : risk === 'moderate' ? 'bg-orange-100 hover:bg-orange-200 border-orange-200' : 'bg-green-100 hover:bg-green-200 border-green-200'
          const badge = risk === 'severe' ? 'bg-red-600 text-white' : risk === 'moderate' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
          return (
            <li key={o.id} className={`${rowClass} border-b py-2 cursor-pointer`} onClick={() => onSelect(o)}>
              <div className="flex justify-between items-center px-2">
                <div>
                  <div className="font-semibold">{o.customer}</div>
                  <div className="text-sm text-gray-500">Order #{o.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-sm px-2 py-1 rounded badge ${badge}`}>{risk==='unknown'?'N/A':risk}</div>
                  <div className="text-sm font-medium">{o.status}</div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
