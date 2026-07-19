const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Status check failed with ${res.status}`);
  }
  return res.json();
}

export async function clearSession() {
  const res = await fetch(`${API_BASE}/status`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Session clear failed with ${res.status}`);
  }
  return res.json();
}
