//import * as uploadImage from '../lib/uploadImage.js';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import downloadvid from '../lib/video-download.js';
import fetch from 'node-fetch';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import uploadImage from '../lib/uploadImage.js';



const apiXterm = {
    url: process.env.XTERM_URL, // Ganti dengan URL API Xterm
    key: process.env.XTERM_API_KEY, // Ganti dengan API Key yang benar
  };


export default async function Downloadplugin(msg, url, type, client) {
    if (type === "tt") {
        try {
            await msg.reply("Processing....")
            let result = await downloadvid(url, type);
            if (!result.status) return msg.reply(result.msg);
            
            const mp4HD = await result?.data?.media?.find(media => media.description === "Download MP4 [1]")?.url;
            //console.log(mp4HD);
            //const response = await fetch(mp4HD);
            //if (!response.ok) throw new Error(`Gagal mengambil video: ${response.statusText}`);

            //const buffer = await response.buffer();
            //const filePath = "./temp/video.mp4";
            //fs.writeFileSync(filePath, buffer);

        // const enhanceMedia = new MessageMedia('video/mp4', buffer.toString('base64'));
            const media = await MessageMedia.fromUrl(mp4HD, { unsafeMime: true });
            //console.log(media.mimetype);
            await client.sendMessage(msg.from, media, { caption: `✨ Ini hasil video dari link!`, sendMediaAsDocument: true});
            //fs.unlinkSync(filePath);
        } catch (error) {
            //const filePath = "./temp/video.mp4";
            console.error("❌ Error dalam handleImageUpscale:", error);
            msg.reply("⚠️ Terjadi kesalahan dalam memproses link.");
            //fs.unlinkSync(filePath);
        }
    } else if (type === "ig") {
        try {
            await msg.reply("Processing....")
            let result = await downloadvid(url, type);
            if (!result.status) return msg.reply(result.msg);
            
            const mp4HD = await result.data.content[0].url
            //console.log(mp4HD);
            const response = await fetch(mp4HD);
            if (!response.ok) throw new Error(`Gagal mengambil video: ${response.statusText}`);

            const buffer = await response.buffer();
            const filePath = "./temp/video.mp4";
            fs.writeFileSync(filePath, buffer);

        // const enhanceMedia = new MessageMedia('video/mp4', buffer.toString('base64'));
            const media = await MessageMedia.fromFilePath("./temp/video.mp4");
            //console.log(media.mimetype);
            await client.sendMessage(msg.from, media, { caption: `✨ Ini hasil video dari link!`, sendMediaAsDocument: true});
            fs.unlinkSync(filePath);
        } catch (error) {
            const filePath = "./temp/video.mp4";
            console.error("❌ Error dalam handleImageUpscale:", error);
            msg.reply("⚠️ Terjadi kesalahan dalam memproses link.");
            fs.unlinkSync(filePath);
        }
    } else if (!["tt","ig"].includes(type)) {
        msg.reply("type atau link yang kamu masukan salah!")
    }
}