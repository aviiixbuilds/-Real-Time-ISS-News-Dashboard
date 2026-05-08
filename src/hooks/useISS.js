import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { calculateSpeed } from '../utils/haversine';
import { getNearestPlace } from '../utils/nominatim';
import toast from 'react-hot-toast';

const POSITIONS_CACHE_KEY = 'issPositionsCache';

export function useISS() {
  const [positions, setPositions] = useState(() => {
    const cached = localStorage.getItem(POSITIONS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [astros, setAstros] = useState({ number: 0, people: [] });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [nearestPlace, setNearestPlace] = useState("Loading...");
  const isFetching = useRef(false);

  // Save to localStorage whenever positions change
  useEffect(() => {
    localStorage.setItem(POSITIONS_CACHE_KEY, JSON.stringify(positions));
  }, [positions]);

  const fetchISSData = useCallback(async () => {
    if (isFetching.current) return false;
    isFetching.current = true;

    try {
      let latitude, longitude, timestamp;

      // Primary Attempt: WhereTheISS.at (Native HTTPS)
      try {
        const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 8000 });
        latitude = res.data.latitude;
        longitude = res.data.longitude;
        timestamp = res.data.timestamp;
      } catch (err) {
        // Backup Attempt: Open-Notify via AllOrigins proxy
        const res = await axios.get('https://api.allorigins.win/get?url=' + encodeURIComponent('http://api.open-notify.org/iss-now.json'), { timeout: 8000 });
        const data = JSON.parse(res.data.contents);
        latitude = data.iss_position.latitude;
        longitude = data.iss_position.longitude;
        timestamp = data.timestamp;
      }

      const newPos = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        timestamp: timestamp
      };

      setPositions(prev => {
        let speed = 27600;
        if (prev.length > 0) {
          const lastPos = prev[prev.length - 1];
          // Ensure we don't add duplicate timestamps
          if (lastPos.timestamp === timestamp) return prev;
          
          const timeDiff = timestamp - lastPos.timestamp;
          if (timeDiff > 0) {
            speed = calculateSpeed(lastPos, newPos, timeDiff);
          } else {
            speed = lastPos.speed || 27600;
          }
        }
        
        // Keep up to 100 points for better historical context in the graph
        return [...prev, { ...newPos, speed }].slice(-100);
      });

      getNearestPlace(latitude, longitude).then(setNearestPlace).catch(() => setNearestPlace("Over ocean / remote area"));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("ISS Fetch error:", error.message);
      return false;
    } finally {
      isFetching.current = false;
    }
  }, []);

  const fetchAstros = useCallback(async () => {
    try {
      const res = await axios.get('https://api.allorigins.win/get?url=' + encodeURIComponent('http://api.open-notify.org/astros.json'));
      const data = JSON.parse(res.data.contents);
      if (data && data.people) {
        setAstros(data);
      }
    } catch {
      setAstros({ number: 0, people: [] });
    }
  }, []);

  useEffect(() => {
    fetchISSData();
    fetchAstros();
  }, [fetchISSData, fetchAstros]);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(fetchISSData, 15000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchISSData]);

  const refreshNow = () => {
    fetchISSData().then(success => {
      if (success) toast.success("ISS data refreshed");
    });
    fetchAstros();
  };

  return {
    positions,
    currentPos: positions[positions.length - 1] || null,
    astros,
    isAutoRefresh,
    setIsAutoRefresh,
    isLoading,
    nearestPlace,
    refreshNow
  };
}
