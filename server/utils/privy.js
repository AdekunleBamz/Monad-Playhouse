import { PrivyClient } from "@privy-io/server-auth";
import dotenv from 'dotenv';

dotenv.config();

export const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_API_KEY
);

export async function validatePrivyUser(privyId) {
  try {
    const user = await privy.getUser(privyId);
    return user ? true : false;
  } catch (error) {
    console.error('Privy validation failed:', error);
    return false;
  }
}

export async function getUserDetails(privyId) {
  try {
    const user = await privy.getUser(privyId);
    return user;
  } catch (error) {
    console.error('Failed to get user details:', error);
    return null;
  }
}
