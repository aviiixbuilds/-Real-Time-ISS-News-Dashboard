import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react';

export default function NewsSection({ newsData }) {
  const { articles, isLoading, error, refreshNews } = newsData;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const filteredArticles = useMemo(() => {
    let result = articles.filter(article => {
      const search = searchTerm.toLowerCase();
      return (
        (article.title || '').toLowerCase().includes(search) ||
        (article.source?.title || '').toLowerCase().includes(search) ||
        (article.author || '').toLowerCase().includes(search)
      );
    });

    if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    } else if (sortBy === 'source') {
      result.sort((a, b) => (a.source?.title || '').localeCompare(b.source?.title || ''));
    }

    return result;
  }, [articles, searchTerm, sortBy]);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Breaking News</h2>
        <button
          onClick={refreshNews}
          className="px-4 py-1.5 bg-white dark:bg-navy-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search title, source, author..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#ff4d4d] shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none cursor-pointer min-w-[140px] shadow-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="source">Sort by Source</option>
        </select>
      </div>

      <div className="space-y-4">
        {isLoading && articles.length === 0 ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article, idx) => (
            <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-navy-900 shadow-sm transition-all hover:shadow-md">
              <div
                className="p-3 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              >
                <div className="relative shrink-0">
                  <img
                    src={article.image || 'https://via.placeholder.com/60x60?text=News'}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-[#ff4d4d] text-white text-[10px] font-bold flex items-center justify-center rounded-md border-2 border-white dark:border-navy-900 shadow-sm">
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[#3a86ff] font-bold text-[11px] uppercase tracking-wide truncate">
                      {article.source?.title || 'Unknown'}
                    </span>
                    <span className="text-gray-400 text-[10px]">{new Date(article.dateTime).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{article.title}</h4>
                </div>

                <div className="p-1 rounded bg-red-50 dark:bg-red-900/20 shrink-0">
                  {expandedIndex === idx ? <ChevronUp size={14} className="text-[#ff4d4d]" /> : <ChevronDown size={14} className="text-[#ff4d4d]" />}
                </div>
              </div>

              {expandedIndex === idx && (
                <div className="px-5 pb-5 pt-2 animate-fade-in border-t border-gray-50 dark:border-gray-800">
                  {article.image && (
                    <img src={article.image} alt="" className="w-full h-52 object-cover rounded-lg mb-4 shadow-sm" />
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {article.description || 'No description available.'}
                  </p>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff4d4d] text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                  >
                    Read More <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400 text-sm">No matching articles found.</div>
        )}
      </div>
    </div>
  );
}
