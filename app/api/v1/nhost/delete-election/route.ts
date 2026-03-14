import { NextResponse } from 'next/server';
import { NhostClient } from '@nhost/nhost-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ message: 'Missing election ID' }, { status: 400 });
        }

        const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || process.env.NHOST_SUBDOMAIN;
        const region = process.env.NEXT_PUBLIC_NHOST_REGION || process.env.NHOST_REGION;
        const adminSecret = process.env.NHOST_ADMIN_SECRET;

        if (!subdomain || !region || !adminSecret) {
            console.error("Missing Nhost configuration in environment variables");
            return NextResponse.json({ 
                message: "Server configuration error: Missing Nhost environment variables" 
            }, { status: 500 });
        }

        const nhost = new NhostClient({
            subdomain,
            region,
            adminSecret
        });

        const mutation = `
            mutation DeleteElection($id: uuid!) {
                delete_elections_by_pk(id: $id) {
                    id
                }
            }
        `;

        const { data, error } = await nhost.graphql.request(mutation, { id: body.id });

        if (error) {
            console.error("GraphQL Error:", error);
            const errorMessage = Array.isArray(error) ? error[0]?.message : (error as any).message;
            return NextResponse.json({ message: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (err: any) {
        console.error("Server error in delete-election:", err);
        return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
    }
}
