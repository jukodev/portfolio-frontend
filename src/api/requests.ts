// The original header can still use this wrapper; all data comes from ASP.NET.
import { request } from '../portfolio-api';
export async function getUsers(): Promise<User[]> {
  const users = await request<{ name: string }[]>('users');
  return users.map(user => ({ name: user.name, avatar: '' }));
}
