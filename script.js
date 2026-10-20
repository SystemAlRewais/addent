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
    const name = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const grade = document.getElementById('grade').value;
    const password = document.getElementById('password').value.trim();

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

    // إظهار الـ ID للطالب فوراً في تنبيه واضح
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

// تسجيل الحضور بالـ GPS (مع إحداثيات كلية الإعلام ونطاق 300 متر + الكود الاستثنائي 9988)
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

    const correctCode = "1234";
    const bypassCode = "9988"; // 🔑 الكود الاستثنائي الجديد للتسجيل من أي مكان

    if (secretCode !== correctCode && secretCode !== bypassCode) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "الكود السري للمحاضرة غير صحيح!";
        return;
    }

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

    // إذا كتبت الكود 9988، هيسجل لك حضور فوراً وكأنك في الكلية
    if (secretCode === bypassCode) {
        statusMsg.style.color = "purple";
        statusMsg.textContent = "🚀 تم تفعيل وضع الاستثناء، جاري التسجيل بنجاح...";
        setTimeout(() => {
            executeRegistration(30.0565, 31.3175, false);
        }, 1000);
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.textContent = "جاري التقاط الموقع والتأكد من الـ GPS...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const campusLat = 30.0565; 
                const campusLon = 31.3175;
                const allowedRadius = 300; // 300 متر

                const distance = calculateDistanceInMeters(lat, lon, campusLat, campusLon);
                const isOutlier = distance > allowedRadius;

                executeRegistration(lat, lon, isOutlier);
            },
            () => {
                statusMsg.style.color = "red";
                statusMsg.textContent = "فشل تحديد الموقع. يرجى تفعيل الـ GPS.";
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
}
