import * as fetch from 'node-fetch';
import FormData from 'form-data';
const fromBuffer = async (buffer) => {
  const { fileTypeFromBuffer } = await import('file-type');
  return fileTypeFromBuffer(buffer);
};
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const uploadImage = async (filePath) => {
    try {
        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(filePath));
        form.append('reqtype', 'fileupload');

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
        });

        if (response.data.includes("https://files.catbox.moe")) {
            return response.data.trim();
        } else {
            throw new Error("❌ Gagal mengunggah ke Catbox!");
        }
    } catch (error) {
        console.error("❌ Error saat upload ke Catbox:", error.message);
        return null;
    }
};
export default uploadImage;

export {};
