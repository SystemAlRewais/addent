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
        
        // قيم افتراضية في حالة عدم وجود البيانات
        let settingsObj = {
            isAttendanceOpen: 'true',
            isRegistrationOpen: 'true',
            currentSubject: 'المحاضرة الأولى'
        };
        
        if (Array.isArray(settings)) {
            settings.forEach(row => {
                if (row.key && row.value !== undefined) {
                    // تحويل كل القيم المنطقية إلى حروف صغيرة سمول تلقائياً (true / false)
                    let val = String(row.value).trim().toLowerCase();
                    settingsObj[row.key] = val;
                }
            });
        }
        
        return settingsObj;
    } catch (error) {
        console.error("Error fetching settings:", error);
        // في حالة حدوث خطأ في الشبكة، يتم إرجاع إعدادات افتراضية مفتوحة لضمان عمل الموقع
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
                data: { key: key
