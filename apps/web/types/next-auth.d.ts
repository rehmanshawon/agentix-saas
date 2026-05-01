import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      workspaceId?: string;
      workspaceName?: string;
    };
  }

  interface User {
    workspaceId?: string;
    workspaceName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    workspaceId?: string;
    workspaceName?: string;
  }
}

export {};
