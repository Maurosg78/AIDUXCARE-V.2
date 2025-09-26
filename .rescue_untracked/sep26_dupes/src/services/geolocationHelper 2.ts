export type Position = {
  coords: { latitude: number; longitude: number; accuracy: number };
  timestamp: number;
};

export async function getCurrentPosition(opts?: { timeoutMs?: number }): Promise<Position> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocalización no soportada"));
  }
  
  const timeout = opts?.timeoutMs ?? 10000;
  
  return new Promise<Position>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error("Timeout de geolocalización")), timeout);
    
    navigator.geolocation.getCurrentPosition(
      (p) => {
        window.clearTimeout(id);
        resolve({
          coords: {
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracy: p.coords.accuracy,
          },
          timestamp: p.timestamp,
        });
      },
      (err) => {
        window.clearTimeout(id);
        reject(new Error(err.message));
      },
      { enableHighAccuracy: false, timeout }
    );
  });
}
