import api from "./api";


export const registerUser = async (data) => {

    return await api.post(
        "/auth/register",
        data
    );

};