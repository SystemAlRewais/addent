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

// إنشاء حساب جديد مع إظهار الـ ID فوراً وتهيئة العدادات بـ صفر
function createAccount() {
    const nameEl = document.getElementById('fullname');
    const phoneEl = document.getElementById('phone');
    const gradeEl = document.getElementById('grade');
    const passwordEl = document.getElementById('password');

    if (!nameEl || !phoneEl || !gradeEl || !passwordEl) {
        alert("من فضلك تأكد من إدخال جميع البيانات في الحقول المطلوبة!");
        return;
    }

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const grade = gradeEl.value;
    const password = passwordEl.value.trim();

    if (!name || !phone || !grade || !password) {
        alert("من فضلك أكمل جميع البيانات!");
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

    localStorage.setItem(newId, JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));

    // إظهار الـ ID فوراً للطالب
    alert(`🎉 تم إنشاء الحساب بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${newId}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول!`);
    window.location.href = 'subjects.html';
}

// تسجيل الدخول مع التحقق من بصمة الجهاز
function login() {
    const id = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();

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

// تسجيل الحضور بالـ GPS مع إحداثيات كلية الإعلام (مدينة نصر - 300م) وكود الاستثناء 9988
function submitFinalAttendance() {
    const isAttendanceOpen = localStorage.getItem('isAttendanceOpen') === 'true';
    if (!isAttendanceOpen) {
        alert("التسجيل مغلق حالياً من قبل الدكتور!");
        return;
    }

    const secretCode = document.getElementById('secretCode').value.trim();
    const statusMsg = document.getElementById('statusMsg');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const subject = localStorage.getItem('selectedSubject');

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const correctCode = "1234";
    const bypassCode = "9988"; // كود الاستثناء للتسجيل من الخارج

    if (secretCode !== correctCode && secretCode !== bypassCode) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "الكود السري للمحاضرة غير صحيح!";
        return;
    }

    // دالة لتنفيذ عملية تسجيل الحضور وتحديث ملف الطالب
    function executeRegistration(lat, lon, isOutlier) {
        const time = new Date().toLocaleString('ar-EG');
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

        const record = {
            id: user.id,
            name: user.name,
            phone: user.phone,
            grade: user.grade,
            subject: subject,
            time: time,
            locationLink: mapsUrl,
            isOutlier: isOutlier
        };

        let allAttendance = JSON.parse(localStorage.getItem('allAttendanceRecords')) || [];
        
        const alreadyRegistered = allAttendance.some(r => r.id === user.id && r.subject === subject);
        if (alreadyRegistered) {
            statusMsg.style.color = "orange";
            statusMsg.textContent = "لقد قمت بتسجيل الحضور لهذه المحاضرة مسبقاً!";
            return;
        }

        allAttendance.push(record);
        localStorage.setItem('allAttendanceRecords', JSON.stringify(allAttendance));

        let freshUser = JSON.parse(localStorage.getItem(user.id));
        if (freshUser) {
            freshUser.totalAttendance = (freshUser.totalAttendance || 0) + 1;
            if (isOutlier) {
                freshUser.totalViolations = (freshUser.totalViolations || 0) + 1;
            }
            localStorage.setItem(user.id, JSON.stringify(freshUser));
            localStorage.setItem('currentUser', JSON.stringify(freshUser));
        }

        statusMsg.style.color = "green";
        statusMsg.textContent = `تم تسجيل حضورك بنجاح يا ${user.name}! ${secretCode === bypassCode ? '(وضع الاستثناء 🚀)' : ''}`;
    }

    // إذا تم إدخال كود الاستثناء (9988)
    if (secretCode === bypassCode) {
        statusMsg.style.color = "purple";
        statusMsg.textContent = "🚀 تم تفعيل وضع الاستثناء، جاري التسجيل بنجاح...";
        setTimeout(() => {
            executeRegistration(30.0565, 31.3175, false);
        }, 800);
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.textContent = "جاري التقاط الموقع والتأكد من الـ GPS...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // إحداثيات كلية الإعلام بجامعة الأزهر (مدينة نصر)
                const campusLat = 30.0565; 
                const campusLon = 31.3175;
                const allowedRadius = 300; // 300 متر نطاق سماح

                const distance = calculateDistanceInMeters(lat, lon, campusLat, campusLon);
                const isOutlier = distance > allowedRadius;

                if (isOutlier) {
                    statusMsg.style.color = "red";
                    statusMsg.textContent = `❌ أنت خارج نطاق الكلية (المسافة: ${Math.round(distance)} متر). الحد الأقصى 300 متر!`;
                    return;
                }

                executeRegistration(lat, lon, false);
            },
            () => {
                statusMsg.style.color = "red";
                statusMsg.textContent = "فشل تحديد الموقع. يرجى تفعيل الـ GPS والسماح للمتصفح.";
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        statusMsg.style.color = "red";
        statusMsg.textContent = "متصفحك لا يدعم خدمة تحديد الموقع.";
    }
}
