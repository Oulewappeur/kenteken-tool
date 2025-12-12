import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pas 'kenteken-tool' aan naar de naam van jouw GitHub repository!
export default defineConfig({
  plugins: [react()],
  base: "/kenteken-tool/", 
})