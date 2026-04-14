// src/actions/auth.ts
'use server';

import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RoleType } from "@prisma/client";

export async function registerInitialAdmin(email: string, pass: string, name: string) {
  const hashedPassword = await bcrypt.hash(pass, 10);
  
  try {
    // Check if any super admin exists
    const existingAdmin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" }
    });

    if (existingAdmin) {
      throw new Error("Super Admin already exists. Please login.");
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName: name,
        lastName: "",
        role: "SUPER_ADMIN",
      }
    });

    return { success: true, user: { id: user.id, email: user.email, role: user.role } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginUser(email: string, pass: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: { branch: true }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Invalid credentials" };
    }

    return { 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branch?.name || null
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
