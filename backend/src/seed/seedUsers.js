import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { connectDB } from "../config/db.js";

async function seedUsers() {
  try {
    await connectDB();
    
    // Delete existing sample users to fix double-hashing issue
    await User.deleteMany({ email: { $in: ["tenant@example.com", "owner@example.com"] } });

    const tenant = new User({
      email: "tenant@example.com",
      password: "password123",
      full_name: "Sample Tenant",
      roles: ["tenant"]
    });
    await tenant.save();
    console.log("Created sample tenant: tenant@example.com / password123");

    const owner = new User({
      email: "owner@example.com",
      password: "password123",
      full_name: "Sample Owner",
      roles: ["owner"]
    });
    await owner.save();
    console.log("Created sample owner: owner@example.com / password123");

    console.log("User seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
