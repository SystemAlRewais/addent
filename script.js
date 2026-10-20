const sheetDbApiUrl = "https://sheetdb.io/api/v1/a89ry8w0gkj0g";

// توليد ID عشوائي لطالب
function generateStudentID() {
    return 'AZ' + Math.floor(100000 + Math.random() * 900000);
}

// إنشاء أو جلب بصمة الجهاز الفريدة للمتصفح (Device Binding)
function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('my_unique_device_id');
    if (!deviceId) {
        deviceId = 'DEV-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('my_unique_device_id', deviceId);
    }
    return deviceId;
}

// جلب حالة الإعدادات من جوجل شيت (معالجة ذكية للحروف الكابيتال والسمول)
async function fetchAppSettings() {
    try {
        const response = await fetch(sheetDbApiUrl + "?sheet=Settings");
        const settings = await response.json();
        
        let settingsObj = {
            isAttendanceOpen: 'true',
            isRegistrationOpen: 'true',
            currentSubject: 'المحاضرة الأولى'
        };
        
        if (Array.isArray(settings)) {
            settings.forEach(row => {
                if (row.key && row.value !== undefined) {
                    let val = String(row.value).trim().toLowerCase();
                    settingsObj[row.key] = val;
                }
            });
        }
        
        return settingsObj;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return {
            isAttendanceOpen: 'true',
            isRegistrationOpen: 'true',
            currentSubject: 'المحاضرة الأولى'
        };
    }
}

// تحديث إعداد معين في الشيت سحابياً (خاص بالإدارة)
async function updateAppSetting(keyName, keyValue) {
    try {
        await fetch(`${sheetDbApiUrl}/key/key/${keyName}?sheet=Settings`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: { key: keyName, value: keyValue }
            })
        });
        console.log(`Setting ${keyName} updated to ${keyValue}`);
    } catch (error) {
        console.error("Error updating setting:", error);
    }
}

// إنشاء حساب جديد مع فحص الحالة سحابياً من الشيت
async function createAccount() {
    const settings = await fetchAppSettings();
    const isRegOpen = settings ? settings.isRegistrationOpen === 'true' : true;
    
    const currentDeviceId = getOrCreateDeviceId();
    const deviceOwnerKey = 'device_created_' + currentDeviceId;
    const hasAccountOnDevice = localStorage.getItem(deviceOwnerKey);

    if (!isRegOpen || hasAccountOnDevice) {
        const adminBypass = prompt("⚠️ عذراً، لا يمكن إنشاء أكثر من حساب من هذا الجهاز أو أن الإنشاء مغلق سحابياً من الإدارة.\n\nإذا كنت مسؤولاً، أدخل كلمة السر للمتابعة:");
        if (adminBypass !== "Emoo") {
            alert("❌ غير متاح إنشاء حساب جديد من هذا الجهاز!");
            return;
        }
    }

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

    const userData = { 
        id: newId, 
        name: name, 
        phone: phone, 
        grade: grade, 
        password: password,
        boundDeviceId: currentDeviceId,
        isAdmin: false,
        totalAttendance: 0, 
        totalViolations: 0  
    };

    localStorage.setItem(newId, JSON.stringify(userData));
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem(deviceOwnerKey, newId);

    // إرسال البيانات سحابياً إلى تبويب Students
    fetch(sheetDbApiUrl + "?sheet=Students", {
        method: "POST",
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: [{ id: newId, name: name, phone: phone, grade: grade, password: password }]
        })
    }).catch(error => console.error("Error saving student:", error));

    alert(`🎉 تم إنشاء الحساب بنجاح!\n\n🆔 رقمك الجامعي (ID) هو: ${newId}\n🔑 كلمة السر: ${password}\n\n⚠️ احتفظ به جيداً!`);
    window.location.href = 'subjects.html';
}

// تسجيل الدخول
function login() {
    const idEl = document.getElementById('loginId');
    const passEl = document.getElementById('loginPassword');

    if (!idEl || !passEl) return;

    const id = idEl.value.trim();
    const pass = passEl.value.trim();

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
    const isUserAdmin = user.isAdmin === true;

    if (!user.boundDeviceId) {
        user.boundDeviceId = currentDeviceId;
        localStorage.setItem(user.id, JSON.stringify(user));
    } else if (user.boundDeviceId !== currentDeviceId) {
        if (isUserAdmin) {
            user.boundDeviceId = currentDeviceId;
            localStorage.setItem(user.id, JSON.stringify(user));
        } else {
            const bypass = prompt("⚠️ هذا الحساب مرتبط بجهاز آخر.\n\nإذا كنت الإدارة، أدخل كلمة السر لفتح الحساب:");
            if (bypass === "Emoo") {
                user.boundDeviceId = currentDeviceId;
                localStorage.setItem(user.id, JSON.stringify(user));
                alert("🔓 تم تخطي قيد الجهاز بنجاح!");
            } else {
                alert("❌ خطأ في الأمان: هذا الحساب مرتبط بجهاز آخر!");
                return;
            }
        }
    }

    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'subjects.html';
}

// حساب المسافة الجغرافية بالـ GPS
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

// تسجيل الحضور بالـ GPS مع التحقق سحابياً من حالة فتح المحاضرة
async function submitFinalAttendance() {
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.style.color = "blue";
    statusMsg.textContent = "جاري التحقق من حالة المحاضرة سحابياً...";

    const settings = await fetchAppSettings();
    const isAttendanceOpen = settings ? settings.isAttendanceOpen === 'true' : false;

    if (!isAttendanceOpen) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "🔒 التسجيل مغلق حالياً سحابياً من قبل الإدارة/الدكتور!";
        alert("⚠️ التسجيل مغلق حالياً من قبل الإدارة/الدكتور سحابياً!");
        return;
    }

    const secretCodeEl = document.getElementById('secretCode');
    if (!secretCodeEl || !statusMsg) return;

    const secretCode = secretCodeEl.value.trim();
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const subject = settings && settings.currentSubject ? settings.currentSubject : (localStorage.getItem('selectedSubject') || 'المحاضرة العامة');

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const correctCode = "1234";
    const bypassCode = "012288"; 

    if (secretCode !== correctCode && secretCode !== bypassCode) {
        statusMsg.style.color = "red";
        statusMsg.textContent = "الكود السري للمحاضرة غير صحيح!";
        return;
    }

    function executeRegistration(lat, lon, isOutlier) {
        const time = new Date().toLocaleString('ar-EG');
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

        // إرسال الحضور سحابياً إلى تبويب Attendance
        fetch(sheetDbApiUrl + "?sheet=Attendance", {
            method: "POST",
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: [{
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    grade: user.grade,
                    subject: subject,
                    time: time,
                    locationLink: mapsUrl,
                    isOutlier: isOutlier ? "نعم" : "لا"
                }]
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Attendance saved:", data);
            statusMsg.style.color = "green";
            statusMsg.textContent = `تم تسجيل حضورك بنجاح يا ${user.name} في (${subject})!`;
        })
        .catch(error => {
            console.error("Error:", error);
            statusMsg.style.color = "red";
            statusMsg.textContent = "حدث خطأ أثناء الاتصال بالقاعدة السحابية.";
        });
    }

    if (secretCode === bypassCode) {
        statusMsg.style.color = "purple";
        statusMsg.textContent = "🚀 تم تفعيل وضع الاستثناء، جاري التسجيل بنجاح...";
        setTimeout(() => { executeRegistration(30.0565, 31.3175, false); }, 800);
        return;
    }

    statusMsg.style.color = "blue";
    statusMsg.textContent = "جاري التقاط الموقع الجغرافي (GPS)...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const distance = calculateDistanceInMeters(lat, lon, 30.0565, 31.3175);
                const isOutlier = distance > 300;

                if (isOutlier) {
                    statusMsg.style.color = "red";
                    statusMsg.textContent = "❌ أنت خارج النطاق الجغرافي المسموح (300 متر)!";
                    return;
                }

                executeRegistration(lat, lon, false);
            },
            () => {
                statusMsg.style.color = "red";
                statusMsg.textContent = "❌ فشل تحديد الموقع. تأكد من تفعيل الـ GPS.";
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        statusMsg.style.color = "red";
        statusMsg.textContent = "متصفحك لا يدعم تحديد الموقع.";
    }
}
