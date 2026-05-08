import axios from 'axios';

export async function getNearestPlace(lat, lon) {
  try {
    // Note: We don't set User-Agent header here as browsers block manual setting of this header.
    // Nominatim works fine from browser without it, or using the default browser UA.
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      timeout: 5000
    });
    
    if (response.data && response.data.address) {
      const addr = response.data.address;
      return addr.city || addr.town || addr.village || addr.country || "Remote area";
    }
    
    return "Over ocean / remote area";
  } catch (error) {
    console.error("Nominatim error:", error.message);
    return "Over ocean / remote area";
  }
}
