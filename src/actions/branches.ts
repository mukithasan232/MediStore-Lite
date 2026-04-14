// src/actions/branches.ts
'use server';

import { db } from "@/lib/prisma";

export async function createBranch(data: { name: string, code: string, address: string }) {
  try {
    const branch = await db.branch.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
      }
    });
    return { success: true, branch };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllBranches() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, branches };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
