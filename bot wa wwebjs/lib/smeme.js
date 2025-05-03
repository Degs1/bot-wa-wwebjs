//import axios from "axios";
import { Buffer } from "buffer";
import * as fs from 'fs';
//import enhance from '../lib/enhance.js';
import fetch from 'node-fetch';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
import { writeFile, mkdir } from 'fs/promises';
import axios from 'axios';
import FormData from 'form-data';
import uploadImage from '../lib/uploadImage.js';
import * as dotenv from "dotenv";
import { uploadToPostImages } from "./uploadpostimage.js";
dotenv.config();



export default async function smemeget(m, text1, text2, conn) {
    try {
        let med=await m.downloadMedia();

        // 🔹 Gunakan nama default jika filename tidak ada
        const fileName = med.filename || `image_${Date.now()}.jpg`;
        const filePath = `./temp/${fileName}`;

        // 🔹 Simpan media dari WhatsApp ke file sementara
        await writeFile(filePath, med.data, 'base64');

        // 🔹 Upload ke Catbox
        const imageUrl = await uploadToPostImages(filePath);
        if (!imageUrl) return m.reply("⚠️ Gagal mengunggah gambar ke Catbox.");

        console.log("✅ Gambar berhasil diunggah ke i bii:", imageUrl);
        fs.unlinkSync(filePath);

        //let media = await m.download();
        await m.reply("Processing....");
        // 🔹 Encode teks agar aman di URL
        let encodedText1 = encodeURIComponent(text1);
        let encodedText2 = encodeURIComponent(text2);

        // 🔹 Gunakan API Siputzx
        let enhanceUrl = `https://api.siputzx.my.id/api/m/memgen?link=${encodeURIComponent(imageUrl)}&top=${encodedText1}&bottom=${encodedText2}&font=1`;

        console.log("📤 URL API:", enhanceUrl);

        // 🔹 Ambil hasil gambar dari API
        const response = await axios.get(enhanceUrl, { responseType: "arraybuffer" });
        if (!response.data) throw new Error("Gagal mengambil gambar dari API.");

        // 🔹 Simpan hasil ke folder sementara
        const outputFilePath = `./temp/meme_${Date.now()}.jpg`;
        await writeFile(outputFilePath, Buffer.from(response.data));

        console.log("✅ Gambar hasil disimpan di:", outputFilePath);
        return { status: true, filePath: outputFilePath };

    } catch (error) {
       // const filePpath = "./temp/meme-maker.png";
        console.error("❌ Error dalam handleImageUpscale:", error.message);
        //m.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
        //fs.unlinkSync(filePpath);
        return {status: false};
    }
}