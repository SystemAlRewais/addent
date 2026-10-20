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

// إنشاء حساب جديد مع إظهار الـ ID فوراً للطالب
function createAccount() {
    const nameEl = document.getElementById('fullname');
    const phoneEl = document.getElementById('phone');
    const gradeEl = document.getElementById('grade');
    const passwordEl = document.getElementById('password');

    if (!nameEl || !phoneEl || !gradeEl || !passwordEl) {
        alert("⚠️ خطأ في مطابقة عناصر الصفحة، تأكد من ملف الـ HTML!");
        return;
    }

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const grade = gradeEl.value.trim();
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

    // إظهار رسالة واضحة تحتوي على الـ ID فوراً
    alert(`🎉 تم إنشاء الحساب بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${newId}\n\n⚠️ احتفظ بهذا الرقم جيداً لتسجيل الدخول!`);
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
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

// تسجيل الحضور بالـ GPS (مع إحداثيات كلية الإعلام ونطاق 300 متر)
function submitFinalAttendance() {
    const isAttendanceOpen = localStorage.getItem('isAttendanceOpen') === 'true';
    if (!isAttendanceOpen) {
        alert("التسجيل مغلق حالياً من قبل الدكتور!");
        return;
    }

    const secretCodeEl = document.getElementById('secretCode');
    const statusMsg = document.getElementById('statusMsg');

    if (!secretCodeEl || !statusMsg) {
        alert("⚠️ خطأ في عناصر صفحة الحضور!");
        return;
    }

    const secretCode = secretCodeEl.value.trim();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const subject = localStorage.getItem('selectedSubject') || "المادة الدراسية";

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const correctCode = "1234";

    if (secretCode !== correctCode) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "الكود السري للمحاضرة غير صحيح!";
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.textContent = "جاري التقاط الموقع والتأكد من الـ GPS...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const time = new Date().toLocaleString('ar-EG');
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

                const campusLat = 30.0565; 
                const campusLon = 31.3175;
                const allowedRadius = 300; 

                const distance = calculateDistanceInMeters(lat, lon, campusLat, campusLon);
                const isOutlier = distance > allowedRadius;

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
                    statusMsg.textContent = "لقد قمت بتسجيل الحضور لهذه المادة مسبقاً!";
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
                statusMsg.textContent = `تم تسجيل حضورك بنجاح يا ${user.name}!`;
            },
            () => {
                statusMsg.style.color = "red";
                statusMsg.textContent = "فشل تحديد الموقع. يرجى تفعيل الـ GPS وإعطاء الصلاحية للمتصفح.";
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        statusMsg.style.color = "red";
        statusMsg.textContent = "متصفحك لا يدعم خاصية تحديد الموقع الجغرافي.";
    }
}
