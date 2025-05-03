//import * as uploadImage from '../lib/uploadImage.js';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import enhance from '../lib/enhance.js';
import fetch from 'node-fetch';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import uploadImage from '../lib/uploadImage.js';
import * as dotenv from "dotenv";
dotenv.config();

let prefix=process.env.prefix

const apiXterm = {
    url: process.env.XTERM_URL, // Ganti dengan URL API Xterm
    key: process.env.XTERM_API_KEY, // Ganti dengan API Key yang benar
  };
let instructions = `*SILAHKAN PILIH TYPE YANG TERSEDIA!*
▪︎ Photo style
- phox2 
- phox4
▪︎ Anime style
- anix2
- anix4
▪︎ Standard
- stdx2
- stdx4
▪︎ Face Enhance
- cf
▪︎ Object text
- text

_Cara penggunaan: Kirim gambar dengan caption:_  *${prefix}hdin phox4*`;

//



let handler = async (m, { text, conn }) => {
    try {
        let med=await m.downloadMedia();
        console.log("Tipe yang diterima:", text);
        if (!text) return m.reply(instructions);
        if (!["phox2", "phox4", "anix2", "anix4", "stdx2", "stdx4", "cf", "text"].includes(text)) {
            return m.reply("Type tidak ada! Mungkin salah ketik!\n\n" + instructions);
        }

        // 🔹 Gunakan nama default jika filename tidak ada
        const fileName = med.filename || `image_${Date.now()}.jpg`;
        const filePath = `./temp/${fileName}`;

        // 🔹 Simpan media dari WhatsApp ke file sementara
        await writeFile(filePath, med.data, 'base64');

        // 🔹 Upload ke Catbox
        const imageUrl = await uploadImage(filePath);
        if (!imageUrl) return m.reply("⚠️ Gagal mengunggah gambar ke Catbox.");

        console.log("✅ Gambar berhasil diunggah ke Catbox:", imageUrl);

        //let media = await m.download();
        await m.reply("Processing....");
        let link = imageUrl
        let result = await enhance(link, text);



        if (!result.status) return m.reply(result.msg);
        let enhanceUrl=`${apiXterm.url}/api/tools/buffimg?url=${result.output}&key=${apiXterm.key}`
        const enhanceMedia = await MessageMedia.fromUrl(enhanceUrl, { unsafeMime: true });
        await conn.sendMessage(m.from, enhanceMedia, { caption: `✨ Ini hasil upscaling dengan AI!` });
    } catch (error) {
        console.error("❌ Error dalam handleImageUpscale:", error.message);
        m.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
    }
};

handler.help = ['enhance (gunakan caption pada gambar)'];
handler.tags = ['tools'];
handler.command = /^(enhance|upscale)$/i;

export default async function enhancePluginn(m, { text, conn }) {
        try {
            let med=await m.downloadMedia();
            console.log("Tipe yang diterima:", text);
            if (!text) return m.reply(instructions);
            if (!["phox2", "phox4", "anix2", "anix4", "stdx2", "stdx4", "cf", "text"].includes(text)) {
                return m.reply("Type tidak ada! Mungkin salah ketik!\n\n" + instructions);
            }
    
            // 🔹 Gunakan nama default jika filename tidak ada
            const fileName = med.filename || `image_${Date.now()}.jpg`;
            const filePath = `./temp/${fileName}`;
    
            // 🔹 Simpan media dari WhatsApp ke file sementara
            await writeFile(filePath, med.data, 'base64');
    
            // 🔹 Upload ke Catbox
            const imageUrl = await uploadImage(filePath);
            if (!imageUrl) return m.reply("⚠️ Gagal mengunggah gambar ke Catbox.");
    
            console.log("✅ Gambar berhasil diunggah ke Catbox:", imageUrl);
            fs.unlinkSync(filePath);
    
            //let media = await m.download();
            await m.reply("Processing....");
            let link = imageUrl
            let result = await enhance(link, text);
            
            if (!result.status) return m.reply(result.msg);
            let enhanceUrl=`${apiXterm.url}/api/tools/buffimg?url=${result.output}&key=${apiXterm.key}`

            const response = await fetch(enhanceUrl);
            if (!response.ok) throw new Error(`Gagal mengambil foto: ${response.statusText}`);
            
            const buffer = await response.buffer();
            const filePpath = "./temp/enhanced.png";
            fs.writeFileSync(filePpath, buffer);

            const enhanceMedia = await MessageMedia.fromFilePath("./temp/enhanced.png");
            await conn.sendMessage(m.from, enhanceMedia, { 
                caption: `✨ Ini hasil upscaling dengan AI!`, 
                sendMediaAsDocument: true 
            });
            fs.unlinkSync(filePpath);
        } catch (error) {
            console.error("❌ Error dalam handleImageUpscale:", error.message);
            m.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
        }
    
    handler.help = ['enhance (gunakan caption pada gambar)'];
    handler.tags = ['tools'];
    handler.command = /^(enhance|upscale)$/i;
    
}
