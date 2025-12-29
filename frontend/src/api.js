export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
export async function uploadCsvFile(file){
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/upload_csv`, {
        method: 'POST',
        body: fd
    })
    if(!res.ok) throw new Error('Upload failed')
    return await res.json()
}
export async function getResults(id){
    const res = await fetch(`${API_BASE}/results/${id}`)
    if(!res.ok) throw new Error('Results fetch failed')
    return await res.json()
}