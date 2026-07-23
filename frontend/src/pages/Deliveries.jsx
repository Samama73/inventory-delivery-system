import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import AutocompleteInput from '../components/AutocompleteInput';

function groupDeliveries(deliveries) {
  const groups = {};
  for (const d of deliveries) {
    const key = d.order_id || `single-${d.id}`;
    if (!groups[key]) {
      groups[key] = {
        order_id: d.order_id || null,
        key,
        customer_name: d.customer_name,
        phone_number: d.phone_number,
        address: d.address,
        delivery_date: d.delivery_date,
        remarks: d.remarks,
        status: d.status,
        created_at: d.created_at,
        items: [],
      };
    }
    groups[key].items.push(d);
    // Agar kisi bhi item ka status pending hai to poora order pending maano
    if (d.status === 'pending') groups[key].status = 'pending';
  }
  return Object.values(groups).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => { fetchDeliveries(); }, [filter]);

  async function fetchDeliveries() {
    setLoading(true);
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      const res = await api.get(`/deliveries${query}`);
      setDeliveries(res.data);
    } catch (err) {
      console.error('System Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const orders = groupDeliveries(deliveries);

  async function toggleOrderStatus(order) {
    const newStatus = order.status === 'pending' ? 'completed' : 'pending';
    try {
      if (order.order_id) {
        await api.patch(`/deliveries/group/${order.order_id}/status`, { status: newStatus });
      } else {
        await api.patch(`/deliveries/${order.items[0].id}/status`, { status: newStatus });
      }
      fetchDeliveries();
    } catch {
      alert('Unable to update status.');
    }
  }

  async function handleDeleteOrder(order) {
    if (!window.confirm('Delete this delivery order?')) return;
    try {
      if (order.order_id) {
        await api.delete(`/deliveries/group/${order.order_id}`);
      } else {
        await api.delete(`/deliveries/${order.items[0].id}`);
      }
      fetchDeliveries();
    } catch {
      alert('Unable to delete order.');
    }
  }

  function openAddForm() { setEditingOrder(null); setShowForm(true); }
  function openEditForm(order) { setEditingOrder(order); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingOrder(null); }
  function handleSaved() { closeForm(); fetchDeliveries(); }

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-300 pb-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Deliveries</h1>
          <p className="text-sm text-gray-500">Manage delivery records and dispatch status.</p>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + New Delivery
          </button>
        )}
      </div>

      {showForm && (
        <DeliveryFormInline order={editingOrder} onClose={closeForm} onSaved={handleSaved} />
      )}

      {!showForm && (
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Delivery Records</h2>
            <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
              {filterOptions.map((f, i) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 font-medium ${i !== 0 ? 'border-l border-gray-300' : ''} ${
                    filter === f.value ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading deliveries...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">No delivery records found.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">#</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Customer</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Date</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, idx) => (
                    <tr key={order.key} onClick={() => openEditForm(order)} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-2.5 text-gray-500 border-r border-gray-100">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-gray-700 border-r border-gray-100">{order.customer_name}</td>
                      <td className="px-4 py-2.5 text-gray-600 border-r border-gray-100">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Unscheduled</span>}
                      </td>
                      <td className="px-4 py-2.5 border-r border-gray-100">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                          order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.status === 'completed' ? 'Fulfilled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleOrderStatus(order)} className="text-blue-600 hover:underline font-medium">
                          {order.status === 'pending' ? 'Complete' : 'Revert'}
                        </button>
                        <button onClick={() => openEditForm(order)} className="text-gray-600 hover:underline font-medium">Edit</button>
                        <button onClick={() => handleDeleteOrder(order)} className="text-red-600 hover:underline font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DeliveryFormInline({ order, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState(order?.customer_name || '');
  const [phoneNumber, setPhoneNumber] = useState(order?.phone_number || '');
  const [address, setAddress] = useState(order?.address || '');
  const [deliveryDate, setDeliveryDate] = useState(
    order?.delivery_date || new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState(order?.remarks || '');

  const [orderItems, setOrderItems] = useState(
    order
      ? order.items.map((it) => ({ item_name: it.item_name, quantity: it.quantity, description: it.description || '' }))
      : [{ item_name: '', quantity: '', description: '' }]
  );

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/items').then((res) => {
      const originalNames = order ? order.items.map((i) => i.item_name) : [];
      setItems(res.data.filter((i) => i.quantity > 0 || originalNames.includes(i.name)));
    });
  }, [order]);

  const addItemRow = () => {
    setOrderItems([...orderItems, { item_name: '', quantity: '', description: '' }]);
  };

  const removeItemRow = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  function getAvailableForRow(row) {
    const selected = items.find((i) => i.name === row.item_name);
    if (!selected) return null;
    const originalLine = order?.items.find((i) => i.item_name === row.item_name);
    return selected.quantity + (originalLine ? originalLine.quantity : 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      customer_name: customerName,
      phone_number: phoneNumber,
      address,
      delivery_date: deliveryDate || null,
      remarks,
      items: orderItems,
    };

    try {
      if (order && order.order_id) {
        await api.put(`/deliveries/group/${order.order_id}`, payload);
      } else if (order && !order.order_id) {
        // Purani single entry — normal update route use karo
        await api.put(`/deliveries/${order.items[0].id}`, {
          item_name: orderItems[0].item_name,
          quantity: Number(orderItems[0].quantity),
          description: orderItems[0].description,
          customer_name: customerName,
          phone_number: phoneNumber,
          address,
          delivery_date: deliveryDate || null,
          remarks,
        });
      } else {
        await api.post('/deliveries/group', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to process request.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700">{order ? 'Edit Delivery Order' : 'New Delivery'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Customer Info - Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 mb-4 border-b border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Customer</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Customer name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 9876543210"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Delivery address"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Items Section - Table Style */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Items</label>

          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200 w-10">#</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Item</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Description</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 border-r border-gray-200 w-28">Quantity</th>
                  <th className="px-3 py-2.5 font-semibold text-gray-600 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orderItems.map((row, index) => {
                  const selectedItem = items.find((i) => i.name === row.item_name);
                  const available = getAvailableForRow(row);
                  return (
                    <tr key={index}>
                      <td className="px-3 py-3 text-gray-500 border-r border-gray-100 align-middle">{index + 1}</td>
                      <td className="px-3 py-3 border-r border-gray-100 align-middle">
                        <AutocompleteInput
                          value={row.item_name}
                          onChange={(val, selectedOption) =>
                            handleItemChange(index, 'item_name', selectedOption ? selectedOption.name : val)
                          }
                          options={items}
                          getLabel={(i) => `${i.name} (Stock: ${i.quantity} ${i.unit})`}
                          placeholder="Search item..."
                          required
                          className="w-full"
                        />
                        {selectedItem && (
                          <p className="text-xs text-emerald-600 mt-1 leading-none">Available: {available} {selectedItem.unit}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 border-r border-gray-100 align-middle">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional notes"
                        />
                      </td>
                      <td className="px-3 py-3 border-r border-gray-100 align-middle">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                          min="1"
                          max={available ?? undefined}
                          required
                        />
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={addItemRow}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows="2"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200 mt-4">{error}</div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : order ? 'Save Changes' : 'Add Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Deliveries;