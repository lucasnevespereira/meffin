"use server";

import { auth } from "@/lib/auth";

const email = "toto@email.me";

export const signIn = async () => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password: "password",
      },
    });
    window.location.href = "/";
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const signUp = async () => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password: "password",
        name: email.split("@")[0],
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};
