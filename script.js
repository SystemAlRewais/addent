// إحداثيات كلية الإعلام - جامعة الأزهر بمدينة نصر
const campusLat = 30.0565; 
const campusLon = 31.3175;
const allowedRadius = 300; // مسافة السماح بالمتر داخل محيط الكلية

// دالة تسجيل الدخول
function login() {
    const id = document.getElementById('studentId').value.trim();
    const password = document.getElementById('studentPassword').value.trim();

    if (!id || !password) {
        alert('من فضلك أدخل الرقم الجامعي وكلمة المرور!');
        return;
    }

    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    let user = users.find(u => u.id === id);

    const currentDeviceFingerprint = getDeviceFingerprint();

    if (user) {
        if (user.password !== password) {
            alert('كلمة المرور غير صحيحة!');
            return;
        }
        if (user.deviceFingerprint && user.deviceFingerprint !== currentDeviceFingerprint) {
            alert('⚠️ خطأ في الأمان: هذا الحساب مرتبط بجهاز آخر ولا يمكن فتحه من هنا!');
            return;
        }
    } else {
        const studentNames = {
            "12345": "أحمد محمد",
            "54321": "محمود علي"
        };
        const name = studentNames[id] || "طالب جامعي";

        user = {
            id: id,
            name: name,
            password: password,
            deviceFingerprint: currentDeviceFingerprint
        };
        users.push(user);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'subjects.html';
}

// دالة بصمة الجهاز
function getDeviceFingerprint() {
    let fp = localStorage.getItem('device_fp');
    if (!fp) {
        fp = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('device_fp', fp);
    }
    return fp;
}

// دالة حساب المسافة بين إحداثيات الطالب وموقع الكلية (بالأمتار)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // نصف قطر الأرض بالمتر
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// دالة التحقق من الـ GPS وتسجيل الحضور
function verifyAndAttend() {
    const statusText = document.getElementById('statusText');
    const subject = localStorage.getItem('selectedSubject') || "مادة غير محددة";
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    if (!navigator.geolocation) {
        statusText.innerHTML = "❌ متصفحك لا يدعم خاصية تحديد الموقع (GPS).";
        statusText.style.color = "red";
        return;
    }

    statusText.innerHTML = "⏳ جاري تحديد موقعك الجغرافي داخل الكلية...";
    statusText.style.color = "#007bff";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            const distance = calculateDistance(userLat, userLon, campusLat, campusLon);

            if (distance <= allowedRadius) {
                let attendanceList = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
                
                const alreadyRecorded = attendanceList.some(item => item.id === user.id && item.subject === subject);
                if (alreadyRecorded) {
                    statusText.innerHTML = `✅ أنت مسجل بالفعل في حضور مادة: (${subject})`;
                    statusText.style.color = "orange";
                    return;
                }

                attendanceList.push({
                    id: user.id,
                    name: user.name,
                    subject: subject,
                    time: new Date().toLocaleString('ar-EG')
                });
                localStorage.setItem('attendanceRecords', JSON.stringify(attendanceList));

                statusText.innerHTML = `✅ تم تسجيل حضورك بنجاح في (${subject}) وأنت داخل الكلية!`;
                statusText.style.color = "green";
            } else {
                statusText.innerHTML = `❌ عذراً، أنت خارج نطاق كلية الإعلام (المسافة: ${Math.round(distance)} متر). لا يمكنك تسجيل الحضور!`;
                statusText.style.color = "red";
            }
        },
        (error) => {
            statusText.innerHTML = "❌ فشل في تحديد الموقع. تأكد من تفعيل الـ GPS وإعطاء الصلاحية للمتصفح.";
            statusText.style.color = "red";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}
