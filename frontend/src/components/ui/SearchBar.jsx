import { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { businessAPI } from '../../api';
import { useDebounce } from '../../hooks/useDebounce';

export default function SearchBar({ className, placeholder = 'Search businesses, services...' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const { data } = await businessAPI.getSuggestions(debouncedQuery);
        setSuggestions(data.suggestions || []);
        setIsOpen(true);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClick = (e) => { if (!ref.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/businesses?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleSelect = (business) => {
    navigate(`/businesses/${business._id}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm shadow-sm"
            aria-label="Search businesses"
            id="main-search"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
              className="absolute right-4 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-slide-up">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((biz) => (
                <li key={biz._id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(biz)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                  >
                    {biz['images.logo'] || biz.images?.logo ? (
                      <img src={biz['images.logo'] || biz.images?.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{biz.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
