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
            mutation InsertAchievement($title: String!, $category: String!, $achievement_date: date!, $description: String!, $image_url: String, $student_id: uuid) {
                insert_achievements_one(object: {
                    title: $title,
                    category: $category,
                    achievement_date: $achievement_date,
                    description: $description,
                    image_url: $image_url,
                    student_id: $student_id
                }) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, {
            title: body.title,
            category: (body.category || 'general').toLowerCase(),
            achievement_date: body.date || new Date().toISOString().split('T')[0],
            description: body.description || '',
            image_url: body.image || null,
            student_id: body.student_id || null
        });

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
