import axios from 'axios';

export async function getNearestPlace(lat, lon) {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: {
        'User-Agent': 'MissionControlDashboard/1.0'
      }
    });
    
    if (response.data && (response.data.address.city || response.data.address.town || response.data.address.village || response.data.address.country)) {
      const addr = response.data.address;
      return addr.city || addr.town || addr.village || addr.country || "Remote area";
    }
    
    return "Over ocean / remote area";
  } catch (error) {
    console.error("Nominatim error:", error);
    return "Over ocean / remote area";
  }
}
