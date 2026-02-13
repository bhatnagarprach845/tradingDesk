import outputs from "../../amplify_outputs.json";

const isProd = import.meta.env.PROD;
// 1. Check if the browser URL contains "localhost"
const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// 2. Set the mode.
// If we are on localhost, we use the Python server.
// If we are NOT on localhost (or if you want to force test Amplify locally), set this accordingly.
//export const USE_AMPLIFY = !isLocalhost;
export const USE_AMPLIFY = !isLocalhost;

export const API_BASE = isProd
  ? outputs.data.url
  : "http://localhost:8080";

export async function uploadCsvFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/upload_csv`, {
        method: 'POST',
        body: fd
    });
    if(!res.ok) throw new Error('Upload failed');
    return await res.json();
}