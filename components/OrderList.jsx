import React, { useEffect, useState, useRef } from 'react'
import { fetchOrders } from '../services/orderService'

function riskFor(order) {
  const amount = Number(String(order?.amount || 0).replace(/[^0-9.-]/g, '')) || 0
  const credit = Number(String(order?.creditLimit || 0).replace(/[^0-9.-]/g, '')) || 0
  if (credit === 0) return 'unknown'
  if (amount > credit * 1.1) return 'severe'
  if (amount > credit * 0.9) return 'moderate'
  return 'low'
}

export default function OrderList({ orders: initial = [], onSelect }) {
  const [orders, setOrders] = useState(Array.isArray(initial) ? initial : [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [focused, setFocused] = useState(0)
  const listRef = useRef(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await fetchOrders({ maxRetries: 2 })
      if (!mounted) return
      if (res.ok && Array.isArray(res.data)) {
        setOrders(res.data)
      } else {
        setError(res.message || 'Service unavailable')
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  function onKeyDown(e) {
    if (!orders.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setFocused(i => Math.min(i + 1, orders.length - 1));
      listRef.current?.querySelectorAll('[role="option"]')[focused + 1]?.focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault(); setFocused(i => Math.max(i - 1, 0));
      listRef.current?.querySelectorAll('[role="option"]')[Math.max(focused - 1, 0)]?.focus()
    }
    if (e.key === 'Enter') {
      e.preventDefault(); onSelect(orders[focused])
    }
  }

  // sort orders by severity: severe -> moderate -> low -> unknown
  const sorted = Array.isArray(orders) ? [...orders].sort((a,b) => {
    const orderRank = r => r==='severe' ? 0 : r==='moderate' ? 1 : r==='low' ? 2 : 3
    return orderRank(riskFor(a)) - orderRank(riskFor(b))
  }) : []

  return (
    <div className="bg-white p-4 rounded shadow" aria-labelledby="blocked-orders">
      <h2 id="blocked-orders" className="font-medium mb-2">Blocked Orders</h2>

      {loading && (
        <div aria-busy="true">
          <div className="h-6 bg-gray-200 animate-pulse mb-2 rounded" />
          <div className="h-6 bg-gray-200 animate-pulse mb-2 rounded" />
          <div className="h-6 bg-gray-200 animate-pulse mb-2 rounded" />
        </div>
      )}

      {error && <div className="text-sm text-red-600" role="alert">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-sm text-gray-600">No blocked orders at the moment.</div>
      )}

      {!loading && Array.isArray(sorted) && sorted.length > 0 && (
        <ul ref={listRef} role="listbox" tabIndex={0} onKeyDown={onKeyDown} aria-label="Blocked orders list">
          {sorted.map((o, idx) => {
            const risk = riskFor(o)
            const badge = risk === 'severe' ? 'bg-red-600 text-white' : risk === 'moderate' ? 'bg-orange-500 text-white' : 'bg-green-600 text-white'
            return (
              <li
                key={o.id}
                role="option"
                aria-selected={idx === focused}
                tabIndex={0}
                onClick={() => onSelect(o)}
                onFocus={() => setFocused(idx)}
                className="border-b py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{o.customer || 'Unknown customer'}</div>
                    <div className="text-sm text-gray-500">Order #{o.id ?? '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm px-2 py-1 rounded ${badge}`}>{risk === 'unknown' ? 'N/A' : risk}</div>
                    <div className="text-sm text-red-500">{o.status}</div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
