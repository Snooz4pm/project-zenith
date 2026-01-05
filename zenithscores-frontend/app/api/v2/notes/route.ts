/**
 * Notes API v2 - Simplified wallet-based notes
 * 
 * GET  /api/v2/notes - List my notes
 * POST /api/v2/notes - Create note
 * DELETE /api/v2/notes/[id] - Delete note
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getWalletFromHeader, resolveWallet } from '@/lib/auth-helpers';

const prisma = new PrismaClient();

// GET - List my notes (requires wallet)
export async function GET(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to view notes' },
            { status: 401 }
        );
    }

    try {
        const context = req.nextUrl.searchParams.get('context');

        const notes = await prisma.note.findMany({
            where: {
                userId: user.id,
                ...(context && { context })
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ notes });

    } catch (error) {
        console.error('[Notes API] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }
}

// POST - Create note (requires wallet)
export async function POST(req: NextRequest) {
    const walletAddress = getWalletFromHeader(req);
    const { user } = await resolveWallet(walletAddress);

    if (!user) {
        return NextResponse.json(
            { error: 'Connect wallet to save notes' },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const { content, context } = body;

        if (!content || content.trim().length < 1) {
            return NextResponse.json(
                { error: 'Note content is required' },
                { status: 400 }
            );
        }

        const note = await prisma.note.create({
            data: {
                userId: user.id,
                content: content.trim(),
                context: context || null
            }
        });

        return NextResponse.json({ note }, { status: 201 });

    } catch (error) {
        console.error('[Notes API] POST error:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }
}
