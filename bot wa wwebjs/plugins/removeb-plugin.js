import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import removebg from '../lib/b-remover.js';
import * as fetch from 'node-fetch';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import uploadImage from '../lib/uploadImage.js';


async function removeplugin(m ,client) {
    try {
        let med=await m.downloadMedia();
    
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
        let result = await removebg(m, link, client);
        
        if (!result.status) return m.reply(result.msgg);
    } catch (error) {
        console.error("❌ Error dalam handleImageremovebg:", error.message);
        m.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
    }
}

export default removeplugin;
  export {};