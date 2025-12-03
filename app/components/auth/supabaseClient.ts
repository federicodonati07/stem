import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY_RSL!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// Environment variables for database tables
export const USER_COLLECTION =
  process.env.NEXT_PUBLIC_SUPABASE_USER_COLLECTION || "user_info";
export const PRODUCTS_DB =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_DB || "products";
export const PRODUCTS_STORAGE =
  process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_STORAGE || "products";
export const CLIENT_CUSTOMIZATION_STORAGE =
  process.env.NEXT_PUBLIC_SUPABASE_CLIENT_CUSTOMIZATION_STORAGE || "client_customization";
export const CATEGORIES_DB =
  process.env.NEXT_PUBLIC_SUPABASE_CATEGORIES_DB || "categories";
export const CARTS_DB = process.env.NEXT_PUBLIC_SUPABASE_CARTS_DB || "carts";
export const ORDERS_DB = process.env.NEXT_PUBLIC_SUPABASE_ORDERS_DB || "orders";
export const ADMINS_DB = process.env.NEXT_PUBLIC_SUPABASE_ADMINS_DB || "admins";

// Helper function for Google OAuth
export async function supabaseOAuthGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/login?oauth=1`
          : undefined,
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    throw error;
  }

  return data;
}

// Helper to create user_info with all required fields
export async function createUserInfo({
  uuid,
  name,
  email,
}: {
  uuid: string;
  name: string;
  email: string;
}) {
  const { data, error } = await supabase
    .from(USER_COLLECTION)
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating user_info:", error);
    throw error;
  }

  return data;
}

// Get current user
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return user;
}

// Get user session
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  return session;
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

// Storage helpers
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false,
    });

  if (error) {
    console.error("Error uploading file:", error);
    throw error;
  }

  return data;
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

// Generate unique ID (replacement for Appwrite's ID.unique())
export function generateId() {
  return crypto.randomUUID();
}
