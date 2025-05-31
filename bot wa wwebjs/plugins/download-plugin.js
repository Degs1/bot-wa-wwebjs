//import * as uploadImage from '../lib/uploadImage.js';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import downloadvid from '../lib/video-download.js';
import fetch from 'node-fetch';
import axios from 'axios';
import { MIMEType, promisify } from 'util';
const sleep = promisify(setTimeout);
import * as fs from 'fs';



const apiXterm = {
    url: process.env.XTERM_URL, // Ganti dengan URL API Xterm
    key: process.env.XTERM_API_KEY, // Ganti dengan API Key yang benar
  };


export default async function Downloadplugin(msg, url, type, client) {
    if (type.includes('tt')) {
        try {
            await msg.reply("Processing....")
            let result = await downloadvid(url, type);
            if (!result.status) return msg.reply(result.msg);
            
            const mp4HD = await result?.data?.media?.find(media => media.description === "Download MP4 [1]")?.url;
            const media = await MessageMedia.fromUrl(mp4HD, { unsafeMime: true });
            await client.sendMessage(msg.from, media, { caption: `✨ Ini hasil video dari link!`});
        } catch (error) {
            console.error("❌ Error dalam handleImageUpscale:", error);
            msg.reply("⚠️ Terjadi kesalahan dalam memproses link.");
        }
    } else if (type.includes('ig')) {
        try {
            await msg.reply("Processing....")
            let result = await downloadvid(url, type);
            if (!result.status) return msg.reply(result.msg);
            
            const mp4HD = await result.data.content[0].url
            const response = await axios.get(mp4HD, {
                responseType: 'arraybuffer',
                });

                const media = new MessageMedia(
                'video/mp4', // Force MIME type
                Buffer.from(response.data, 'binary').toString('base64'),
                'video.mp4' // Nama file saat dikirim
                );
            await client.sendMessage(msg.from, media, { caption: `✨ Ini hasil video dari link!`, });
        } catch (error) {
            console.error("❌ Error dalam handleImageUpscale:", error);
            msg.reply("⚠️ Terjadi kesalahan dalam memproses link.");
        }
    } else if (!["tt","ig"].includes(type)) {
        msg.reply("type atau link yang kamu masukan salah!")
    }
}