// lms_core.js - สคริปต์กลางสำหรับระบบ Realtime Notifications & Audit Logs

// Helper สำหรับดึง Supabase Client จากหน้าเว็บ
function getSupabase() {
    return window.mySupabase || (typeof mySupabase !== 'undefined' ? mySupabase : null);
}

// 1. ฟังก์ชันสร้าง Audit Log เมื่อมีการกระทำใดๆ ในระบบ
async function logAuditEvent(actionType, moduleName, description) {
    try {
        const client = getSupabase();
        if (!client) return;

        const userName = localStorage.getItem('account_name') || localStorage.getItem('admin_username') || localStorage.getItem('user_name') || 'ผู้ดูแลระบบ';
        await client.from('audit_logs').insert([{
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
        const client = getSupabase();
        if (!client) return;

        await client.from('notifications').insert([{
            type: type,           // 'general' | 'submit' | 'grading' | 'question'
            title: title,
            description: description,
            target_url: targetUrl,
            is_read: false
        }]);
    } catch (err) {
        console.error('Notification Error:', err);
    }
}

// 3. ฟังก์ชันโพสต์ประกาศและแจ้งเตือนอัตโนมัติ (แก้ไขให้ตรงกับโครงสร้างตาราง notifications)
async function autoPostAnnouncement(category, title, content, targetType = 'all', targetValue = '') {
    try {
        const client = getSupabase();
        if (!client) {
            console.error('Supabase client not found');
            return;
        }

        const payload = {
            category: category, // 'exam', 'consult', หรือ 'video'
            title: title,
            content: content,
            target_type: targetType, // 'all', 'level', 'course', 'specific'
            target_value: targetValue,
            created_at: new Date().toISOString()
        };

        // บันทึกลงตาราง announcements
        const { error } = await client.from('announcements').insert([payload]);
        if (error) {
            console.error('Announcements Insert Error:', error.message);
            throw error;
        }

        // บันทึกลงตาราง notifications (ใช้ title และ description ให้ตรงกับโครงสร้างจริง)
        await client.from('notifications').insert([{
            type: category,
            title: `[ประกาศ] ${title}`,
            description: content.substring(0, 150),
            target_url: 'admin.html',
            is_read: false,
            created_at: new Date().toISOString()
        }]);

        console.log('Auto-announcement created successfully');
    } catch (err) {
        console.error('Failed to auto-create announcement:', err);
    }
}
