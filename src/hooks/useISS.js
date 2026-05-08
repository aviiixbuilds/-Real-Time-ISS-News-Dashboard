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
      // Direct HTTPS API - No mixed content issues
      const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 10000 });
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
        return [...prev, { ...newPos, speed }].slice(-50);
      });

      // Non-blocking reverse geocode
      getNearestPlace(latitude, longitude).then(setNearestPlace).catch(() => setNearestPlace("Over ocean / remote area"));
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("ISS Fetch error:", error.message);
      return false;
    } finally {
      isFetching.current = false;
    }
  }, []); // Stable callback

  const fetchAstros = useCallback(async () => {
    try {
      const res = await axios.get('https://api.allorigins.win/get?url=' + encodeURIComponent('http://api.open-notify.org/astros.json'));
      const data = JSON.parse(res.data.contents);
      if (data && data.people) {
        setAstros(data);
      }
    } catch {
      // Robust fallback if proxy fails
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
      else toast.error("Too many requests. Please wait.");
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
