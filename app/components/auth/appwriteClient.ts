import { Client, Account, Databases, ID, Query, Teams } from "appwrite";
import { Storage } from "appwrite";
import { OAuthProvider } from "appwrite";

export const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) // Es: 'https://cloud.appwrite.io/v1'
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!); // Il tuo projectId

export const account = new Account(client);
export const databases = new Databases(client);
export const teams = new Teams(client);
export const storage = new Storage(client);

export { ID, Query };

export function appwriteOAuthGoogle() {
  account.createOAuth2Session(
    OAuthProvider.Google,
    window.location.origin, // redirect dopo login
    window.location.origin // redirect dopo errore
  );
}

// Helper per creare user_info con tutti i campi richiesti
export async function createUserInfo({
  uuid,
  name,
  email,
}: {
  uuid: string;
  name: string;
  email: string;
}) {
  return databases.createDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DB!, // databaseId
    process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION!, // collectionId
    ID.unique(),
    {
      uuid,
      name,
      email,
      phone_number: null,
      street_address: null,
      apartment_number: null,
      nation: null,
      state: null,
      postal_code: null,
      shipping_info: null,
    }
  );
}
