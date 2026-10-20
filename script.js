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

// جلب حالة الإعدادات من جوجل شيت (مركزياً لكل الطلاب)
async function fetchAppSettings() {
    try {
        const response = await fetch(sheetDbApiUrl + "?sheet=Settings");
        const settings = await response.json();
        
        let settingsObj = {};
        settings.forEach(row => {
            // تحويل القيم لتعامل مرن بغض النظر عن الحروف الكابيتال والسمول
            let val = row.value;
            if (typeof val === 'string') {
                val = val.trim();
                if (val.toUpperCase() === 'TRUE') val = 'true';
                if (val.toUpperCase() === 'FALSE') val = 'false';
            }
            settingsObj[row.key] = val;
        });
        
        return settingsObj;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
}

// تحديث إعداد معين في الشيت (خاص بالأدمن)
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
        
