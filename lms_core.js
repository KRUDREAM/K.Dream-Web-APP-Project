// lms_core.js - สคริปต์กลางสำหรับระบบ Realtime Notifications & Audit Logs

// Helper สำหรับดึง Supabase Client จากหน้าเว็บ
function getSupabase() {
    return window.mySupabase || (typeof mySupabase !== 'undefined' ? mySupabase : null);
}

// 1. ฟังก์ชันโพสต์ประกาศและแจ้งเตือนอัตโนมัติ (แก้ไขให้ตรงกับโครงสร้างตาราง notifications)
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

async function logSystemAction(actionType, description, metadata = {}) {
    try {
        // ดึงชื่อและบทบาทจาก localStorage หรือหน้าจอ
        const userId = localStorage.getItem('user_id') || localStorage.getItem('student_id') || 'admin';
        const userName = localStorage.getItem('admin_name') || localStorage.getItem('student_name') || document.getElementById('adminNavName')?.textContent || 'ผู้ดูแลระบบ';
        const userRole = localStorage.getItem('role') || 'admin'; // ถ้าอยู่หน้าแอดมิน role จะเป็น admin

        if (typeof mySupabase !== 'undefined') {
            await mySupabase.from('audit_logs').insert([{
                user_id: userId,
                user_name: userName,
                role: userRole,
                action_type: actionType,
                description: description,
                metadata: metadata
            }]);
        }
    } catch (err) {
        console.warn("Failed to log admin action:", err);
    }
}


