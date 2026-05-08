import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export function useNews() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    
    if (!force) {
      const cached = localStorage.getItem(NEWS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setArticles(data);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      if (!apiKey) {
        throw new Error("News API Key missing");
      }
      
      // Using NewsData.io Latest endpoint
      const response = await axios.get(`https://newsdata.io/api/1/latest?apikey=${apiKey}`);
      
      if (response.data && response.data.results) {
        // Map NewsData.io response to internal format
        const mappedArticles = response.data.results.slice(0, 10).map(article => ({
          uri: article.article_id || article.link,
          link: article.link,
          title: article.title,
          description: article.description,
          image: article.image_url,
          source: { title: article.source_id },
          dateTime: article.pubDate,
          location: article.country ? { label: { eng: article.country.join(', ') } } : null
        }));

        setArticles(mappedArticles);
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
          data: mappedArticles,
          timestamp: Date.now()
        }));
        if (force) toast.success("News refreshed");
      } else {
        throw new Error("Invalid news data structure");
      }
    } catch (err) {
      console.error("News fetch error:", err);
      setError(err.message);
      toast.error("Failed to fetch news intelligence");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNews();
  }, [fetchNews]);

  return { articles, isLoading, error, refreshNews: () => fetchNews(true) };
}
