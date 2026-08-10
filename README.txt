# Galaxy Teams — نسخة موقع حقيقية قابلة للنشر

## التشغيل
1. ثبّت Node.js.
2. افتح Terminal داخل المجلد.
3. نفّذ: npm install
4. عيّن كلمة مرور الإدارة:
   - Windows PowerShell: $env:ADMIN_KEY="ضع-كلمة-مرور-قوية"
   - macOS/Linux: export ADMIN_KEY="ضع-كلمة-مرور-قوية"
5. شغّل: npm start
6. افتح: http://localhost:3000

## النشر
يمكن نشر المشروع على أي استضافة Node.js مثل Render أو Railway أو VPS.
أضف Environment Variable باسم ADMIN_KEY قبل التشغيل.

## ملاحظة مهمة
قاعدة البيانات الحالية ملف data.json. هي مناسبة كبداية وتجربة، لكن في استضافة متعددة النسخ يفضّل نقل البيانات إلى PostgreSQL/Supabase.
