import "next-auth";

declare module "next-auth" {
  // Extends the User stored in the database adapter
  interface User {
    sub: string;
    phone?: string | null;
  }

  interface Session {
    user: {
      sub: string;
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    phone?: string | null;
  }
}
