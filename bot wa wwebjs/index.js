import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, Buttons} = pkg;
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from "dotenv";
dotenv.config();
import { createCanvas } from 'canvas';
import { Sticker, createSticker } from 'wa-sticker-formatter';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import enhancePlugin from './plugins/enhance-plugin.js';
import qrcode from 'qrcode-terminal';
const fromBuffer = async (buffer) => {
    const { fileTypeFromBuffer } = await import('file-type');
    return fileTypeFromBuffer(buffer);
};
import { writeFile, mkdir } from 'fs/promises';
import enhancePluginn from './plugins/enhance-plugin.js';
import removeplugin from './plugins/removeb-plugin.js';
import downloadPlugin from './plugins/download-plugin.js';
import { brat } from './lib/brat.js';
import smemeget from './lib/smeme.js';
import Cuacacek from './lib/bmkg-cuaca.js';
import { sendGempaTerkini, sendInfoGempa } from './lib/bmkg-gempa.js';
import sendRamalanCinta from './lib/ramalan-cinta.js';
import cekWaktuSholat from './plugins/sholat-reminder.js';
import { MongoClient } from 'mongodb';
import { clearScreenDown } from 'readline';
import { sleep } from 'openai/core.mjs';
import moment from 'moment-timezone';
//import { startTebakGambar, startSusunKata, checkAnswer} from './mode/gameHandler';
let gameSessions = {}; // Menyimpan sesi game
let prefix = process.env.prefix
const badword = process.env.badwords ? process.env.badwords.split(",") : [];
const whitelists = process.env.whitelist ? process.env.whitelist.split(",") : [];

//import { MessageMedia } from 'whatsapp-web.js';

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
const XTERM_API_KEY = process.env.XTERM_API_KEY; 
const XTERM_URL = "https://aihub.xtermai.xyz";
const uri = process.env.mongodburi
const dbName = process.env.db_name
const cldb = new MongoClient(uri);
// Inisialisasi WhatsApp bot
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    console.log('Scan QR Code ini untuk login:');
   
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot WhatsApp siap!');
});

// Fungsi untuk memproses gambar & teks dengan Gemini AI
async function processImageWithTextGemini(base64Image, userText) {
    try {
        let parts = [{ text: userText }];

        if (base64Image) {
            parts.push({
                inlineData: { mimeType: "image/jpeg", data: base64Image }
            });
        }

        const result = await model.generateContent({
            // contents: [{ role: "user", parts }]
            contents: [{ role: "model", parts: [{ text: "Kamu adalah chatbot untuk whatsapp yang membantu para siswa sma di indonesia yang dibuat oleh developer pelajar sma Akbar." }] },{ role: "user", parts }]

        });

        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error processing image & text with Gemini:", error);
        return "Maaf, terjadi kesalahan saat memproses permintaan.";
    }
}

async function saveBase64Image(base64String, outputPath) {
  // Menghapus header base64 jika ada (misalnya, "data:image/png;base64,")
  const base64Stringg = await base64String.toString('utf-8');
  //let base64Stringg = base64String;
  // Hapus prefix base64 jika ada
  const cleanedBase64 = base64Stringg.replace(/^data:image\/\w+;base64,/, '');

  // Konversi ke buffer
  const buffer = Buffer.from(cleanedBase64, 'base64');


  // Simpan ke file
  fs.writeFileSync(outputPath, buffer);
  console.log(`Gambar berhasil disimpan di ${outputPath}`);
}

//function buat sticker
async function createTextSticker(msg, client) {
    const command = msg.body.toLowerCase();
    if (!command.startsWith(`${prefix}mstick`)) return;
    
    const text = msg.body.slice(8).trim();
    if (!msg.body.slice(7).trim() === "") return msg.reply("⚠ Masukkan teks untuk stiker! Contoh: !mstick Sigma Sigma Boy");

    console.log("📌 Memproses perintah !mstick...");
    const filePath = "./temp/sticker.jpeg";
    let stick64 = await brat(msg,text);
    //let stick644 = await stick64.base64;

    if (!stick64.status === 200) return msg.reply("⚠ Gagal membuat stiker, coba lagi.");
    // **Buat stiker**
    try {
        const sticker = await new Sticker(filePath, {
            pack: "Bot Stickers",
            author: "Degs a.k.a akbar",
            type: "full",
            categories: ["🤖"],
            quality: 100
        }).build();

        console.log("🟢 Stiker siap dikirim!");

        // **Kirim sebagai stiker**
        const media = new MessageMedia("image/webp", sticker.toString("base64"));
        await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });

        console.log("✅ Stiker berhasil dikirim!");
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("❌ Error saat membuat/mengirim stiker:", error);
        msg.reply("⚠ Gagal membuat stiker, coba lagi.");
    }
}

const ensureTempFolder = async () => {
    try {
        await mkdir('./temp', { recursive: true });
    } catch (error) {
        console.error("❌ Gagal membuat folder temp:", error.message);
    }
};


const uploadToCatbox = async (filePath) => {
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

// 🔹 Fungsi Upscale dengan Xterm Remini
const upscaleImage = async (imageUrl) => {
    try {
        const response = await axios.get(`${XTERM_URL}/api/tools/remini?url=${imageUrl}&key=AIzaybQl6WinKVcqZTAy`);
        return response.data?.data?.url || null;
    } catch (error) {
        console.error("❌ Error saat upscale:", error.message);
        return null;
    }
};

// 🔹 Fungsi Utama: Terima Gambar → Upload → Upscale → Kirim Balik
const handleImageUpscale = async (media, msg, client) => {
    try {
        await ensureTempFolder(); // Pastikan folder "temp" ada

        // 🔹 Gunakan nama default jika filename tidak ada
        const fileName = media.filename || `image_${Date.now()}.jpg`;
        const filePath = `./temp/${fileName}`;

        // 🔹 Simpan media dari WhatsApp ke file sementara
        await writeFile(filePath, media.data, 'base64');

        // 🔹 Upload ke Catbox
        const imageUrl = await uploadToCatbox(filePath);
        if (!imageUrl) return msg.reply("⚠️ Gagal mengunggah gambar ke Catbox.");

        console.log("✅ Gambar berhasil diunggah ke Catbox:", imageUrl);
        fs.unlinkSync(filePath);

        // 🔹 Kirim ke Xterm untuk diperjelas
        await msg.reply("Processing....");
        const upscaledImageUrl = await upscaleImage(imageUrl);
        if (!upscaledImageUrl) return msg.reply("⚠️ Gagal memperjelas gambar dengan AI.");

        console.log("✅ Gambar berhasil diperjelas:", upscaledImageUrl);

        // 🔹 Hapus file setelah diproses
        
        const response = await fetch(upscaledImageUrl);
        if (!response.ok) throw new Error(`Gagal mengambil foto: ${response.statusText}`);
                    
        const buffer = await Buffer.from(await response.arrayBuffer());
        const filePpath = "./temp/enhanced-face.png";
        fs.writeFileSync(filePpath, buffer);

        // 🔹 Kirim gambar hasil upscale ke pengguna
        const upscaleMedia = await MessageMedia.fromFilePath("./temp/enhanced-face.png");
        await client.sendMessage(msg.from, upscaleMedia, { 
            caption: "✨ Ini hasil face enhance dengan AI!",
            sendMediaAsDocument: true 
         });
         fs.unlinkSync(filePpath);

    } catch (error) {
        const filePpath = "./temp/enhanced-face.png";
        console.error("❌ Error dalam handleImageUpscale:", error.message);
        msg.reply("⚠️ Terjadi kesalahan dalam memproses gambar.");
        fs.unlinkSync(filePpath);
    }
};

async function Stickmeme(msg, client) {
    const command = msg.body.toLowerCase();
    if (!command.startsWith(`${prefix}smeme`)) return;
    
    //const text = msg.body.slice(8).trim();

    const args = msg.body.split(" ").slice(1).join(" ").split("|").map(a => a.trim());

    const teks1 = args[0] ? args[0] : "‎"; // Karakter spasi kosong (Invisible Character)
    const teks2 = args[1] ? args[1] : "‎";
    if (msg.body.slice(7).trim() === "") return msg.reply("⚠ Masukkan teks untuk stiker! Contoh: !mstick Sigma Sigma Boy");

    console.log("📌 Memproses perintah !smeme...");
    let stick64 = await smemeget(msg, teks1, teks2, client);
    let filePath = stick64.filePath
    //fs.writeFileSync(filePath, stick64.buffer);
    //let stick644 = await stick64.base64;

    if (!stick64.status) return msg.reply("⚠ Gagal membuat stiker, coba lagi.");
    // **Buat stiker**
    try {
        const sticker = await new Sticker(filePath, {
            pack: "Bot Stickers",
            author: "Degs a.k.a akbar",
            type: "full",
            categories: ["🤖"],
            quality: 100
        }).build();

        console.log("🟢 Stiker siap dikirim!");

        // **Kirim sebagai stiker**
        const media = new MessageMedia("image/webp", sticker.toString("base64"));
        await client.sendMessage(msg.from, media, { sendMediaAsSticker: true });

        console.log("✅ Stiker berhasil dikirim!");
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("❌ Error saat membuat/mengirim stiker:", error);
        msg.reply("⚠ Gagal membuat stiker, coba lagi.");
    }
}

async function updateFileFromGithub(githubRawUrl,msg,folder) {
    try {
        const response = await axios.get(githubRawUrl, { responseType: 'text' });
      
      let fileName;
      if (folder == '1') {
        fileName = './lib/' + path.basename(githubRawUrl); // ambil nama file dari URL
      } else if (folder == '2') {
        fileName = './plugins/' + path.basename(githubRawUrl); // ambil nama file dari URL
      } else {
        fileName = './' + path.basename(githubRawUrl); // ambil nama file dari URL
      }
      
      fs.writeFileSync(fileName, response.data);
  
      msg.reply(`✅ File "${fileName}" berhasil diupdate. silahkan restart dengan !restart`);
      console.log(`✅ File "${fileName}" berhasil diupdate.`);
    } catch (err) {
        msg.reply('❌ Gagal mengupdate file:', err.message);
      console.error('❌ Gagal mengupdate file:', err.message);
    }
  }

async function fetchGameData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ Error mengambil data:", error.message);
        return null;
    }
}

async function startTebakGambar(chatId, client) {
    try {
        let response = await axios.get('https://raw.githubusercontent.com/Rifza123/lib/refs/heads/main/db/game/tebakgambar.json');
        let soal = response.data[Math.floor(Math.random() * response.data.length)];

        console.log("📸 Link gambar:", soal.img);
        console.log("🔠 Jawaban:", soal.answer);

        // Download gambar
        let media = await MessageMedia.fromUrl(soal.img);

        // Kirim ke WhatsApp
        await client.sendMessage(chatId, media, { caption: `📸 Tebak gambar berikut!, Dengan ${prefix}answer <jawaban>` });
        console.log("📤 Pesan dikirim!");
        gameSessions[chatId] = { answer: soal.answer.toLowerCase() };
    } catch (error) {
        console.error("❌ Gagal mengambil soal:", error.message);
    }
}

async function startSusunKata(chatId, client) {
    const url = "https://raw.githubusercontent.com/Rifza123/lib/refs/heads/main/db/game/susunkata.json";
    const data = await fetchGameData(url);

    if (!data || data.length === 0) {
        client.sendMessage(chatId, "❌ Gagal mengambil soal susun kata!");
        return;
    }

    // Pilih soal acak
    const soal = data[Math.floor(Math.random() * data.length)];

    const caption = `🔡 *Susun Kata!*\n\n📌 *Kategori:* ${soal.type}\n🔠 *Huruf:* ${soal.question}\n\nJawab dengan ${prefix}answer <jawaban>`;

    client.sendMessage(chatId, caption);

    // Simpan jawaban yang benar untuk nanti dicek
    gameSessions[chatId] = { answer: soal.answer.toLowerCase() };
}

function checkAnswer(chatId, userAnswer, client) {
    if (!gameSessions[chatId]) return;

    const correctAnswer = gameSessions[chatId].answer;

    if (userAnswer.toLowerCase() === correctAnswer) {
        client.sendMessage(chatId, "✅ Jawaban benar! 🎉");
        delete gameSessions[chatId]; 
    } else {
        client.sendMessage(chatId, `❌ Jawaban salah! Coba lagi, Atau menyerah dengan (${prefix}menyerah)`);
    }
}

async function grupBroad(client, msg, text) {
    let texts = text.slice(3).trim();
    if (!texts) return msg.reply("Masukan Textnya bujang");

    let resdb = await mongodbcon("groups");
    let dbGrup = await resdb.collection.find({}).toArray();

    let grupBerhasil=0;
    let grupGagal=0;

    for (let grup of dbGrup) {
        try {
            await client.sendMessage(grup.id, `${texts}`);
            console.log(`✅ Broadcast berhasil dikirim ke grup: ${grup.nama}`);
            grupBerhasil +=1;
        } catch (err) {
            console.error(`❌ Gagal mengirim Broadcast ke grup: ${grup.nama}`, err);
            grupGagal +=1;
        }
    }
    await msg.reply(`jumlah broadcast terkirim\nBerhasil : ${grupBerhasil}\nGagal : ${grupGagal}`)
}

async function mongodbcon(collections) {
    let tryconnect = false
    while (!tryconnect) {
        try {
            await cldb.connect();
            const database = cldb.db(dbName);
            const collection = database.collection(collections);
            tryconnect=true
            return { collection, status: true};
        } catch(e){
            tryconnect=false
            console.log(e.message)
            return {status: false};
        }
    }
}

async function addGrooup(msg,collect) {
    let chat = await msg.getChat();
    if (chat.isGroup) {
        let namegrup=await chat.name
        let idgrup=await msg.from
        let resdb = await mongodbcon(collect);
        if (resdb.status){
            try {
            const data = { id: idgrup, nama: namegrup };
            //await resdb.collection.createIndex({ id: 1 }, { unique: true });
            const result = await resdb.collection.insertOne(data);
            console.log("Data berhasil disimpan:", result.insertedId);
            await msg.reply("grup berhasil ditambah")
            } catch (error) {
            console.error("Gagal terhubung:", error);
            await msg.reply(`terjadi error : ${error.message}`)
            } finally {
            await cldb.close();
            }
        } else {
            await msg.reply("gagal terhubung ke database")
        }
    } else {
        await msg.reply("tidak dapat menemukan grup")
    }
  }

  async function delGrooup(msg,collect) {
    let chat = await msg.getChat();
    if (chat.isGroup) {
        let namegrup=await chat.name
        let idgrup=await msg.from
        let resdb = await mongodbcon(collect);
        if (resdb.status){
            try {
            const data = { id: idgrup, nama: namegrup };
            //await resdb.collection.createIndex({ id: 1 }, { unique: true });
            const result = await resdb.collection.deleteOne({ id: idgrup });
            console.log("Data berhasil dihapus");
            if (result.deletedCount > 0) {
                await msg.reply("grup berhasil dihapus")
            } else {
                await msg.reply("grup gagal dihapus")
            }
            } catch (error) {
            console.error("Gagal terhubung:", error);
            await msg.reply(`terjadi error : ${error.message}`)
            } finally {
            await cldb.close();
            }
        } else {
            await msg.reply("gagal terhubung ke database")
        }
    } else {
        await msg.reply("tidak dapat menemukan grup")
    }
  }

function formatMathForWA(text) {
    let formattedText = text
        .replace(/\\cdot/g, '×')
        .replace(/ \* /g, ' × ')
        .replace(/\\times/g, '×')
        .replace(/\\div/g, '÷')
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 ÷ $2')
        .replace(/\\text{([^}]+)}/g, '$1')
        .replace(/\\pm/g, '±')
        .replace(/\\approx/g, '≈')
        .replace(/\\neq/g, '≠')
        .replace(/\\leq/g, '≤').replace(/<=/g, '≤')
        .replace(/\\geq/g, '≥').replace(/>=/g, '≥')
        .replace(/\\sqrt{([^}]+)}/g, '√($1)')
        .replace(/\^2/g, '²').replace(/\^3/g, '³')
        .replace(/\^([0-9]+)/g, (_, p1) => `⁰¹²³⁴⁵⁶⁷⁸⁹`[p1])
        .replace(/_([0-9])/g, (_, p1) => `₀₁₂₃₄₅₆₇₈₉`[p1])
        .replace(/\\infty/g, '∞')
        .replace(/\\sum/g, '∑')
        .replace(/\\int/g, '∫')
        .replace(/\\angle/g, '∠')
        .replace(/\\pi/g, 'π')
        .replace(/\\theta/g, 'θ')
        .replace(/(?<!\\frac)\//g, '÷') // Ubah / menjadi ÷, kecuali dalam \frac{}
        .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ');

    console.log("Sesudah replace:", formattedText);
    return formattedText;
}

function getAllowedGroups() {
    try {
      return JSON.parse(fs.readFileSync('./lib/grup-daftar.json', 'utf-8'));
    } catch {
      return [];
    }
  }

function getDatetime() {
    const now = moment().tz("Asia/Makassar");
    const hariIni = now.format("dddd");
    const Datenow=now.format("DD MMMM YYYY");
    const Timenow =now.format("HH:mm:ss")
    return { hari: hariIni, date: Datenow, time: Timenow }
}


let help_banner = await MessageMedia.fromFilePath("./config/banner.jpg");
let anti_toxicvar=false;
let botadmin=false;
let allowedgrup=JSON.parse(fs.readFileSync('./lib/grup-daftar.json', 'utf-8'));

console.log(whitelists);

client.on('ready', () => {
    setInterval(() => cekWaktuSholat(client), 100);
});

client.on('message', async msg => {
    console.log(`Pesan diterima dari ${msg.author} | ${msg.from}: ${msg.body}`);

    // trigering section
    const chatt = await msg.getChat();
    let dataGrup = getAllowedGroups();
    let findId = dataGrup.groups.find(g => g.id === msg.from);
    if (msg.from.endsWith("@g.us") && !findId) {
        let lists = getAllowedGroups();
        console.log("⛔ Grup tidak terdaftar:", msg.from);
        lists.groups.push({name: chatt. name, id: msg.from, izintag: false, adminList: [""]});

        const isExist = lists.groups.some(item => 
            item.id === msg.from
          );
        if (isExist) {
            await fs.writeFileSync('./lib/grup-daftar.json', JSON.stringify(lists, null, 2));
        }
        allowedgrup=JSON.parse(fs.readFileSync('./lib/grup-daftar.json', 'utf-8'));
        await msg.reply('Adding group, ✅Please try again!')
        return;
      }

    // chatbot section
    const isCommand = msg.body.startsWith(`${prefix}ask`) || msg.body.includes(`${prefix}bot`);
    const sender = msg.author || msg.from;
    let userText = msg.body.replace(`${prefix}ask`, '').replace(`${prefix}bot`, '').trim();

    // admin section
    let ownerhere = false;
    let adminHere = false;
    
    const contentss = msg.body.toLowerCase();
    if (whitelists.includes(sender)) {
        ownerhere = true;
    }

    if (findId) {
        if (findId.adminList.includes(msg.author || msg.from)) {
            adminHere=true;
        }
    }
    
    if (chatt.isGroup) {
        const senderId = msg.author || msg.from;
        const isAdmin = await chatt.isAdmin(senderId);
        adminHere=true;
    }

    if (chatt.isGroup) {
        const botId = client.info.wid._serialized;
        const participants = chatt.participants;
        const botParticipant = participants.find(participant => participant.id._serialized === botId);
    
        if (botParticipant && botParticipant.isAdmin) {
          botadmin = true;
          //console.log('Bot adalah admin di grup:', chat.name); // Log ke konsol (opsional)
        } else {
          botadmin = false;
          //console.log('Bot bukan admin di grup:', chat.name); // Log ke konsol (opsional)
        }
      }

    if (msg.body.startsWith(`${prefix}tagall`)) {
        console.log('start taging people')
        let pesan = msg.body.slice(8).trim();
        let readMore = `͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏`;
        let allowtagall=findId.izintag;
        if (allowtagall || ownerhere || adminHere){
            if (chatt.isGroup) {
                try {
                const participants = chatt.participants;
                if (participants && participants.length > 0) {
                    let text = `${pesan}\n\n ${readMore}`;
                    let mentions = [];
                    const zeroWidthSpace = '\u200B'; // Karakter zero-width space
        
                    for (let participant of participants) {
                    mentions.push(participant.id._serialized);
                    text += `${zeroWidthSpace}@${participant.id.user}`; // Menambahkan zero-width space sebelum mention
                    }
        
                    await chatt.sendMessage(`${text}`, { 
                        mentions: [...mentions]
                    });
                } else {
                    msg.reply('Tidak ada peserta di grup ini.');
                }
                } catch (error) {
                console.error('Error saat tagall sembunyi:', error);
                msg.reply('Terjadi kesalahan saat menjalankan perintah tagall sembunyi.');
                }
            } else {
                msg.reply('Perintah ini hanya dapat digunakan di grup.');
            }
        } else {
            msg.reply("Jangan tag-tag manis❤️")
        }
      }

      if (msg.body.startsWith("!izintag")) {
        if (chatt.isGroup) {
            if (ownerhere || adminHere) {
                if (findId) {
                    if (findId.izintag) {
                        findId.izintag=false;
                        msg.reply("tag all tidak di izinkan")
                    } else {
                        findId.izintag=true;
                        msg.reply("tag all di izinkan")
                    }
                }
                await fs.writeFileSync('./lib/grup-daftar.json', JSON.stringify(dataGrup, null, 2));
            } else {
                msg.reply('you are not admin or owner in database pls tell the owner')
            }
        } else {
            msg.reply('plese use this cmd in your group')
        }
    }

    if (msg.body.startsWith('!addadmin')) {
        let user = msg.body.slice(11).trim();

        if (chatt.isGroup) {
            if (ownerhere && user) {
                let number = user + '@c.us'
                if (findId) {
                    if (!findId.adminList.includes(number)) {
                        findId.adminList.push(number);
                        await fs.writeFileSync('./lib/grup-daftar.json', JSON.stringify(dataGrup, null, 2));
                        msg.reply('admin added✅')
                    } else {
                        findId.adminList=findId.adminList.filter(admin => admin !== number);
                        await fs.writeFileSync('./lib/grup-daftar.json', JSON.stringify(dataGrup, null, 2));
                        msg.reply('admin removed')
                    }
                }
            } else {
                msg.reply('your cmd was wrong and ensure you are owner\n\n!addadmin <@tag a people>')
            }
        } else {
            msg.reply('please use this cmd in your group')
        }
    }

    if (msg.body.startsWith("!update")) {
        let urls = msg.body.slice(10).trim();
        let folder = msg.body.slice(8).trim().slice(0, 1).toLowerCase();;
        if (ownerhere) {
            if (urls) {
                await updateFileFromGithub(urls,msg,folder);
            } else {
                msg.reply("format:\n\n!update 1 <link>\n\n1 for lib\n2 for plugins\n0 for index")
            }
        } else {
            msg.reply("you not allowed use this cmd")
        }
    }
    if (msg.body.startsWith("!restart")) {
    const sleepp = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        if (ownerhere) {
            await msg.reply("Bot will restart in 5 second")
            await sleepp(5000)
            await msg.reply("restartting...")
            await process.exit(0);
        }
    }

    if (msg.body.startsWith("!antitoxic")) {
        msg.reply('this feature disabled for now')
    }
    
    if (anti_toxicvar && chatt.isGroup && badword.some(word => contentss.includes(word))) {
        if (botadmin){
            try {
                await msg.delete(true);
                msg.reply(`⚠️ Pesan dari ${msg.author} dihapus karena mengandung kata terlarang\n😹😹😹`)
            } catch (e) {
                console.log(e.message);
                //chatt.sendMessage(`⚠️ bot tidak bisa menghapus pesan karena bot bukan admin`)
            }
        } else {

        }
    }

    // 🔹 **Jika ada gambar & ada caption dengan perintah**
    if (msg.hasMedia && isCommand) {
        const media = await msg.downloadMedia();
        if (media.mimetype.startsWith('image/')) {
            console.log("📸 Gambar diterima dengan perintah, memproses dengan Gemini...");
            const responseText = await processImageWithTextGemini(media.data, userText || "Apa yang bisa kamu katakan tentang gambar ini?");
            const responseTextt = await formatMathForWA(responseText)
            await msg.reply(responseText);
        }
        return;
    }

    // 🔹 **Jika pengguna reply ke gambar dengan perintah**
    if (isCommand && msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.hasMedia) {
            const media = await quotedMsg.downloadMedia();
            if (media.mimetype.startsWith('image/')) {
                console.log("📸 Reply ke gambar dengan perintah, memproses...");
                const responseText = await processImageWithTextGemini(media.data, userText || "Apa yang bisa kamu katakan tentang gambar ini?");
                const responseTextt = await formatMathForWA(responseText)
                await msg.reply(responseText);
            }
        }
        return;
    }

    // 🔹 **Jika hanya teks & ada perintah, kirim pertanyaan ke AI**
    if (isCommand && !msg.hasMedia) {
        if (!userText) {
            await msg.reply(`Halo! Silakan ketik pertanyaan setelah "${prefix}ask" atau "${prefix}bot". 😊`);
            return;
        }

        const aiReply = await processImageWithTextGemini("", userText);
        await msg.reply(aiReply);
    }

    // membuat sticker coi
    if (msg.body.startsWith(`${prefix}mstick`)) {
        await createTextSticker(msg,client);
    }

    if (msg.body.startsWith(`${prefix}smeme`) && msg.hasMedia) {
        await Stickmeme(msg,client);
    } else if (msg.body.startsWith(`${prefix}smeme`) && !msg.hasMedia) {
        msg.reply("Harap kirim dengan gambar");
    }

    if (msg.body.startsWith(`${prefix}facehd`) && msg.hasMedia) {
        const media = await msg.downloadMedia();
        await handleImageUpscale(media, msg, client);
    } else if (msg.body.startsWith(`${prefix}facehd`) && !msg.hasMedia) {
        msg.reply("Harap kirim dengan gambar");
    }

    const chatId = msg.from;
    const text = msg.body.toLowerCase();

    if (text === `${prefix}listgame`) {
        await client.sendMessage(chatId, "📜 Menu: \n1️⃣ *!tebakgambar*\n2️⃣ *!susunkata*");
    } else if (text === `${prefix}tebakgambar`) {
        if (gameSessions[chatId]) {
            await client.sendMessage(chatId, "⚠️ Game berlangsung, (!menyerah) untuk memulai game baru")
        } else
            await startTebakGambar(chatId, client);
    } else if (text === `${prefix}susunkata`) {
        if (gameSessions[chatId]) {
            await client.sendMessage(chatId, "⚠️ Game berlangsung, (!menyerah) untuk memulai game baru")
        } else
        await startSusunKata(chatId, client);
    } else if (text === `${prefix}menyerah`) {
        if (gameSessions[chatId]) {
            delete gameSessions[chatId]; 
            await client.sendMessage(chatId, "Anda menyerah, mulai ulang game untuk bermain")
        }
    } else if (gameSessions[chatId] && msg.body.startsWith(`${prefix}answer `)) {
        let textss=text.slice(8).trim();
        await checkAnswer(chatId, textss, client);
    }
    
    if (msg.body.startsWith(`${prefix}hdin`) && msg.hasMedia) {
        const text = msg.body.slice(6).trim();
        await enhancePluginn(msg, { text: text, conn: client });
       // handler(msg, {text, client});
    } else if (msg.body.startsWith(`${prefix}hdin`) && !msg.hasMedia) {
        msg.reply("Harap kirim dengan gambar");
    }

    if (msg.body.startsWith(`${prefix}removebg`) && msg.hasMedia) {
        await removeplugin(msg,client);
    } else if (msg.body.startsWith(`${prefix}removebg`) && !msg.hasMedia) {
        msg.reply("Harap kirim dengan gambar");
    }
    
    if (msg.body.startsWith(`${prefix}get`)) {
        const type = msg.body.slice(5).trim().slice(0, 2).toLowerCase();
        const url = msg.body.slice(8).trim();
        await downloadPlugin(msg, url, type, client)
    }

    if (msg.body.startsWith(`.help`) || msg.body.startsWith(`,help`) || msg.body.startsWith(`${prefix}help`) || msg.body.startsWith(`!help`)) {
        const list_help = `
╭ *• INFO - BOT*
│ *° Name:* DegsBOT
│ *° Version:* 0.1
│ *° Language:* Js (Javascript)
╰──── ୨୧ ────┈

╭ *• INFO - Today*
│ *° Time:* ${getDatetime().time}
│ *° Day:* ${getDatetime().hari}
│ *° Date:* ${getDatetime().date}
╰──── ୨୧ ────┈

╭ *• INFO - Symbol*
│ *° ⛔:* Only owner in database
│ *° ‼️:* Only admin in database
│ *° ✅:* All user can use
╰──── ୨୧ ────┈

͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏
╭──── ⌞ *Importan Menu* ⌝
╰┈➤ *✅ ${prefix}tagall <pesan>*


╭──── ⌞ *Ai Menu* ⌝
│┈➤ *✅ ${prefix}ask <tanya>*
│┈➤ *✅ ${prefix}facehd*
│┈➤ *✅ ${prefix}hdin <type>*
╰┈➤ *✅ ${prefix}removebg*

╭──── ⌞ *Game Menu* ⌝
│┈➤ *✅ ${prefix}listgame*
│┈➤ *✅ ${prefix}susunkata* 
│┈➤ *✅ ${prefix}tebakgambbar*
╰┈➤ *✅ ${prefix}ramalcinta*

╭──── ⌞ *Sticker Menu* ⌝
│┈➤ *✅ ${prefix}mstick <text>*
╰┈➤ *✅ ${prefix}smeme <up>|<down>*

╭──── ⌞ *BMKG Menu* ⌝
│┈➤ *✅ ${prefix}infogempa*
│┈➤ *✅ ${prefix}gempaterkini*
╰┈➤ *✅ ${prefix}cuaca <daerah>*

╭──── ⌞ *Downloader Menu* ⌝
│┈➤ *✅ ${prefix}get tt <link>*
╰┈➤ *✅ ${prefix}get ig <link>*

╭──── ⌞ *Reminder Menu* ⌝
│┈➤ *‼️ ${prefix}sholatreminder*
╰┈➤ *‼️ ${prefix}remsholatreminder*

╭──── ⌞ *Admin Section* ⌝
│┈➤ *‼️ !antitoxic*
╰┈➤ *‼️ !izintag*

╭──── ⌞ *Owner Section* ⌝
│┈➤ *⛔ !bc <pesan>*
│┈➤ *⛔ !addadmin*
│┈➤ *⛔ !update*
│┈➤ *⛔ !restart*
╰──── ୨୧ ────┈
`;
        await client.sendMessage(msg.from, help_banner, { caption: list_help });
    }

    if (msg.body.startsWith(`${prefix}cuaca`)) {
        let lokasi = msg.body.slice(7).trim();
        await Cuacacek(lokasi,msg);
    }

    if (msg.body.startsWith(`${prefix}infogempa`)) {
        await sendInfoGempa(msg);
    } else if (msg.body.startsWith(`${prefix}gempaterkini`)) {
        await sendGempaTerkini(msg);
    }

    if (msg.body.startsWith(`${prefix}ramalcinta`)) {
        await sendRamalanCinta(msg);
    }

    // if (msg.body.startsWith("!addg") && ownerhere) {
    //     await addGrooup(msg,'groups')
    // } else if (msg.body.startsWith("!remg") && ownerhere) {
    //     await delGrooup(msg,'groups')
    // }
    
    if (msg.body.startsWith(`${prefix}sholatreminder`)) {
        if (chatt.isGroup && (ownerhere || adminHere)) {
            await addGrooup(msg,'sholatreminder')
        } else {
            msg.reply('please use this cmd in your group and ensure you are admin/owner')
        }
    } else if (msg.body.startsWith(`${prefix}remsholatreminder`)) {
        if (chatt.isGroup && (ownerhere || adminHere)) {
            await delGrooup(msg,'sholatreminder')
        } else {
            msg.reply('please use this cmd in your group and ensure you are admin/owner')
        }
    }

    if (msg.body.startsWith(`!bc`)) {
        if (ownerhere){
            await grupBroad(client, msg, msg.body)
        } else {
            msg.reply("you not allowed to use this cmd")
        }
    }
});





// Jalankan bot
client.initialize();
