import axios from 'axios';
import * as dotenv from "dotenv";
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
dotenv.config();
let cmd = process.env.prefix

export default async function sendRamalanCinta(message) {
    try {
        let media;
        // Ambil teks setelah "!cocok"
        const args = message.body.split(' ');
        if (args.length < 3) {
            message.reply(`❌ Format salah! Gunakan: *${cmd}ramalcinta [namamu] [nama pasangan]* (gunakan "_" untuk nama lebih dari satu kata)`);
            return;
        }

        const namaAnda = args[1].replace(/_/g, ' ');
        const namaPasangan = args[2] ? args[2].replace(/_/g, ' ') : 'Pasangan Tidak Diketahui';

        // Ambil data dari API (Ganti dengan API-mu yang support parameter nama)
        const response = await axios.get(`https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${namaAnda}&nama2=${namaPasangan}`);
        const data = response.data.data;

        if (data.gambar === "https://primbon.com/ramalan_kecocokan_cinta1.png") {
            media = MessageMedia.fromFilePath('./config/heart/hati1.png');

        } else if (data.gambar === "https://primbon.com/ramalan_kecocokan_cinta2.png") {
            media = MessageMedia.fromFilePath('./config/heart/hati2.png');

        } else if (data.gambar === "https://primbon.com/ramalan_kecocokan_cinta3.png") {
            media = MessageMedia.fromFilePath('./config/heart/hati3.png');

        } else if (data.gambar === "https://primbon.com/ramalan_kecocokan_cinta4.png") {
            media = MessageMedia.fromFilePath('./config/heart/hati4.png');

        } else if (data.gambar === "https://primbon.com/ramalan_kecocokan_cinta5.png") {
            media = MessageMedia.fromFilePath('./config/heart/hati5.png');
        }

        //const media = await MessageMedia.fromUrl(data.gambar);

        let pesan = '*[Ramalan Kecocokan Pasangan]*\n\n';
        pesan += `💑 *${data.nama_anda} ❤️ ${data.nama_pasangan}*\n\n`;
        pesan += `🌟 *Sisi Positif:* ${data.sisi_positif}\n\n`;
        pesan += `⚠️ *Sisi Negatif:* ${data.sisi_negatif}\n\n`;

        await message.reply(media, undefined, { caption: pesan });

    } catch (error) {
        console.error('Error mengambil data kecocokan:', error);
        message.reply('Terjadi kesalahan mengambil data kecocokan.');
    }
}