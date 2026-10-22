// lms_core.js - สคริปต์กลางสำหรับระบบ Realtime Notifications & Audit Logs

// 1. ฟังก์ชันสร้าง Audit Log เมื่อมีการกระทำใดๆ ในระบบ
async function logAuditEvent(actionType, moduleName, description) {
    try {
        const userName = localStorage.getItem('account_name') || localStorage.getItem('admin_username') || localStorage.getItem('user_name') || 'ผู้ดูแลระบบ';
        await mySupabase.from('audit_logs').insert([{
            action_type: actionType, // 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD'
            module: moduleName,      // 'ข้อสอบ' | 'OMR' | 'ประกาศ' | 'Consult' | 'ระบบ'
            description: description,
            user_name: userName
        }]);
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
}

// 2. ฟังก์ชันส่งการแจ้งเตือน Realtime เข้าสู่ระบบ
async function createNotification(type, title, description, targetUrl = 'admin.html') {
    try {
        await mySupabase.from('notifications').insert([{
            type: type,             // 'general' | 'submit' | 'grading' | 'question'
            title: title,
            description: description,
            target_url: targetUrl,
            is_read: false
        }]);
    } catch (err) {
        console.error('Notification Error:', err);
    }
}


async function autoPostAnnouncement(category, title, content, targetType = 'all', targetValue = '') {
    try {
        const payload = {
            category: category, // 'exam', 'consult', หรือ 'video'
            title: title,
            content: content,
            target_type: targetType, // 'all', 'level', 'course', 'specific'
            target_value: targetValue,
            created_at: new Date().toISOString()
        };

        // บันทึกลงตาราง announcements
        const { error } = await mySupabase.from('announcements').insert([payload]);
        if (error) throw error;

        // บันทึกลงตาราง notifications (ถ้ามีไว้แจ้งเตือนกระดิ่งแจ้งเตือนนักเรียน)
        await mySupabase.from('notifications').insert([{
            type: category,
            message: `${title}: ${content.substring(0, 60)}...`,
            created_at: new Date().toISOString()
        }]);

        console.log('Auto-announcement created successfully');
    } catch (err) {
        console.error('Failed to auto-create announcement:', err);
    }
}
