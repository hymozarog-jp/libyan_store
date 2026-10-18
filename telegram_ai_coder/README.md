# وكيل البرمجة الذكي لتليجرام (نسخة أولية آمنة)

هذا البوت يستقبل مهام برمجية بالعربية، يقرأ مجموعة محدودة من ملفات مستودع GitHub المسموح، يطلب اقتراح تعديل من Gemini، ثم ينشئ **Draft Pull Request** للمراجعة. لا يدمج التغييرات ولا ينشر للإنتاج تلقائيًا.

## حدود النسخة الأولى

- يقرأ حتى 8 ملفات نصية مختارة وبحد أقصى تقريبي للسياق.
- يعدّل ملفات موجودة فقط من الملفات التي قرأها.
- يمنع مسارات الأسرار وملفات الاعتماديات وإعدادات النشر وقواعد البيانات الحساسة.
- لا يشغّل أوامر نظام ولا ينفّذ كود المشروع داخل الاستضافة.
- لا يعتبر إنشاء PR أو نجاح Actions دليلًا على أن التغيير ظهر في الموقع المنشور.
- هذه النسخة لا تشغّل الاختبارات في sandbox مستقل؛ يجب مراجعة PR ونتائج CI قبل الدمج.

## المتطلبات

1. بوت من [@BotFather](https://t.me/BotFather).
2. مفتاح Gemini من [Google AI Studio](https://aistudio.google.com/app/apikey)؛ حدود الخطة المجانية وتوفر النموذج قد يتغيران.
3. GitHub fine-grained personal access token بصلاحيات Contents: Read and write وPull requests: Read and write للمستودع المحدد فقط. لا تستخدم صلاحيات إدارية واسعة.
4. حساب Render. هذا المشروع يستخدم Webhook لأن Render Free يوقف خدمات الويب بعد 15 دقيقة من عدم النشاط؛ لذلك قد يتأخر أول رد بعد فترة خمول.

## إعداد المتغيرات السرية

ضع القيم في Secrets / Variables داخل منصة الاستضافة، لا في Git ولا في رسائل تليجرام:

- `TELEGRAM_BOT_TOKEN`
- `GEMINI_API_KEY`
- `GITHUB_TOKEN`
- `ALLOWED_TELEGRAM_USER_IDS` — رقم حساب تليجرام المسموح، وليس اسم المستخدم.
- `ALLOWED_REPOSITORIES` — قائمة `owner/repo` مفصولة بفواصل، مثل `hymozarog-jp/libyan_store`.
- `GEMINI_MODEL` — اختياري، الافتراضي `gemini-2.5-flash`.

## تشغيل محلي للتجربة

```bash
cd telegram_ai_coder
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# أدخل القيم الحقيقية في .env محليًا فقط، ولا ترفع الملف إلى Git
set -a; source .env; set +a
python bot.py
```

على Windows PowerShell، عيّن المتغيرات من إعدادات البيئة بدل أمر `source`.

## النشر على Render Free

1. افتح https://render.com/ وسجّل الدخول، ثم اربط مستودع GitHub.
2. أنشئ Blueprint من المستودع الذي يحتوي `render.yaml`، أو أنشئ Web Service يدويًا بنفس الإعدادات. راجع الكود قبل دمج PR في `main`.
3. تأكد أن الإعدادات تحدد `rootDir: telegram_ai_coder` وخطة `free` و`autoDeploy: false`.
4. أضف القيم السرية في Environment داخل Render: `TELEGRAM_BOT_TOKEN`، `GEMINI_API_KEY`، `GITHUB_TOKEN`، `ALLOWED_TELEGRAM_USER_IDS`، `WEBHOOK_PATH`، و`TELEGRAM_WEBHOOK_SECRET`. لا تضعها في GitHub أو في المحادثة.
5. أنشئ قيمتين عشوائيتين مختلفتين لـ `WEBHOOK_PATH` و`TELEGRAM_WEBHOOK_SECRET` على جهازك، مثلًا شغّل أمر Python هذا مرتين: `python -c "import secrets; print(secrets.token_urlsafe(32))"`.
6. استخدم GitHub Fine-grained token بصلاحيات Contents: Read and write وPull requests: Read and write للمستودع المطلوب فقط.
7. انشر الخدمة يدويًا من Render بعد إضافة المتغيرات. Render يوفّر `RENDER_EXTERNAL_URL` تلقائيًا، والبوت يضبط Telegram webhook عند بدء التشغيل.
8. اختبر `/start` و`/id` و`/status` من حسابك. ابدأ بمهمة تجريبية ولا تسمح بالدمج أو النشر التلقائي.

**حدود الخطة المجانية:** الخدمة تنام بعد 15 دقيقة بلا طلبات واردة، وقد يستغرق الاستيقاظ قرابة دقيقة؛ توجد 750 ساعة مجانية شهريًا على مستوى مساحة العمل، مع حدود للباندويث والبناء. قد تتأخر رسائل Telegram بعد الخمول، لذا هذا اختبار منخفض التكلفة وليس ضمان تشغيل 24/7.

## طريقة الاستخدام

- `/start` — تعليمات.
- `/repo owner/name` — اختيار مستودع من القائمة المسموحة فقط.
- `/task حسّن تصميم بطاقات المنتجات على الهاتف` — إنشاء اقتراح تغييرات وDraft PR.
- `/status` — الإعداد الحالي.

قبل الدمج: راجع كل diff، تأكد من نجاح اختبارات CI، وافحص الموقع المنشور يدويًا أو باختبارات smoke/e2e مناسبة. لا تدمج أو تنشر تغييرات حساسة دون موافقة صريحة.

## الخطوات القادمة

لتطويره إلى وكيل أقوى: بيئة تنفيذ معزولة لكل مهمة، اختبارات unit/integration/e2e، قراءة لقطات الشاشة بعد النشر، نظام موافقات مؤقت مرتبط بالمهمة، حدود وقت وتكلفة، وتسجيل عمليات من دون حفظ الأسرار.
