import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: './',

  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    port: 5173,
    proxy: {
      // 把所有 /api 开头的请求代理到后端
      '/api': {
        target: 'http://localhost:31173',   // 你的后端地址
        changeOrigin: true,                 // 必须，修改请求头中的 Origin
        rewrite: (path) => path.replace(/^\/api/, '/api'), // 可根据需要调整
        // 如果后端需要支持其他方法，可以加以下配置
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 可选：添加额外的 header
          })
        }
      }
    }
  }
})
