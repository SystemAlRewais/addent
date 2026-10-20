// ==========================================
// 1. إحداثيات كلية الإعلام - جامعة الأزهر (مدينة نصر)
// ==========================================
const campusLat = 30.0565; 
const campusLon = 31.3175;
const allowedRadius = 300; // نطاق السماح بالمتر

// ==========================================
// 2. دالة إنشاء حساب جديد وإظهار الـ ID فوراً
// ==========================================
function createAccount() {
    if (typeof event !== 'undefined' && event) {
        event.preventDefault();
    }

    // جلب جميع الخانات النصية الموجودة في الواجهة
    const allInputs = Array.from(document.querySelectorAll('input'));
    
    // تجميع القيم من الخانات
    let values = allInputs.map(input => input.value.trim()).filter(val => val !== "");

    // جلب الاسم (أول قيمة مكتوبة، أو من ID محدد)
    let name = "";
    const nameEl = document.getElementById('fullName') || document.getElementById('name') || document.getElementById('studentName');
    if (nameEl && nameEl.value.trim() !== "") {
        name = nameEl.value.trim();
    } else if (values.length > 0) {
        name = values[0];
    }

    // جلب كلمة المرور (أو تعيين كلمة مرور افتراضية لو مش مقروءة)
    let password = "";
    const passEl = document.getElementById('password') || document.getElementById('pass') || document.querySelector('input[type="password"]');
    if (passEl && passEl.value.trim() !== "") {
        password = passEl.value.trim();
    } else if (values.length > 1) {
        password = values[values.length - 1];
    } else {
        password = "123456"; // كلمة مرور افتراضية لضمان عدم توقف التسجيل
    }

    if (!name) {
        alert('⚠️ من فضلك أدخل الاسم على الأقل!');
        return;
    }

    // توليد ID تلقائي ومميز للطالب
    const generatedId = 'AZ-' + Math.floor(100000 + Math.random() * 900000);
    const deviceFp = getDeviceFingerprint();

    // جلب الحسابات المسجلة سابقاً
    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    const newUser = {
        id: generatedId,
        name: name,
        phone: values[1] || "",
        grade: values[2] || "",
        password: password,
        deviceFingerprint: deviceFp
    };

    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    // إظهار الـ ID للطالب فوراً في تنبيه واضح
    alert(`🎉 تم إنشاء حسابك بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${generatedId}\n🔑 كلمة المرور: ${password}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول والحضور!`);

    // حفظ بيانات الحساب الحالي والتوجيه لصفحة المواد
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    window.location.href = 'subjects.html';
}

// ==========================================
// 3. دالة تسجيل الدخول
// ==========================================
function login() {
    if (typeof event !== 'undefined' && event) {
        event.preventDefault();
    }

    const inputs = document.querySelectorAll('input');
    const idInput = document.getElementById('studentId') || document.getElementById('id') || inputs[0];
    const passwordInput = document.getElementById('studentPassword') || document.getElementById('password') || inputs[1];

    const id = idInput ? idInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!id || !password) {
        alert('من فضلك أدخل الرقم الجامعي (ID) وكلمة المرور!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    let user = users.find(u => u.id === id);

    const currentDeviceFingerprint = getDeviceFingerprint();

    if (user) {
        if (user.password !== password) {
            alert('❌ كلمة المرور غير صحيحة!');
            return;
        }
        if (user.deviceFingerprint && user.deviceFingerprint !== currentDeviceFingerprint) {
            alert('⚠️ خطأ أمان: هذا الحساب مرتبط بموبايل آخر ولا يمكن فتحه من هنا!');
            return;
        }
    } else {
        alert('❌ هذا الرقم الجامعي غير مسجل! قم بإنشاء حساب جديد أولاً.');
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'subjects.html';
}

// ==========================================
// 4. بصمة الجهاز لمنع تبادل الحسابات
// ==========================================
function getDeviceFingerprint() {
    let fp = localStorage.getItem('device_fp');
    if (!fp) {
        fp = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('device_fp', fp);
    }
    return fp;
}

// ==========================================
// 5. حساب المسافة الجغرافية (GPS)
// ==========================================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 *
