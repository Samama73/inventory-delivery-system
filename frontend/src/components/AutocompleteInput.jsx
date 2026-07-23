import { useState, useRef, useEffect } from 'react';

function AutocompleteInput({ value, onChange, options, placeholder, getLabel, required }) {
  const [query, setQuery] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function updateDropdownPosition() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }

  const filtered = query
    ? options.filter((opt) =>
        getLabel(opt).toLowerCase().includes(query.toLowerCase())
      )
    : options;

  function handleSelect(opt) {
    const label = getLabel(opt);
    setQuery(label);
    onChange(label, opt);
    setShowSuggestions(false);
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null);
    setShowSuggestions(true);
    updateDropdownPosition();
  }

  function handleFocus() {
    updateDropdownPosition();
    setShowSuggestions(true);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        required={required}
        autoComplete="off"
      />

      {showSuggestions && filtered.length > 0 && (
        <ul
          style={{ ...dropdownStyle, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((opt, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(opt)}
              className="px-4 py-2 text-sm text-gray-800 hover:bg-indigo-50 cursor-pointer"
            >
              {getLabel(opt)}
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && query && filtered.length === 0 && (
        <div
          style={{ ...dropdownStyle, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-400"
        >
          No matching items found
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;