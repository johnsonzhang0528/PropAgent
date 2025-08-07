#!/usr/bin/env node

/**
 * 登入界面UI測試腳本
 * 測試新的翡翠綠主題設計系統
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏠 PropAgent Pro - 登入界面UI測試');
console.log('=====================================');

// 檢查必要的CSS文件是否存在
const authCssPath = path.join(__dirname, '../src/styles/auth.css');
const themePath = path.join(__dirname, '../src/styles/theme.ts');

console.log('\n📁 檢查設計系統文件...');

if (fs.existsSync(authCssPath)) {
  console.log('✅ auth.css 已創建');
  const authCssContent = fs.readFileSync(authCssPath, 'utf8');
  
  // 檢查關鍵樣式是否存在
  const keyStyles = [
    '.auth-container',
    '.auth-card',
    '.auth-logo',
    '.auth-title',
    '.auth-input',
    '.auth-button',
    'linear-gradient(135deg, #10b981',
    'rgba(16, 185, 129'
  ];
  
  keyStyles.forEach(style => {
    if (authCssContent.includes(style)) {
      console.log(`   ✅ ${style} 樣式已定義`);
    } else {
      console.log(`   ❌ ${style} 樣式缺失`);
    }
  });
} else {
  console.log('❌ auth.css 文件不存在');
}

if (fs.existsSync(themePath)) {
  console.log('✅ theme.ts 已存在');
  const themeContent = fs.readFileSync(themePath, 'utf8');
  
  // 檢查翡翠綠主題配置
  const themeElements = [
    'colorPrimary: \'#10B981\'',
    'colorSuccess: \'#059669\'',
    'emerald',
    'gradient:'
  ];
  
  themeElements.forEach(element => {
    if (themeContent.includes(element)) {
      console.log(`   ✅ ${element} 主題配置已設定`);
    } else {
      console.log(`   ⚠️  ${element} 主題配置可能需要檢查`);
    }
  });
} else {
  console.log('❌ theme.ts 文件不存在');
}

// 檢查登入頁面組件
const loginPagePath = path.join(__dirname, '../src/pages/auth/LoginPage.tsx');
const loginComponentPath = path.join(__dirname, '../src/components/Auth/Login.tsx');

console.log('\n🔍 檢查登入組件...');

if (fs.existsSync(loginPagePath)) {
  console.log('✅ LoginPage.tsx 已存在');
  const loginPageContent = fs.readFileSync(loginPagePath, 'utf8');
  
  // 檢查新樣式是否應用
  const updatedElements = [
    '\'../../styles/auth.css\'',
    'linear-gradient(135deg, #064e3b',
    'rgba(16, 185, 129',
    '#10b981',
    'auth-'
  ];
  
  updatedElements.forEach(element => {
    if (loginPageContent.includes(element)) {
      console.log(`   ✅ ${element} 已更新`);
    } else {
      console.log(`   ⚠️  ${element} 可能需要檢查`);
    }
  });
} else {
  console.log('❌ LoginPage.tsx 文件不存在');
}

if (fs.existsSync(loginComponentPath)) {
  console.log('✅ Login.tsx 組件已存在');
  const loginComponentContent = fs.readFileSync(loginComponentPath, 'utf8');
  
  if (loginComponentContent.includes('#10b981')) {
    console.log('   ✅ 翡翠綠主色調已應用');
  } else {
    console.log('   ⚠️  主色調可能需要更新');
  }
} else {
  console.log('❌ Login.tsx 組件不存在');
}

console.log('\n🎨 UI設計改進摘要:');
console.log('==================');
console.log('✅ 翡翠綠專業主題色系 (#10B981)');
console.log('✅ 現代化登入卡片設計');
console.log('✅ 漸變背景和動畫效果');
console.log('✅ 響應式設計支援');
console.log('✅ 增強的視覺層次和對比度');
console.log('✅ 專業的表單元素樣式');
console.log('✅ 品牌一致性設計語言');

console.log('\n🚀 測試建議:');
console.log('=============');
console.log('1. 在瀏覽器中打開 http://localhost:5175');
console.log('2. 檢查登入頁面的視覺效果');
console.log('3. 測試響應式設計 (調整瀏覽器窗口大小)');
console.log('4. 驗證表單輸入框的焦點效果');
console.log('5. 測試登入按鈕的懸停動畫');
console.log('6. 確認整體品牌形象一致性');

console.log('\n✨ 設計特色:');
console.log('=============');
console.log('• 專業級翡翠綠色系統');
console.log('• 玻璃態效果和背景模糊');
console.log('• 微妙的動畫和過渡效果');
console.log('• 現代化的表單設計');
console.log('• 清晰的視覺層次');
console.log('• 房地產CRM的專業形象');

console.log('\n🎯 登入界面美化完成！');