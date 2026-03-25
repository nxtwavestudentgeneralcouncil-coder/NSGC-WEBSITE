import { NextRequest, NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';
import { verifySession, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication & Authorization
        const session = await verifySession(req, ['president', 'admin', 'developer', 'council']);
        if (!session) {
            const basicSession = await verifySession(req);
            if (!basicSession) {
                return unauthorizedResponse('Authentication required to update achievements');
            }
            return forbiddenResponse('You do not have permission to update achievements');
        }

        const body = await req.json();

        const adminSecret = (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim();
        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret,
        });

        const mutation = `
            mutation UpdateAchievement($id: uuid!, $title: String!, $category: String!, $tier: String, $achievement_date: date!, $description: String!, $image_url: String, $added_by_role: String) {
                update_achievements_by_pk(pk_columns: { id: $id }, _set: {
                    title: $title,
                    category: $category,
                    tier: $tier,
                    achievement_date: $achievement_date,
                    description: $description,
                    image_url: $image_url,
                    added_by_role: $added_by_role
                }) {
                    id
                }
            }
        `;

        const payload = {
            id: body.id,
            title: body.student || body.title || 'Anonymous',
            category: (body.category || 'academic').toLowerCase(),
            tier: body.tier || null,
            achievement_date: body.date || new Date().toISOString().split('T')[0],
            description: body.description || body.title || '',
            image_url: body.image || null,
            added_by_role: body.added_by_role || 'President'
        };

        const result = await nhost.graphql.request(mutation, payload);

        const { data, error } = result;

        if (error) {
            console.error("GraphQL Error:", error);
            return NextResponse.json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
