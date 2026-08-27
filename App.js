import React, { useEffect, useState } from 'react'
import OrderList from './components/OrderList'
import OrderDetail from './components/OrderDetail'
import './index.css'

export default function App() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {
        fetch('/orders.json').then(r => r.json()).then(setOrders)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">O2C Credit-Release Cockpit</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <OrderList orders={orders} onSelect={setSelected} />
          </div>
          <div className="md:col-span-2">
            <OrderDetail order={selected} />
          </div>
        </div>
      </div>
    </div>
  )
}
