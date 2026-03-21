import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { sendPushNotifications } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret
        });

        const mutation = `
            mutation InsertTicket($object: tickets_insert_input!) {
                insert_tickets_one(object: $object) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request({
            document: mutation,
            variables: {
                object: {
                    title: body.subject || body.title,
                    description: body.description,
                    status: body.status || 'Pending',
                    priority: body.priority || 'Medium',
                    department: body.department || 'Other',
                    type: body.type || 'Other',
                    submitted_by: body.studentName || body.submitted_by,
                    submitted_by_email: body.email || null,
                    image_url: body.image || body.image_url || null,
                    hostel_type: body.hostelType || null,
                    room_number: body.roomNumber || null,
                    votes: 0
                }
            }
        });

        const { data, error } = result;

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            
            // Fallback for missing column
            if (errorMessage.includes('submitted_by_email') || errorMessage.includes('column') || errorMessage.includes('field')) {
                console.warn('submitted_by_email column missing, retrying without it...');
                const fallbackResult = await nhost.graphql.request({
                    document: mutation,
                    variables: {
                        object: {
                            title: body.subject || body.title,
                            description: body.description,
                            status: body.status || 'Pending',
                            priority: body.priority || 'Medium',
                            department: body.department || 'Other',
                            type: body.type || 'Other',
                            submitted_by: body.studentName || body.submitted_by,
                            image_url: body.image || body.image_url || null,
                            hostel_type: body.hostelType || null,
                            room_number: body.roomNumber || null,
                            votes: 0
                        }
                    }
                });
                
                if (fallbackResult.error) {
                    const fallbackError = fallbackResult.error;
                    return NextResponse.json({ message: Array.isArray(fallbackError) ? fallbackError[0]?.message : (fallbackError as any).message }, { status: 400 });
                }

                // Send notification on fallback success
                sendPushNotifications({
                    title: `🎫 New Complaint Filed`,
                    message: `"${body.subject || body.title}" — ${body.department || 'General'}`,
                    type: 'complaint',
                    link: '/complaints',
                }).catch(err => console.error('[insert-ticket] Notification error:', err));

                return NextResponse.json({ success: true, data: fallbackResult.data }, { status: 200 });
            }

            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        // Send push notification for new complaint
        sendPushNotifications({
            title: `🎫 New Complaint Filed`,
            message: `"${body.subject || body.title}" — ${body.department || 'General'}`,
            type: 'complaint',
            link: '/complaints',
        }).catch(err => console.error('[insert-ticket] Notification error:', err));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
