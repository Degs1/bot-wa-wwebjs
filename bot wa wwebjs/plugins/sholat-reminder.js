import fs from 'fs';
import pkg from 'whatsapp-web.js';
// const { Client, LocalAuth } = pkg;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
import { MongoClient } from 'mongodb';
import moment from 'moment-timezone';
const uri = process.env.mongodburi
const dbName = process.env.db_name
const cldb = new MongoClient(uri);

// Inisialisasi WhatsApp bot


// Fungsi untuk membaca JSON
const bacaJSON = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'));

// Cek waktu sholat dan kirim pengingat
let sedangCek = false; // Untuk mencegah pemanggilan ganda

async function mongodbcon(collections) {
    let tryconnect = false
    while (!tryconnect) {
        try {
            await cldb.connect();
            const database = cldb.db(dbName);
            const collection = database.collection(collections);
            tryconnect=true
            return { collection };
        } catch(e){
            tryconnect=false
            console.log(e.message)
            //return {status: false};
        }
    }
}

export default async function cekWaktuSholat(client) {
    if (sedangCek) return;  
    sedangCek = true;

    const dataJadwal = bacaJSON('./lib/jadwal-sholat.json');
    //const dataGrup = bacaJSON('./lib/grup-daftar.json'); // Baca daftar grup
    const now = moment().tz("Asia/Makassar");
    const tanggal = now.format("DD");
    const jamSekarang = now.format("HH:mm");
    const detikskrng = now.format("s");

    const jadwalHariIni = dataJadwal.jadwal.find(j => j.tanggal === tanggal);
    if (!jadwalHariIni) {
        console.log("📅 Jadwal sholat tidak ditemukan.");
        sedangCek = false;
        return;
    }

    const waktuSholat = {
        "Subuh": jadwalHariIni.subuh,
        "Dzuhur": jadwalHariIni.dzuhur,
        "Ashar": jadwalHariIni.ashar,
        "Maghrib": jadwalHariIni.maghrib,
        "Isya": jadwalHariIni.isya
    };

    const emojiSholat = {
        "Subuh": "🌆",
        "Dzuhur": "🏙️",
        "Ashar": "⏳",
        "Maghrib": "🌇",
        "Isya": "🌃"
    };

    for (let [sholat, waktu] of Object.entries(waktuSholat)) {
        if (jamSekarang === waktu) {
            const emoji = emojiSholat[sholat] || "🕋";
            console.log(`🔔 Waktu ${sholat} telah tiba!`);

            let resdb = await mongodbcon("sholatreminder");
            let dbGrup = await resdb.collection.find({}).toArray();
            //console.log(dbGrup)
            for (let grup of dbGrup) {
                try {
                    await client.sendMessage(grup.id, `${emoji} Waktu *${sholat}* telah tiba!\n\n🕌 Selamat menunaikan sholat *${sholat}* bagi yang beragama 🕋 *Islam*`);
                    console.log(`✅ Pengingat ${sholat} dikirim ke grup: ${grup.nama}`);
                } catch (err) {
                    console.error(`❌ Gagal mengirim pengingat ke grup: ${grup.nama}`, err);
                }
            }

            await sleep((60 - detikskrng) * 1000);  // Tunggu 1 menit agar tidak spam
        }
    }

    sedangCek = false;
    // setTimeout(cekWaktuSholat(client), 1);
}