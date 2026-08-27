import React, { useState } from 'react'

async function safeParseJson(response){
  try { return await response.json() } catch (e) { try { const t = await response.text(); return JSON.parse(t) } catch (e2) { return null } }
}

export default function OrderDetail({ order, managerMode }){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [usedLocal, setUsedLocal] = useState(false)

  if (!order) return <div className="bg-white p-4 rounded shadow">Select an order</div>

  async function fetchSummary(){
    setLoading(true); setError(null); setSummary(null)
    try{
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const resp = await fetch(`${API_BASE}/api/summary`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(order) })
      if (!resp.ok){
        if (resp.status===501){ setError('AI feature not available'); setLoading(false); return }
        const b = await safeParseJson(resp) || {}
        setError(b.message || `Server ${resp.status}`)
        setLoading(false)
        return
      }
      const data = await safeParseJson(resp)
      setSummary(data)
    } catch(e){ setError('Service unavailable') }
    setLoading(false)
  }

  function localSummarizer(order){
    const amount = Number(String(order.amount||0).replace(/[^0-9.-]/g,'')) || 0
    const credit = Number(String(order.creditLimit||0).replace(/[^0-9.-]/g,'')) || 0
    const ok = credit && amount <= credit * 1.1
    const summaryText = ok ? 'Order within acceptable risk bounds (local check).' : 'Order exceeds credit threshold — manual review required.'
    return { summary: summaryText, validationMessage: ok ? 'OK' : 'BLOCKED', recommendations: ok ? 'Proceed with approval' : 'Contact credit control; consider partial release' }
  }

  async function handleRevoke(){
    if (!order || !order.id) return
    setLoading(true); setError(null)
    try{
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
      const r = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(order.id)}/revoke`, { method: 'POST' })
      if (!r.ok){ const b = await safeParseJson(r) || {}; setError(b.message || `Revoke failed ${r.status}`); setLoading(false); return }
      const b = await safeParseJson(r) || {}
      setSummary(b)
    } catch(e){ setError('Revoke request failed') }
    setLoading(false)
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-medium mb-2">Order Detail</h2>
      <div className="mb-2">Order #{order.id}</div>
      <div className="mb-2">Customer: {order.customer}</div>
      <div className="mb-2">Amount: {order.amount}</div>
      <div className="mb-2">Status: {order.status}</div>

      <div className="mt-4">
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={fetchSummary} disabled={loading}>{loading ? 'Summarizing…' : 'Get AI Summary'}</button>
        {managerMode && <button className="px-3 py-1 bg-red-600 text-white rounded ml-3" onClick={handleRevoke}>Revoke</button>}
      </div>

      {error && <div className="mt-2 text-red-600">{error}</div>}

      {summary && (
        <div className="mt-4 bg-gray-50 p-3 rounded shadow-inner">
          <div className="mb-2"><strong>Summary:</strong> {summary.summary || summary.message}</div>
          <div className="mb-1"><strong>Validation:</strong> {summary.validationMessage || summary.status}</div>
          <div className="mb-1"><strong>Recommendations:</strong> {summary.recommendations || ''}</div>
          {usedLocal && <div className="mt-2 text-sm text-gray-600">(Local fallback used)</div>}
        </div>
      )}
    </div>
  )
}
