import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const graphqlEndpoint = `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.graphql.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1`;

        const deleteUserMutation = `
            mutation DeleteUser($id: uuid!) {
                deleteUser(id: $id) {
                    id
                }
            }
        `;

        const response = await fetch(graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || '',
            },
            body: JSON.stringify({
                query: deleteUserMutation,
                variables: {
                    id: userId
                }
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            return NextResponse.json({ error: data.errors[0].message }, { status: 500 });
        }

        return NextResponse.json({ success: true, user: data.data.deleteUser });

    } catch (error: any) {
        console.error('Delete User Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
