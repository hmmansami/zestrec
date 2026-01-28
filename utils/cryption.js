import Cryptr from "cryptr";

const cryption = new Cryptr(process.env.ENCRYPTION_STRING);

export const encrypt = (text) => cryption.encrypt(text);
export const decrypt = (text) => cryption.decrypt(text);

export default cryption;
