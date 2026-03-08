import { Request, Response } from 'express';
import { NhostClient } from '@nhost/nhost-js';

export default async (req: Request, res: Response) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).send({ message: 'Method not allowed.' });
    }

    const { userId, defaultRole, roles } = req.body;

    if (!userId || !defaultRole || !roles || !Array.isArray(roles)) {
        return res.status(400).send({ message: 'Missing required body parameters.' });
    }

    const nhost = new NhostClient({
        subdomain: process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
    });

    const mutation = `
        mutation UpdateUserRoles($userId: uuid!, $defaultRole: String!, $userRoles: [authUserRoles_insert_input!]!) {
            updateUser(id: $userId, _set: { defaultRole: $defaultRole }) {
                id
            }
            deleteAuthUserRoles(where: { userId: { _eq: $userId } }) {
                affected_rows
            }
            insertAuthUserRoles(objects: $userRoles) {
                affected_rows
            }
        }
    `;

    const userRolesToInsert = roles.map((role: string) => ({
        userId,
        role
    }));

    try {
        const { data, error } = await nhost.graphql.request(mutation, {
            userId,
            defaultRole,
            userRoles: userRolesToInsert
        }, {
            headers: {
                // Must pass the admin secret header securely from the backend to bypass permissions
                'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || ''
            }
        });

        if (error) {
            console.error("GraphQL Error:", error);
            // Return first error message back to client clearly
            return res.status(400).json({ message: Array.isArray(error) ? error[0]?.message : (error as any).message });
        }

        return res.status(200).json({ success: true, data });
    } catch (err: any) {
        console.error("Function Error:", err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
};
