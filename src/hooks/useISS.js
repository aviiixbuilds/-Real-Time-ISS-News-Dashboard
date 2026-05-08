import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { calculateSpeed } from '../utils/haversine';
import { getNearestPlace } from '../utils/nominatim';
import toast from 'react-hot-toast';

// Use Vite proxy in dev for open-notify
const ISS_PROXY = import.meta.env.DEV ? '/api/iss' : 'http://api.open-notify.org';

export function useISS() {
  const [positions, setPositions] = useState([]);
  const [astros, setAstros] = useState({ number: 0, people: [] });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [nearestPlace, setNearestPlace] = useState("Loading...");
  const isFetching = useRef(false);

  const fetchISSData = useCallback(async () => {
    if (isFetching.current) return false; // prevent overlapping calls
    isFetching.current = true;

    try {
      let lat, lng, timestamp;

      // Try WhereTheISS.at first (supports HTTPS + CORS natively)
      try {
        const res = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 5000 });
        lat = res.data.latitude;
        lng = res.data.longitude;
        timestamp = Math.floor(res.data.timestamp);
      } catch {
        // Fallback to open-notify via Vite proxy
        const res = await axios.get(`${ISS_PROXY}/iss-now.json`, { timeout: 5000 });
        lat = parseFloat(res.data.iss_position.latitude);
        lng = parseFloat(res.data.iss_position.longitude);
        timestamp = res.data.timestamp;
      }

      const newPos = { lat, lng, timestamp };

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

      const place = await getNearestPlace(lat, lng);
      setNearestPlace(place);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("ISS Fetch error:", error.message);
      if (!positions.length) toast.error("Failed to fetch ISS position — retrying...");
      return false;
    } finally {
      isFetching.current = false;
    }
  }, [positions.length]);

  const fetchAstros = useCallback(async () => {
    try {
      const response = await axios.get(`${ISS_PROXY}/astros.json`, { timeout: 5000 });
      if (response.data && response.data.people) {
        setAstros(response.data);
      }
    } catch {
      console.error("Astros API unavailable, using fallback.");
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchISSData();
    fetchAstros();
  }, [fetchISSData, fetchAstros]);

  useEffect(() => {
    let interval;
    if (isAutoRefresh) {
      interval = setInterval(fetchISSData, 15000);
    }
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
