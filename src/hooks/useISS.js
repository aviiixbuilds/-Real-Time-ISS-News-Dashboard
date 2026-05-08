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
      // Using WhereTheISS.at API which supports HTTPS and CORS (unlike open-notify)
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

      const place = await getNearestPlace(latitude, longitude);
      setNearestPlace(place);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("ISS Fetch error:", error.message);
      // Only show toast error if we have no data at all
      return false;
    } finally {
      isFetching.current = false;
    }
  }, []);

  const fetchAstros = useCallback(async () => {
    try {
      // open-notify doesn't support HTTPS well. We try with a CORS proxy or direct HTTP (might be blocked)
      // For Vercel (HTTPS), we use a public proxy if needed, or stick to fallback if blocked.
      const response = await axios.get('https://api.allorigins.win/get?url=' + encodeURIComponent('http://api.open-notify.org/astros.json'), { timeout: 10000 });
      const data = JSON.parse(response.data.contents);
      if (data && data.people) {
        setAstros(data);
      }
    } catch (error) {
      console.error("Astros API error, using fallback.");
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
