// توليد ID عشوائي للطالب
function generateStudentID() {
    return 'AZ' + Math.floor(100000 + Math.random() * 900000);
}

// إنشاء أو جلب بصمة الجهاز الفريدة للمتصفح
function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('my_unique_device_id');
    if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('my_unique_device_id', deviceId);
    }
    return deviceId;
}

// إنشاء حساب جديد (مضمون 100% بدون أي مشاكل)
function createAccount() {
    const nameInput = document.getElementById('fullname');
    const phoneInput = document.getElementById('phone');
    const gradeInput = document.getElementById('grade');
    const passwordInput = document.getElementById('password');

    if (!nameInput || !phoneInput || !gradeInput || !passwordInput) {
        alert("خطأ: بعض حقول التسجيل غير موجودة في هذه الصفحة!");
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const grade = gradeInput.value;
    const password = passwordInput.value.trim();

    if (!name || !phone || !grade || !password) {
        alert("من فضلك أكمل جميع البيانات المطلوبة!");
        return;
    }

    const newId = generateStudentID();
    const currentDeviceId = getOrCreateDeviceId();

    const userData = { 
        id: newId, 
        name: name, 
        phone: phone, 
        grade: grade, 
        password: password,
        boundDeviceId: currentDeviceId,
        totalAttendance: 0, 
        totalViolations: 0  
    };

    // حفظ بيانات الطالب في التخزين المحلي
    localStorage.setItem(newId, JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));

    // إظهار رسالة النجاح والـ ID فوراً
    alert(`🎉 تم إنشاء الحساب بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${newId}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول!`);
    
    // التحويل لصفحة المواد
    window.location.href = 'subjects.html';
}

// تسجيل الدخول مع التحقق من بصمة الجهاز
function login() {
    const idInput = document.getElementById('loginId');
    const passInput = document.getElementById('loginPassword');

    if (!idInput || !passInput) return;

    const id = idInput.value.trim();
    const pass = passInput.value.trim();

    if (!id || !pass) {
        alert("يرجى إدخال الرقم الجامعي وكلمة السر!");
        return;
    }

    const savedUser = localStorage.getItem(id);
    if (!savedUser) {
        alert("هذا الـ ID غير مسجل!");
        return;
    }

    const user = JSON.parse(savedUser);

    if (user.password !== pass) {
        alert("كلمة السر غير صحيحة!");
        return;
    }

    const currentDeviceId = getOrCreateDeviceId();

    if (!user.boundDeviceId) {
        user.boundDeviceId = currentDeviceId;
        localStorage.setItem(user.id, JSON.stringify(user));
    } else if (user.boundDeviceId !== currentDeviceId) {
        alert("⚠️ خطأ في الأمان: هذا الحساب مرتبط بجهاز آخر ولا يمكن فتحه من هنا!");
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'subjects.html';
}

// حساب المسافة بين الإحداثيات بالمتر
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// تسجيل الحضور بالـ GPS (مع إحداثيات كلية الإعلام + كود الاستثناء 012288)
function submitFinalAttendance() {
    const isAttendanceOpen = localStorage.getItem('isAttendanceOpen') === 'true';
    if (!isAttendanceOpen) {
        alert("التسجيل مغلق حالياً من قبل الدكتور!");
        return;
    }

    const secretCodeInput = document.getElementById('secretCode');
    const statusMsg = document.getElementById('statusMsg');
    
    if (!secretCodeInput || !statusMsg) return;

    const secretCode = secretCodeInput.value.trim();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const subject = localStorage.getItem('selectedSubject');

    if (!user) {
        window.location.href = 'index.html';
        
