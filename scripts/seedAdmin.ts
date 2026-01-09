import { prisma } from "../src/lib/prisma";
import { userRole } from "../src/middlewares/auth";

async function seedAdmin() {
  try {
    const adminData = {
      name: "admin",
      email: "admin@example.com",
      userRole: userRole.ADMIN,
      password: "admin1234",
    };

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });
    if (existingAdmin) {
      throw new Error("Admin user already exists. Skipping seeding.");
      return;
    }
    const signUpAdmin = await fetch(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      }
    );
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}
