import axios from "axios";
import FormData from "form-data";
import fs from "fs"; // Import fs dengan promises
const API_KEY = "481652951d48d9898b14fd877816e905";
export const uploadToPostImages = async (filePath) => {
    try {
        let formData = new FormData();
        formData.append("image", fs.createReadStream(filePath)); // Mengirim gambar sebagai stream

        let response = await axios.post(`https://api.imgbb.com/1/upload?key=${API_KEY}`, formData, {
            headers: { ...formData.getHeaders() },
        });

        console.log(response.data.data.url);

        if (response.data && response.data.data && response.data.data.url) {
            console.log("✅ Direct URL Gambar:", response.data.data.url);
            return response.data.data.url;
        } else {
            throw new Error("Gagal mendapatkan direct URL.");
        }
    } catch (error) {
        console.error("❌ Error saat upload ke PostImages:", error.message);
        return null;
    }
};
