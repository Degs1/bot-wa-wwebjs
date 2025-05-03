// Jika Anda menggunakan ES Module, pastikan "type": "module" di package.json
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import fetch from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
// Jika Anda menggunakan CommonJS dan ingin menggunakan require, gunakan kode berikut:
//import * as fetch from 'node-fetch';

const api = {
  xterm: {
    url: `https://aihub.xtermai.xyz`, // Ganti dengan URL API Xterm
    key: `AIzaybQl6WinKVcqZTAy`, // Ganti dengan API Key yang benar
  }
};

async function removebg(msg ,imageUrl, client) {
    try {
      const response = await fetch(`${api.xterm.url}/api/tools/image-removebg?url=${encodeURIComponent(imageUrl)}&key=${api.xterm.key}&format=png`);
      const stat = await response.json();
      if (stat.status === true) {
        console.log("Background removal successful!");
        //console.log("Hasil:", stat.data.url);
        let removedUrl = `${stat.data.url}`
        //console.log("Removed Media:", removedMedia);
        const response = await fetch(removedUrl);
        if (!response.ok) throw new Error(`Gagal mengambil foto: ${response.statusText}`);
                    
        const buffer = await response.buffer();
        const filePpath = "./temp/removed-bg.png";
        fs.writeFileSync(filePpath, buffer);

        const removedMedia = await MessageMedia.fromFilePath("./temp/removed-bg.png");
        await client.sendMessage(msg.from, removedMedia, {
           caption: `✨ Ini hasil remove backround dengan AI!`,
           sendMediaAsDocument: true 
          });
          fs.unlinkSync(filePpath);
        return { status : true };
      } else {
        const filePpath = "./temp/removed-bg.png";
        fs.unlinkSync(filePpath);
        console.error("Background removal failed:", stat.status);
        return { status: false, msgg: "Remove Background gagal." };
      }
    } catch (error) {
      console.error("❌ Error dalam handleImageremovebg:", error.message);
      //msg.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
      return { status: false, msgg: "Remove Background gagal." };
    }
  }

  export default removebg;
  export {};
