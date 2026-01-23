import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                }
            },
            '/socket.io': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                ws: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        // Ignore ECONNRESET/ECONNABORTED errors as they are common in dev during HMR/reloads
                        if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
                            console.log('proxy error', err);
                        }
                    });
                }
            }
        }
    }
})
