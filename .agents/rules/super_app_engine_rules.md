# نظام القواعد والتوجيهات الهندسية للمشروع الشامل (Super App Engine Rules)

## 1. سياق وهندسة المشروع (Project Context & Tech Stack)
* **Frontend:** Flutter (Dart) / Next.js (React 18) مع دعم أصيل للغة العربية والاتجاه من اليمين لليسار (`RTL Native`).
* **Backend:** Node.js/TypeScript (Next.js API Routes / Express / NestJS) أو Python (FastAPI).
* **Database:** PostgreSQL / Supabase (تفعيل إضافة `pgcrypto` والوظائف المخزنة `Stored Procedures & Triggers`).
* **القطاعات الأساسية:**
  1. الخدمات الميدانية والحرفيين (On-Demand Craftsmen).
  2. التجارة الإلكترونية والمتاجر المتعددة (Multi-Vendor E-Commerce).
  3. الخدمات الرقمية والإدارية (Digital Services & Escrow).
  4. لوحة التحكم المركزية والإدارة (Super Admin).

---

## 2. معايير الواجهة الأمامية وتجربة المستخدم (Frontend & UI Standards)
* **دعم RTL:** يجب أن تكون جميع الشاشات مدعومة بالكامل بالاتجاه من اليمين لليسار (`RTL Native` و `dir="rtl"`).
* **الحفاظ على الحالة:** استخدام `IndexedStack` في Flutter أو الحفاظ على الـ state في React لضمان عدم إعادة بناء الشاشات وإهدار الموارد.
* **التوافق اللغوي والبصري:**
  * اعتماد خط عربي موحد (مثل Cairo أو Tajawal أو Outfit).
  * استخدام شارات التوثيق (`Verified Badge` و `Top Rated Pro`) في بطاقات الحرفيين والتجار.
  * تصميم واجهات اختيار المتغيرات (`SKU Selectors`) لصفحات المنتجات مع تحديث السعر والمخزون لحظياً.
* **كفاءة البيانات (Low Data Mode):** ضغط الصور والملفات محلياً قبل الرفع لتناسب شبكات الهاتف المحلية.

---

## 3. قواعد الأمان والتحقق الميداني (Security & Dual-Step OTP)
* **تشفير الرموز:** يتم حفظ رموز التحقق كـ SHA256 Hash / bcrypt فقط؛ **يُمنع منعاً باتاً حفظ الـ OTP كنص صريح (Plaintext)**.
* **التحقق المزدوج للخدمات:**
  * `START OTP`: يُطلب لتغيير الحالة إلى `IN_PROGRESS` وبدء احتساب وقت العمل.
  * `COMPLETION OTP`: يُطلب لتغيير الحالة إلى `COMPLETED` / `OTP_COMPLETED` وإطلاق التسوية المالية.
* **الحماية من الهجمات:** إقفال المحاولات وتحويل الطلب إلى `DISPUTED` آلياً عند تكرار إدخال الرمز الخاطئ 3 مرات متتالية.

---

## 4. معايير المحفظة والوساطة المالية (Financial Ledger & Escrow Engine)
* **مبدأ القيد المزدوج (Double-Entry Bookkeeping):**
  * **يُمنع التعديل المباشر للأرصدة**؛ كل معاملة تتطلب قيدين متطابقين (مدين DEBIT / دائن CREDIT) مع ربطهما بـ `reference_code` أو `transaction_group_id`.
* **الحماية من تضارب العمليات (Concurrency Locks):**
  * استخدام `SELECT ... FOR UPDATE` إجبارياً على جداول `wallets` و `service_orders` و `escrow_transactions` داخل أي عملية مالية.
* **الدقة الحسابية:** استخدام نوع `NUMERIC(12, 2)` أو `NUMERIC(14, 2)` حصراً لكافة الحقول النقدية؛ **يُمنع استخدام `FLOAT` أو `DOUBLE`**.
* **توزيع المستحقات:**
  * تكلفة قطع الغيار (`parts_total_price` / `spare_parts_amount_da`) تُحوّل بالكامل للمزود بنسبة 100% بدون أي اقتطاع عمولة ($0\%$ Commission on Parts).
  * عمولة المنصة تُحسب فقط على أتعاب العمل (`labor_price`) وبدل الطوارئ (`emergency_surge_fee`).

---

## 5. منطق الأعمال المتقدم (Business Logic & Database Triggers)
* **نظام التقييم الثنائي المحجوب (Double-Blind Reviews):**
  * يبقى التقييم محجوباً (`is_revealed = false`) حتى يقيّم الطرفان معاً، أو تنقضي مهلة 48 ساعة بواسطة المشغل الدوري (`Cron Job`).
* **دورة حياة الضمان (Escrow Lifecycle):**
  * الانتقال بين الحالات: `HELD` -> `DELIVERED` -> `RELEASED` (أو `DISPUTED` -> `PARTIALLY_RELEASED` / `REFUNDED`).
  * إلزامية الفحص الآلي: `held_amount == released_amount + refunded_amount`.
* **تتبع الشحن (Logistics Matrix):**
  * دعم خياري الشحن: التوصيل للمنزل (`À Domicile`) والتوصيل لنقطة الاستلام (`Stop-Desk`) عبر الولايات الـ 58.

---

## 6. تعليمات توليد الكود للذكاء الاصطناعي (Agent Code Generation Instructions)
* عند كتابة أي مسار API جديد، احرص على تطبيق معايير التحقق من صحة المدخلات (Input Validation عبر Zod أو Joi أو TypeBox).
* عند كتابة أي استعلام قاعدة بيانات مالي، ضع الكود داخل كتلة معاملة ذرية (`BEGIN ... COMMIT / ROLLBACK`).
* قدم الأكواد بشكل مباشر وكامل دون اختصارات مخلة بالأمان، مع تضمين التعليقات التوضيحية باللغة العربية.
