import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import { groupDeliveries, FollowUpCell } from './Deliveries';

// field: 'pending_items' ya 'complaint'
// Dono jagah ka data dikhata hai:
//   1) deliveries table (delivery order wale)   -> source = 'delivery'
//   2) followups table (abhi delivery nahi hui) -> source = 'followup'
function FollowUps({ field }) {
  const isComplaint = field === 'complaint';
  const title = isComplaint ? 'Complaints' : 'Pending Items';

  const [deliveries, setDeliveries] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [tab, setTab] = useState('open'); // open | resolved | all
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ customer_name: '', phone_number: '', details: '' });
  const [saving, setSaving] = useState(false);
  const [dateForId, setDateForId] = useState(null);
  const [dateValue, setDateValue] = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [dRes, fRes] = await Promise.all([
        api.get('/deliveries'),
        api.get(`/followups?type=${field}`),
      ]);
      setDeliveries(dRes.data);
      setFollowups(fRes.data);
    } catch (err) {
      console.error('System Error:', err);
    } finally {
      setLoading(false);
    }
  }

  // ---- Dono source ko ek hi shape me laao ----
  const deliveryRows = groupDeliveries(deliveries)
    .filter((o) => (o[field] || '').trim() !== '')
    .map((o) => ({
      key: `d-${o.key}`,
      source: 'delivery',
      customer_name: o.customer_name,
      phone_number: o.phone_number,
      date: o.delivery_date ? o.delivery_date.split('T')[0] : '',
      itemsText: o.items.map((i) => `${i.item_name} x${i.quantity}`).join(', '),
      text: o[field],
      resolved: Number(o[`${field}_resolved`]) === 1,
      order: o,
    }));

  const followupRows = followups.map((f) => ({
    key: `f-${f.id}`,
    source: 'followup',
    customer_name: f.customer_name,
    phone_number: f.phone_number,
    date: (f.created_at || '').split(' ')[0],
    itemsText: '',
    text: f.details,
    resolved: Number(f.resolved) === 1,
    followup: f,
  }));

  const allRows = [...deliveryRows, ...followupRows].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const openCount = allRows.filter((r) => !r.resolved).length;
  const resolvedCount = allRows.length - openCount;

  const rows = allRows.filter((r) => {
    if (tab === 'open' && r.resolved) return false;
    if (tab === 'resolved' && !r.resolved) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      return (
        r.customer_name?.toLowerCase().includes(q) ||
        r.phone_number?.toLowerCase().includes(q) ||
        r.text?.toLowerCase().includes(q) ||
        r.itemsText?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs = [
    { key: 'open', label: `Open (${openCount})` },
    { key: 'resolved', label: `Resolved (${resolvedCount})` },
    { key: 'all', label: `All (${allRows.length})` },
  ];

  // ---- Form handlers (sirf "Not Delivered Yet" wale records ke liye) ----
  function openAddForm() {
    setEditingId(null);
    setForm({ customer_name: '', phone_number: '', details: '' });
    setShowForm(true);
  }

  function openEditForm(f) {
    setEditingId(f.id);
    setForm({ customer_name: f.customer_name, phone_number: f.phone_number || '', details: f.details });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.details.trim()) {
      alert('Customer ka naam aur details zaroori hain.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/followups/${editingId}`, form);
      } else {
        await api.post('/followups', { ...form, type: field });
      }
      setShowForm(false);
      setEditingId(null);
      fetchAll();
    } catch {
      alert('Unable to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleResolved(f, deliveredDate = '') {
    const nowResolved = !(Number(f.resolved) === 1);
    try {
      await api.patch(`/followups/${f.id}`, {
        resolved: nowResolved,
        ...(field === 'pending_items' ? { pending_items_delivered_date: nowResolved ? deliveredDate : '' } : {}),
      });
      setDateForId(null);
      fetchAll();
    } catch {
      alert('Unable to update. Please try again.');
    }
  }

  async function handleDelete(f) {
    if (!window.confirm('Is record ko delete karna hai?')) return;
    try {
      await api.delete(`/followups/${f.id}`);
      fetchAll();
    } catch {
      alert('Unable to delete. Please try again.');
    }
  }

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-300 pb-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">
            Red = abhi unresolved, Green = resolve ho chuka. Delivery wale orders aur "Not Delivered Yet" dono yahan dikhte hain.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded"
          >
            + Add {isComplaint ? 'Complaint' : 'Pending Item'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded p-4 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {editingId ? 'Edit record' : `New ${isComplaint ? 'complaint' : 'pending item'}`}{' '}
            <span className="font-normal text-gray-500">(delivery abhi nahi hui)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              placeholder="Customer name *"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="Phone number"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <textarea
            rows={3}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            placeholder={isComplaint ? 'Complaint details *' : 'Pending items details *'}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="text-sm font-medium text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded text-sm font-medium border ${
                  tab === t.key
                    ? t.key === 'open'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : t.key === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, phone, item..."
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">Koi record nahi mila.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Customer</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Phone</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Date</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 border-r border-gray-200">Items</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600">{isComplaint ? 'Complaint' : 'Pending Items'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 border-r border-gray-100 align-top font-medium text-gray-800">{r.customer_name}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100 align-top text-gray-600">{r.phone_number || '-'}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100 align-top whitespace-nowrap">
                      {r.source === 'delivery' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-300">Delivery Order</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">Not Delivered Yet</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-100 align-top text-gray-600 whitespace-nowrap">{r.date || '-'}</td>
                    <td className="px-4 py-2.5 border-r border-gray-100 align-top text-gray-600 max-w-[260px]">{r.itemsText || '-'}</td>
                    <td className="px-4 py-2.5 align-top">
                      {r.source === 'delivery' ? (
                        // Delivery wale: wahi cell jo Delivery page me hai (data ek hi hai)
                        <FollowUpCell order={r.order} field={field} onSaved={fetchAll} />
                      ) : (
                        <div className="w-56 whitespace-normal">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            r.resolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {r.resolved ? 'Resolved' : 'Open'}
                          </span>
                          <div className={`mt-1 text-sm ${r.resolved ? 'text-gray-600' : 'text-red-700'}`}>{r.text}</div>
                          {field === 'pending_items' && r.resolved && r.followup.pending_items_delivered_date && (
                            <div className="mt-0.5 text-xs text-emerald-700">Delivered: {r.followup.pending_items_delivered_date}</div>
                          )}
                          {dateForId === r.followup.id ? (
                            <div className="mt-1">
                              <label className="text-xs text-gray-500">Delivered on:</label>
                              <input
                                type="date"
                                value={dateValue}
                                onChange={(e) => setDateValue(e.target.value)}
                                className="block w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <div className="flex gap-3 mt-1 text-xs font-medium">
                                <button disabled={!dateValue} onClick={() => toggleResolved(r.followup, dateValue)} className="text-emerald-600 hover:underline">Confirm</button>
                                <button onClick={() => setDateForId(null)} className="text-gray-500 hover:underline">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3 mt-1 text-xs font-medium">
                              <button
                                onClick={() => {
                                  if (field === 'pending_items' && !r.resolved) {
                                    setDateValue(new Date().toLocaleDateString('en-CA'));
                                    setDateForId(r.followup.id);
                                  } else {
                                    toggleResolved(r.followup);
                                  }
                                }}
                                className={r.resolved ? 'text-gray-500 hover:underline' : 'text-emerald-600 hover:underline'}
                              >
                                {r.resolved ? 'Reopen' : 'Mark Resolved'}
                              </button>
                              <button onClick={() => openEditForm(r.followup)} className="text-gray-500 hover:underline">Edit</button>
                              <button onClick={() => handleDelete(r.followup)} className="text-red-500 hover:underline">Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowUps;