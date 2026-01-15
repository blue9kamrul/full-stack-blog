import { prisma } from "../src/lib/prisma";
import { userRole } from "../src/middlewares/auth";

async function seedAdmin() {
  try {
    const adminData = {
      name: "admin1",
      email: "admin1@example.com",
      password: "admin1234",
    };

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminData.email },
    });
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping seeding.");
      return;
    }
    const signUpAdmin = await fetch(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:4000",
        },
        body: JSON.stringify(adminData),
      }
    );
    const responseData = await signUpAdmin.json();
    console.log("Response status:", signUpAdmin.status);

    if (signUpAdmin.ok && responseData.user) {
      // Update the user to set role as ADMIN and emailVerified as true
      const updatedUser = await prisma.user.update({
        where: { id: responseData.user.id },
        data: {
          role: userRole.ADMIN,
          emailVerified: true,
        },
      });
      console.log("Admin user created successfully:", {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: updatedUser.emailVerified,
      });
    } else {
      console.error("Failed to create admin user:", responseData);
    }
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}

seedAdmin();
