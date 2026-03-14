import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const nhost = new NhostClient({
            subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '',
            region: process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '',
            adminSecret: process.env.NHOST_ADMIN_SECRET || ''
        });

        const mutation = `
            mutation InsertTicket($object: tickets_insert_input!) {
                insert_tickets_one(object: $object) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
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
        });

        if (error) {
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message || String(error);
            
            // Fallback for missing column
            if (errorMessage.includes('submitted_by_email') || errorMessage.includes('column') || errorMessage.includes('field')) {
                console.warn('submitted_by_email column missing, retrying without it...');
                const fallbackResult = await nhost.graphql.request(mutation, {
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
                });
                
                if (fallbackResult.error) {
                    return NextResponse.json({ message: Array.isArray(fallbackResult.error) ? fallbackResult.error[0]?.message : (fallbackResult.error as any).message }, { status: 400 });
                }
                return NextResponse.json({ success: true, data: fallbackResult.data }, { status: 200 });
            }

            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error:", err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
