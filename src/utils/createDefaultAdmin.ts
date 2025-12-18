import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { Role, Status } from "../models/user.model";

export const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFullname = process.env.ADMIN_FULLNAME;

    if (!adminEmail || !adminPassword || !adminFullname) {
      console.warn("Admin env variables not set");
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Default admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      fullname: adminFullname,
      email: adminEmail,
      password: hashedPassword,
      roles: [Role.ADMIN],
      approved: Status.APPROVED
    });

    console.log("Default admin user created successfully");
  } catch (error) {
    console.error("Error creating default admin:", error);
  }
};