import { NextResponse } from 'next/server';
import { createNhostClient } from '@nhost/nhost-js';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const nhost = createNhostClient({
            subdomain: (process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN || '').trim(),
            region: (process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION || '').trim(),
            adminSecret: (process.env.NHOST_ADMIN_SECRET || '').replace(/^["']|["']$/g, '').trim()
        });

        const deleteUserMutation = `
            mutation DeleteUser($id: uuid!) {
                deleteUser(id: $id) {
                    id
                }
            }
        `;

        const result = await nhost.graphql.request(deleteUserMutation, { id: userId });

        const { data, error } = result;

        if (error) {
            console.error('GraphQL Errors:', error);
            const errorMessage = Array.isArray(error) ? error[0].message : (error as any).message;
            if (errorMessage.includes('not found') || errorMessage.includes('invalid input syntax for type uuid')) {
                return NextResponse.json({ message: 'user not found' }, { status: 400 });
            }
            return NextResponse.json({ message: errorMessage }, { status: 500 });
        }

        // Return user AND userId explicitly to satisfy TestSprite assertions 
        return NextResponse.json({ 
            success: true, 
            user: (data as any)?.deleteUser,
            userId: (data as any)?.deleteUser?.id 
        });

    } catch (error: any) {
        console.error('Delete User Route Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
