import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications, getUserIdsByRole, getUserIdsByRoles } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        // 1. SMART PRIORITY: Keyword Detection
        let priority = body.priority || 'Medium';
        const urgentKeywords = ['water', 'electricity', 'electric', 'shock', 'fuse', 'fire', 'spark', 'leak', 'medical', 'urgent', 'emergency', 'power', 'internet'];
        const descriptionLower = (body.description || '').toLowerCase();
        const titleLower = (body.subject || body.title || '').toLowerCase();
        
        const hasUrgentKeyword = urgentKeywords.some(keyword => 
            descriptionLower.includes(keyword) || titleLower.includes(keyword)
        );

        if (hasUrgentKeyword) {
            priority = 'High';
        }

        // 2. DUPLICATE DETECTION / SMART PRIORITY: Repeat complaints in same room
        if (body.roomNumber && body.department === 'Hostel') {
            const checkDuplicateQuery = `
                query CheckDuplicate($room: String!, $dept: String!) {
                    tickets(where: {
                        room_number: {_eq: $room},
                        department: {_eq: $dept},
                        status: {_nin: ["Completed", "Rejected"]}
                    }) {
                        id
                    }
                }
            `;
            const duplicateResult = await nhost.graphql.request(checkDuplicateQuery, {
                room: body.roomNumber,
                dept: body.department
            });
            
            if (duplicateResult.data?.tickets?.length >= 5) {
                priority = 'High';
            }
        }

        // 3. Categorization (Mess Specific) - No auto-deadline
        let category = body.category || null;
        let dueAt = null; // Start with no deadline until an admin assigns one

        if (body.department === 'Mess') {
            // Auto-categorize based on keywords but don't set a deadline
            if (/dirty|stale|fly|insect|unhygienic|clean/i.test(descriptionLower + titleLower)) {
                category = 'Hygiene';
                priority = 'High';
            } else if (/taste|salt|spice|undercooked|burnt|raw/i.test(descriptionLower + titleLower)) {
                category = 'Quality';
            } else if (/late|delay|time|schedule/i.test(descriptionLower + titleLower)) {
                category = 'Delay';
            } else {
                category = 'General';
            }
        }

        const mutation = `
            mutation InsertTicket($object: tickets_insert_input!) {
                insert_tickets_one(object: $object) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(mutation, {
                object: {
                    title: body.subject || body.title,
                    description: body.description,
                    status: body.status || 'Pending',
                    priority: priority,
                    department: body.department || 'Other',
                    type: body.type || 'Other',
                    submitted_by: body.studentName || body.submitted_by,
                    submitted_by_email: body.email || null,
                    image_url: body.image || body.image_url || null,
                    hostel_type: body.hostelType || null,
                    room_number: body.roomNumber || null,
                    block: body.block || null,
                    floor: body.floor || null,
                    category: category,
                    tags: body.tags || [],
                    due_at: dueAt ? (dueAt as Date).toISOString() : null,
                    votes: 0,
                    is_escalated: false
                }
            });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        // Send push notification for new complaint — target the right admins
        const department = body.department || 'Other';
        const complaintTitle = body.subject || body.title;

        if (department === 'Mess') {
            // Notify all users who can manage mess complaints (including hostel managers who also see mess complaints)
            const messManagerIds = await getUserIdsByRoles(['mess_admin', 'hostel_complaints', 'admin', 'developer', 'president']);
            if (messManagerIds.length > 0) {
                sendPushNotifications({
                    title: priority === 'High' ? `🚨 Urgent Mess Complaint` : `🍽️ New Mess Complaint`,
                    message: `"${complaintTitle}" — ${priority} Priority`,
                    type: 'complaint',
                    link: '/dashboard/mess-admin',
                    targetUserIds: messManagerIds,
                }).catch(err => console.error('[insert-ticket] Mess notification error:', err));
            }
        } else if (department === 'Hostel') {
            // 1. Notify Managers/Admins (Global Dashboard View)
            const globalRoles = ['hostel_complaints', 'admin', 'developer', 'president'];
            const globalManagerIds = await getUserIdsByRoles(globalRoles);
            
            if (globalManagerIds.length > 0) {
                sendPushNotifications({
                    title: priority === 'High' ? `🚨 Urgent Hostel Complaint` : `🏠 New Hostel Complaint`,
                    message: `"${complaintTitle}" — ${priority} Priority`,
                    type: 'complaint',
                    link: '/dashboard/hostel-complaints',
                    targetUserIds: globalManagerIds,
                }).catch(err => console.error('[insert-ticket] Global Hostel notification error:', err));
            }

            // 2. Notify Specific Warden (Specialized Dashboard View)
            if (body.hostelType === 'Boys Hostel') {
                const wardenIds = await getUserIdsByRole('boys-warden');
                if (wardenIds.length > 0) {
                    sendPushNotifications({
                        title: priority === 'High' ? `🚨 Urgent Boys Hostel Complaint` : `👦 New Boys Hostel Complaint`,
                        message: `"${complaintTitle}" — ${priority} Priority`,
                        type: 'complaint',
                        link: '/dashboard/boys-warden',
                        targetUserIds: wardenIds,
                    }).catch(err => console.error('[insert-ticket] Boys Warden notification error:', err));
                }
            } else if (body.hostelType === 'Girls Hostel') {
                const wardenIds = await getUserIdsByRole('girls-warden');
                if (wardenIds.length > 0) {
                    sendPushNotifications({
                        title: priority === 'High' ? `🚨 Urgent Girls Hostel Complaint` : `👧 New Girls Hostel Complaint`,
                        message: `"${complaintTitle}" — ${priority} Priority`,
                        type: 'complaint',
                        link: '/dashboard/girls-warden',
                        targetUserIds: wardenIds,
                    }).catch(err => console.error('[insert-ticket] Girls Warden notification error:', err));
                }
            }
        } else {
            // Other categories — broadcast
            sendPushNotifications({
                title: priority === 'High' ? `🚨 Urgent Complaint Filed` : `🎫 New Complaint Filed`,
                message: `"${complaintTitle}" — ${priority} Priority`,
                type: 'complaint',
                link: '/complaints',
            }).catch(err => console.error('[insert-ticket] Notification error:', err));
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
