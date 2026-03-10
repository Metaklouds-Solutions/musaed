import { Request } from 'express';
import { UserDocument } from '../../users/schemas/user.schema';

export interface AuthenticatedUser
  extends Pick<UserDocument, 'email' | 'name' | 'role' | 'status' | 'avatarUrl'> {
  _id: string;
  tenantId?: string;
  tenantRole?: string;
  /** Fine-grained permissions for RBAC. */
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  tenantId?: string | null;
}
