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

    // جلب الحقول بأكثر من طريقة لضمان التطابق التام مع أي تصميم HTML
    const inputs = document.querySelectorAll('input');
    
    let name = "";
    let phone = "";
    let grade = "";
    let password = "";

    // محاولة البحث بالـ IDs المعروفة أو بالترتيب في الصفحة
    const nameInput = document.getElementById('fullName') || document.getElementById('name') || document.getElementById('studentName') || inputs[0];
    const phoneInput = document.getElementById('phone') || document.getElementById('mobile') || inputs[1];
    const gradeInput = document.getElementById('grade') || document.getElementById('year') || inputs[2];
    const passwordInput = document.getElementById('password') || document.getElementById('pass') || inputs[inputs.length - 1];

    if (nameInput) name = nameInput.value.trim();
    if (phoneInput) phone = phoneInput.value.trim();
    if (gradeInput) grade = gradeInput.value.trim();
    if (passwordInput) password = passwordInput.value.trim();

    // التحقق البديل لو الحقول جابت قيم فاضية نأخذها مباشرة من أول حقول نصية
    if (!name && inputs.length > 0) name = inputs[0].value.trim();
    if (!password && inputs.length > 1) password = inputs[inputs.length - 1].value.trim();

    if (!name || !password) {
        alert('⚠️ من فضلك تأكد من كتابة الاسم وكلمة المرور!');
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
        phone: phone,
        grade: grade,
        password: password,
        deviceFingerprint: deviceFp
    };

    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    // إظهار الـ ID للطالب فوراً في تنبيه واضح
    alert(`🎉 تم إنشاء حسابك بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${generatedId}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول والحضور!`);

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
        if (user.deviceFingerprint && user.deviceFinger
