// ==========================================
// 1. إحداثيات كلية الإعلام - جامعة الأزهر (مدينة نصر)
// ==========================================
const campusLat = 30.0565; 
const campusLon = 31.3175;
const allowedRadius = 300; // نطاق السماح بالمتر

// ==========================================
// 2. دالة إنشـاء حساب جديد وإظهار الـ ID فوراً
// ==========================================
function createAccount() {
    const nameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const gradeInput = document.getElementById('grade');
    const passwordInput = document.getElementById('password');

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

    // جلب الحسابات القديمة أو فتح مصفوفة جديدة
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

    // إظهار الـ ID للطالب في تنبيه واضح جداً
    alert(`🎉 تم إنشاء حسابك بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${generatedId}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول والحضور!`);

    // توجيه تلقائي لصفحة تسجيل الدخول أو المواد
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    window.location.href = 'subjects.html';
}

// ==========================================
// 3. دالة تسجيل الدخول
// ==========================================
function login() {
    const idInput = document.getElementById('studentId');
    const passwordInput = document.getElementById('studentPassword');

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
    const R = 6371e3; // نصف قطر الأرض بالمتر
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// ==========================================
// 6. التحقق من الـ GPS وتسجيل الحضور
// ==========================================
function verifyAndAttend() {
    const statusText = document.getElementById('statusText');
    const subject = localStorage.getItem('selectedSubject') || "مادة غير محددة";
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    if (!navigator.geolocation) {
        if (statusText) {
            statusText.innerHTML = "❌ متصفحك لا يدعم خاصية تحديد الموقع (GPS).";
            statusText.style.color = "red";
        }
        return;
    }

    if (statusText) {
        statusText.innerHTML = "⏳ جاري التأكد من تواجدك داخل الكلية عبر الـ GPS...";
        statusText.style.color = "#007bff";
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const distance = calculateDistance(userLat, userLon, campusLat, campusLon);

            if (distance <= allowedRadius) {
                let attendanceList = JSON.parse(localStorage.getItem('attendanceRecords')) || [];

                const alreadyRecorded = attendanceList.some(item => item.id === user.id && item.subject === subject);
                if (alreadyRecorded) {
                    if (statusText) {
                        statusText.innerHTML = `✅ أنت مسجل حضور بالفعل في مادة: (${subject})`;
                        statusText.style.color = "orange";
                    }
                    return;
                }

                attendanceList.push({
                    id: user.id,
                    name: user.name,
                    subject: subject,
                    time: new Date().toLocaleString('ar-EG')
                });
                localStorage.setItem('attendanceRecords', JSON.stringify(attendanceList));

                if (statusText) {
                    statusText.innerHTML = `✅ تم تسجيل حضورك بنجاح في (${subject})!`;
                    statusText.style.color = "green";
                }
            } else {
                if (statusText) {
                    statusText.innerHTML = `❌ أنت خارج نطاق الكلية (المسافة: ${Math.round(distance)} متر). لا يمكنك الحضور!`;
                    statusText.style.color = "red";
                }
            }
        },
        (error) => {
            if (statusText) {
                statusText.innerHTML = "❌ فشل في تحديد موقعك. يرجى تفعيل الـ GPS وإعطاء الصلاحية للمتصفح.";
                statusText.style.color = "red";
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}
