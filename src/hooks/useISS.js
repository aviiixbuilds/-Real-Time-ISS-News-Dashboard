import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { calculateSpeed } from '../utils/haversine';
import { getNearestPlace } from '../utils/nominatim';
import toast from 'react-hot-toast';

export function useISS() {
  const [positions, setPositions] = useState([]);
  const [astros, setAstros] = useState({ number: 0, people: [] });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [nearestPlace, setNearestPlace] = useState("Loading...");
  
  // Use a ref for the fetch lock and to track state without triggering hook re-renders
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);

  const fetchISSData = useCallback(async () => {
    // Basic rate limiting: don't fetch more than once every 5 seconds
    const now = Date.now();
    if (isFetching.current || (now - lastFetchTime.current < 5000)) return false;
    
    isFetching.current = true;
    lastFetchTime.current = now;

    try {
      // Primary API: WhereTheISS.at
      const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 8000 });
      const { latitude, longitude, timestamp } = res.data;

      const newPos = { 
        lat: parseFloat(latitude), 
        lng: parseFloat(longitude), 
        timestamp: timestamp 
      };

      setPositions(prev => {
        let speed = 27600;
        if (prev.length > 0) {
          const lastPos = prev[prev.length - 1];
          const timeDiff = timestamp - lastPos.timestamp;
          if (timeDiff > 0) {
            speed = calculateSpeed(lastPos, newPos, timeDiff);
          } else {
            speed = lastPos.speed || 27600;
          }
        }
        // Requirement: last 15 for path, but we keep 50 for the chart
        return [...prev, { ...newPos, speed }].slice(-50);
      });

      // Fetch place name (optional, don't let it block)
      getNearestPlace(latitude, longitude).then(setNearestPlace).catch(() => setNearestPlace("Remote area"));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("ISS Fetch error:", error.response?.status === 429 ? "Rate limited" : error.message);
      if (error.response?.status === 429) {
        // If rate limited, wait longer
        lastFetchTime.current = now + 10000; 
      }
      return false;
    } finally {
      isFetching.current = false;
    }
  }, []); // Dependencies are empty now, so the function stays stable

  const fetchAstros = useCallback(async () => {
    try {
      const response = await axios.get('https://api.allorigins.win/get?url=' + encodeURIComponent('http://api.open-notify.org/astros.json'), { timeout: 10000 });
      const data = JSON.parse(response.data.contents);
      if (data && data.people) {
        setAstros(data);
      }
    } catch (error) {
      setAstros({
        number: 7,
        people: [
          { name: "Oleg Kononenko", craft: "ISS" },
          { name: "Nikolai Chub", craft: "ISS" },
          { name: "Tracy Dyson", craft: "ISS" },
          { name: "Matthew Dominick", craft: "ISS" },
          { name: "Mike Barratt", craft: "ISS" },
          { name: "Jeanette Epps", craft: "ISS" },
          { name: "Alexander Grebenkin", craft: "ISS" }
        ]
      });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchISSData();
    fetchAstros();
  }, [fetchISSData, fetchAstros]);

  // Polling interval
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(fetchISSData, 15000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchISSData]);

  const refreshNow = () => {
    fetchISSData().then(success => {
      if (success) toast.success("ISS telemetry updated");
      else toast.error("Too many requests. Please wait.");
    });
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
