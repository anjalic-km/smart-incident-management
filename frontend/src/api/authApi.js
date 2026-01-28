import api from "./axios";

export const login = async (email, password) => {
  return api.post("/auth/login", {
    email,
    password,
  });
};

export const register = async (payload) => {
  return api.post("/auth/register", payload);
};

export const getCurrentUser = async () => {
  return api.get("/me");
};
