import { Request, Response } from 'express';
import { NhostClient } from '@nhost/nhost-js';

export default async (req: Request, res: Response) => {
    // Only allow POST or GET
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).send({ message: 'Method not allowed.' });
    }

    // Initialize Nhost client using environment variables provided by the Nhost serverless environment
    const nhost = new NhostClient({
        subdomain: process.env.NHOST_SUBDOMAIN || '',
        region: process.env.NHOST_REGION || '',
        adminSecret: process.env.NHOST_ADMIN_SECRET || ''
    });

    const query = `
        query GetUsers {
            users {
                id
                displayName
                email
                defaultRole
                roles {
                    role
                }
            }
        }
    `;

    try {
        // Use the admin secret to bypass all Hasura permissions
        const { data, error } = await nhost.graphql.request(query, undefined, {
            headers: {
                'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET || ''
            }
        });

        if (error) {
            console.error(error);
            return res.status(500).json(error);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json(error);
    }
};
