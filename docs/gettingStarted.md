# راهنمای شروع سریع

این راهنما به شما کمک می‌کند تا ویرایشگر «دبیر» را در سریع‌ترین زمان ممکن راه‌اندازی و استفاده کنید.

## ۱. نصب

در حال حاضر، ساده‌ترین راه برای استفاده از «دبیر» کپی کردن فایل‌های آن در پروژه شماست.

### دانلود مستقیم

1.  کل پروژه را از ریپازیتوری گیت‌هاب دانلود کنید.
2.  پوشه `src` و فایل `styles.css` را در پروژه خود کپی کنید.

### استفاده از CDN (در آینده)

در آینده، امکان استفاده از ویرایشگر از طریق CDN نیز فراهم خواهد شد.

## ۲. راه‌اندازی اولین ویرایشگر

برای راه‌اندازی ویرایشگر، مراحل زیر را دنبال کنید:

### مرحله ۱: ساختار فایل HTML

یک فایل HTML ساده ایجاد کنید و فایل CSS ویرایشگر را به آن اضافه کنید.

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>اولین ویرایشگر دبیر</title>
    <link rel="stylesheet" href="path/to/your/styles.css">
    <style> body { background-color: #f0f2f5; padding: 2rem; } </style>
</head>
<body>
    <div id="editor"></div>
    <script type="module">
        // کدهای جاوا اسکریپت در اینجا قرار می‌گیرد
    </script>
</body>
</html>
```

### مرحله ۲: راه‌اندازی با جاوا اسکریپت

داخل تگ `<script type="module">`، کلاس اصلی ویرایشگر را وارد (import) کرده و یک نمونه جدید از آن بسازید.

```javascript
import DabirEditor from './path/to/your/src/index.js';

document.addEventListener('DOMContentLoaded', () => {
    const editor = new DabirEditor('#editor');
    
    // اگر در یک برنامه SPA هستید، بعداً این را صدا بزنید:
    // editor.destroy();
});
```

## ۳. تنظیمات پایه

شما می‌توانید ویرایشگر را با ارسال یک آبجکت تنظیمات در هنگام ساخت، شخصی‌سازی کنید.

```javascript
new DabirEditor('#editor', {
    placeholder: 'داستان خود را اینجا بنویسید...',
    storage: {
        enabled: true, 
        key: 'my-unique-note-key'
    }
});
```

## ۴. افزودن پلاگین‌ها

«دبیر» از یک سیستم پلاگین قدرتمند برای گسترش عملکرد خود استفاده می‌کند.

```javascript
import DabirEditor from './src/index.js';
import { AdmonitionPlugin } from './src/plugins/admonitionPlugin.js';
import { ListPlugin } from './src/plugins/listPlugin.js';

document.addEventListener('DOMContentLoaded', () => {
    new DabirEditor('#editor', {
        plugins: [
            AdmonitionPlugin,
            ListPlugin
        ]
    });
});
```

## ۵. پاکسازی و مدیریت منابع (بسیار مهم)

اگر از فریم‌ورک‌هایی مثل React, Vue, Angular استفاده می‌کنید یا ویرایشگر را به صورت دینامیک ایجاد و حذف می‌کنید، **باید** هنگام حذف ویرایشگر متد `destroy()` را صدا بزنید.

```javascript
// هنگامی که دیگر به ویرایشگر نیاز نیست
editor.destroy();
```
این کار باعث می‌شود تمام Event Listener ها حذف شده و از نشت حافظه (Memory Leak) جلوگیری شود.
