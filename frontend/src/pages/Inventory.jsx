import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import AutocompleteInput from '../components/AutocompleteInput';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you certain you wish to permanently remove this item from the repository?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      alert('System Error: Unable to delete the item.');
    }
  }

  function openAddForm() {
    setEditingItem(null);
    setShowForm(true);
  }

  function openEditForm(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingItem(null);
  }

  function handleSaved() {
    closeForm();
    fetchItems();
  }

  return (
    <div className="space-y-8 animate-fade-in w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Repository</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Manage your complete inventory, track stock levels, and configure deficit thresholds.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Register New Assets
          </button>
        )}
      </div>

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="animate-slide-down w-full">
          <ItemFormInline
            item={editingItem}
            onClose={closeForm}
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* Main Data Table */}
      {!showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden w-full">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
              Inventory Overview
            </h2>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-semibold tracking-wide animate-pulse">Retrieving Inventory Data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm">
                <span className="text-4xl">📦</span>
              </div>
              <p className="text-slate-900 font-bold text-xl">The repository is currently empty.</p>
              <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Please register a new asset to begin tracking your inventory and stock levels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Item Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Count</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => {
                    const isLow = item.quantity <= item.low_stock_threshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {item.item_code || <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {item.category || <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800 font-bold">{item.quantity}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.unit}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border shadow-sm ${
                            isLow
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isLow ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-2 animate-pulse"></span>
                                Low Stock
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2"></span>
                                Optimal
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <button
                            onClick={() => openEditForm(item)}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors opacity-80 group-hover:opacity-100"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-800 transition-colors opacity-80 group-hover:opacity-100"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemFormInline({ item, onClose, onSaved }) {
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState(
  item
    ? [{
        name: item.name,
        item_code: item.item_code || '',
        category: item.category || '',
        description: item.description || '',
        quantity: item.quantity,
        unit: item.unit,
        threshold: item.low_stock_threshold,
      }]
    : [{ name: '', item_code: '', category: '', description: '', quantity: '', unit: 'pcs', threshold: 5 }]
);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products').then((res) => setProducts(res.data));
  }, []);

  const addRow = () => {
  setFormData([...formData, { name: '', item_code: '', category: '', description: '', quantity: '', unit: 'pcs', threshold: 5 }]);
};

  const removeRow = (index) => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (item) {
        const payload = {
          name: formData[0].name,
          item_code: formData[0].item_code,
          category: formData[0].category,
          description: formData[0].description,
          quantity: Number(formData[0].quantity),
          unit: formData[0].unit,
          low_stock_threshold: Number(formData[0].threshold),
    };
    await api.put(`/items/${item.id}`, payload);
  } else {
    const promises = formData.map((data) =>
      api.post('/items', {
        name: data.name,
        item_code: data.item_code,
        category: data.category,
        description: data.description,
        quantity: Number(data.quantity),
        unit: data.unit,
        low_stock_threshold: Number(data.threshold),
      })
    );
    await Promise.all(promises);
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
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-base font-semibold text-gray-800">
          {item ? 'Edit Item' : 'Add Item'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <form id="inventory-form" onSubmit={handleSubmit} className="p-5">
        {formData.map((data, index) => (
          <div
            key={index}
            className={`${formData.length > 1 ? 'border border-gray-200 rounded p-4 mb-4 relative' : 'mb-4'}`}
          >
            {!item && formData.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-sm font-medium"
                title="Remove this item"
              >
                Remove
              </button>
            )}

            {!item && (
              <p className="text-xs font-semibold text-gray-400 mb-3">Item {index + 1}</p>
            )}

            {/* Row 1: Name, Item Code, Category, Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Item Name</label>
                <AutocompleteInput
                  value={data.name}
                  onChange={(val, selectedOption) =>
                    handleChange(index, 'name', selectedOption ? selectedOption.name : val)
                  }
                  options={products}
                  getLabel={(p) => p.name}
                  placeholder="e.g. Diamond Cutter"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Item Code</label>
                <input
                  type="text"
                  value={data.item_code}
                  onChange={(e) => handleChange(index, 'item_code', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                <select
                  value={data.category}
                  onChange={(e) => handleChange(index, 'category', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="Chairs">Chairs</option>
                  <option value="Shampoo Stations">Shampoo Stations</option>
                  <option value="Facial Beds">Facial Beds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Unit</label>
                <input
                  type="text"
                  value={data.unit}
                  onChange={(e) => handleChange(index, 'unit', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="pcs, kg"
                />
              </div>
            </div>

            {/* Row 2: Item Details (full width) */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Item Details</label>
              <input
                type="text"
                value={data.description}
                onChange={(e) => handleChange(index, 'description', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about the item"
              />
            </div>

            {/* Row 3: Quantity, Low Stock Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
                <input
                  type="number"
                  value={data.quantity}
                  onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Low Stock Alert Limit</label>
                <input
                  type="number"
                  value={data.threshold}
                  onChange={(e) => handleChange(index, 'threshold', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        ))}

        {!item && (
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-2"
          >
            + Add Another Item
          </button>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200 mt-3">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 border border-gray-300 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-50"
          >
            Discard
          </button>
          <button
            type="submit"
            form="inventory-form"
            disabled={saving}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Inventory;