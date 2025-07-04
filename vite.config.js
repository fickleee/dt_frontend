import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  let env = loadEnv(mode, process.cwd())
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src',
          import.meta.url)),
      },
    },
    //代理跨域
    server: {
      proxy: {
        [env.VITE_APP_BASE_API]: {
          //获取数据的服务器地址设置
          target: env.VITE_SERVE,
          //需要代理跨域
          changeOrigin: true,
          //路径重写
          // rewrite: (path) => (path.replace(/^\/api/, '')+'/api/'),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler" // or 'modern'
        }
      }
    }
  }
})
