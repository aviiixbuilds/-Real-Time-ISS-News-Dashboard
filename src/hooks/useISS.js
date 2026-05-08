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
  const isFetching = useRef(false);

  const fetchISSData = useCallback(async () => {
    if (isFetching.current) return false;
    isFetching.current = true;

    try {
      let data;
      try {
        // Try direct first (supports CORS and HTTPS)
        const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 15000 });
        data = {
          iss_position: {
            latitude: response.data.latitude,
            longitude: response.data.longitude
          },
          timestamp: response.data.timestamp
        };
      } catch (e) {
        console.warn("Direct ISS fetch failed, trying proxy...", e.message);
        // Fallback to proxy
        const PROXY = 'https://api.allorigins.win/get?url=';
        const ISS_URL = PROXY + encodeURIComponent('http://api.open-notify.org/iss-now.json');
        const response = await axios.get(ISS_URL, { timeout: 15000 });
        data = JSON.parse(response.data.contents);
      }

      const { iss_position, timestamp } = data;

      const newPos = {
        lat: parseFloat(iss_position.latitude),
        lng: parseFloat(iss_position.longitude),
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
        return [...prev, { ...newPos, speed }].slice(-50);
      });

      getNearestPlace(newPos.lat, newPos.lng)
        .then(setNearestPlace)
        .catch(() => setNearestPlace("Over ocean / remote area"));

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
      const PROXY = 'https://api.allorigins.win/get?url=';
      const ASTROS_URL = PROXY + encodeURIComponent('http://api.open-notify.org/astros.json');
      const response = await axios.get(ASTROS_URL, { timeout: 15000 });
      const data = JSON.parse(response.data.contents);
      if (data && data.people) {
        setAstros(data);
      }
    } catch {
      setAstros({
        number: 12,
        people: [
          { name: "Oleg Kononenko", craft: "ISS" },
          { name: "Nikolai Chub", craft: "ISS" },
          { name: "Tracy Caldwell Dyson", craft: "ISS" },
          { name: "Matthew Dominick", craft: "ISS" },
          { name: "Michael Barratt", craft: "ISS" },
          { name: "Jeanette Epps", craft: "ISS" },
          { name: "Alexander Grebenkin", craft: "ISS" },
          { name: "Butch Wilmore", craft: "ISS" },
          { name: "Sunita Williams", craft: "ISS" },
          { name: "Li Guangsu", craft: "Tiangong" },
          { name: "Li Cong", craft: "Tiangong" },
          { name: "Ye Guangfu", craft: "Tiangong" }
        ]
      });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
