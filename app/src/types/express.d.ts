import { User as UserModel } from "./models.d.ts";

export {}

declare global {
  namespace Express {
    export interface Request {
      currentUser?: UserModel;
      isAuthenticated?: () => boolean;
      flash?: (type: string, message: string) => void;
    }
    export interface User extends UserModel {}
  }
}
