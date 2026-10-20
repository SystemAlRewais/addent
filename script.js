<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إنشاء حساب طالب جديد - كلية الإعلام</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h2>كلية الإعلام - جامعة الأزهر</h2>
        <h3>إنشاء حساب جديد</h3>
        
        <div class="form-group">
            <label for="fullname">الاسم ثلاثي:</label>
            <input type="text" id="fullname" placeholder="أدخل اسمك ثلاثي">
        </div>

        <div class="form-group">
            <label for="phone">رقم التليفون:</label>
            <input type="text" id="phone" placeholder="أدخل رقم الهاتف">
        </div>

        <div class="form-group">
            <label for="grade">الفرقة الدراسية:</label>
            <input type="text" id="grade" placeholder="مثال: الفرقة الأولى">
        </div>

        <div class="form-group">
            <label for="password">كلمة المرور:</label>
            <input type="password" id="password" placeholder="أدخل كلمة المرور">
        </div>

        <!-- زرار مباشر ومربوط بالدالة بدون أي مشاكل -->
        <button type="button" onclick="createAccount()">إنشاء الحساب</button>
        
        <p style="margin-top: 15px; text-align: center;">
            لديك حساب بالفعل؟ <a href="index.html">تسجيل الدخول</a>
        </p>
    </div>

    <script src="script.js"></script>
</body>
</html>
