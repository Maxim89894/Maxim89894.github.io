// Тесты гоняются в установленном Google Chrome, скачивать браузеры не нужно.
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'tests',
 use:{baseURL:'http://localhost:3000',channel:'chrome'},
 webServer:{command:'npx serve site -l 3000',url:'http://localhost:3000',reuseExistingServer:true},
});
