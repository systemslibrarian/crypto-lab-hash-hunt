import { defineConfig } from '@playwright/test';
const PORT = 4225;
const url = 'http://127.0.0.1:' + PORT + '/crypto-lab-hash-hunt/';
export default defineConfig({testDir:'./e2e',forbidOnly:!!process.env.CI,retries:0,workers:1,timeout:60000,reporter:'list',use:{baseURL:url,colorScheme:'dark'},webServer:{command:'npm run build && npm run preview -- --host 127.0.0.1 --port '+PORT+' --strictPort',url,reuseExistingServer:false,timeout:120000}});
