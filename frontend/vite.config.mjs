import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    // Standard root path for Amplify hosting
    base: '/',
    server: {
        port: 5173,
    },
    build: {
        // Ensure this matches the 'baseDirectory' in your amplify.yml
        outDir: 'deploy-dist',
        // Recommended for clean builds on Amplify
        emptyOutDir: true,
    }
})