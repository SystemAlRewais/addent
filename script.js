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
    // محاولة جلب عناصر الإدخال بأسماء IDs مختلفة لضمان العمل مع أي تصميم HTML
    const nameInput = document.getElementById('fullName') || document.getElementById('name') || document.getElementById('studentName');
    const phoneInput = document.getElementById('phone') || document.getElementById('mobile');
    const gradeInput = document.getElementById('grade') || document.getElementById('year');
    const passwordInput = document.getElementById('password') || document.getElementById('pass');

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const grade = gradeInput ? gradeInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!name || !password) {
        alert('⚠️ من فضلك أدخل الاسم وكلمة المرور على الأقل!');
        return;
    }

    // توليد ID تلقائي ومميز للطالب (مثال: AZ-84920)
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
    localStorage.setItem('registeredUsers', JSON.stringify(users
