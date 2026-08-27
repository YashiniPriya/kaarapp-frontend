import React, { useState, useEffect } from 'react'
import { getAiSummary } from '../services/aiSummary'

function SkeletonDetail(){
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="h-6 bg-gray-200 animate-pulse mb-2 rounded" />
      <div className="h-4 bg-gray-200 animate-pulse mb-2 rounded w-1/3" />
      <div className="h-4 bg-gray-200 animate-pulse mb-2 rounded w-1/4" />
      <div className="h-24 bg-gray-200 animate-pulse rounded" />
    </div>
  )
}

export default function OrderDetail({ order }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(()=>{
    // mock customer history/invoices for demo — replace with real call as needed
    if (!order) return
    setHistory([
      { id: 'inv-100', date: '2025-12-01', amount: '5,000' },
      { id: 'inv-99', date: '2025-09-20', amount: '3,200' },
    ])
    setSummary(null)
    setError(null)
  },[order])

  if (!order) return <div className="bg-white p-4 rounded shadow" role="region" aria-label="Order details">Select an order</div>

  async function fetchSummary() {
    setLoading(true)
    setError(null)
    setSummary(null)
    const res = await getAiSummary(order, { maxRetries: 2 })
    if (res.ok) {
      setSummary(res.data)
    } else {
      setError(res.message || 'Service unavailable')
    }
    setLoading(false)
  }

  // edge-case: invalid data guard
  const amount = order?.amount ?? '—'

  return (
    <div className="bg-white p-4 rounded shadow" role="region" aria-label={`Details for order ${order.id}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-medium mb-2">Order Detail</h2>
          <div className="mb-2">Order #{order.id}</div>
          <div className="mb-2">Customer: {order.customer || 'Unknown'}</div>
          <div className="mb-2">Amount: {amount}</div>
          <div className="mb-2">Status: {order.status}</div>
        </div>
        <div>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded"
            aria-label="Release order"
            onClick={() => alert('Release action not implemented in demo')}
          >Release</button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-medium">Customer history</h3>
        {history.length === 0 ? (
          <div className="text-sm text-gray-500">No history available</div>
        ) : (
          <ul className="text-sm text-gray-700">
            {history.map(h=> (
              <li key={h.id} className="py-1">{h.date} — {h.id} — {h.amount}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={fetchSummary} disabled={loading}>
          {loading ? 'Summarizing…' : 'Get AI Summary'}
        </button>
      </div>

      {error && <div className="mt-2 text-red-600" role="alert">{error}</div>}

      {summary ? (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <div><strong>Summary:</strong> {summary.summary}</div>
          <div><strong>Validation:</strong> {summary.validationMessage}</div>
          <div><strong>Recommendations:</strong> {summary.recommendations}</div>
        </div>
      ) : loading ? (
        <SkeletonDetail />
      ) : null}
    </div>
  )
}
