import * as fetch from 'node-fetch';
import * as dotenv from "dotenv";
dotenv.config();
const apiXterm = {
  url: process.env.XTERM_URL, // Ganti dengan URL API Xterm
  key: process.env.XTERM_API_KEY, // Ganti dengan API Key yang benar
};

async function downloadvid(vidurl, type) {
    if (type === "tt") {
        try {
            const fetch = (await import('node-fetch')).default; // Gunakan dynamic import
        
            let response = await fetch(`${apiXterm.url}/api/downloader/tiktok?url=${vidurl}&key=${apiXterm.key}`);
            let respon = await response.json();
        
        // if (!respon.status) return { status: false, msg: "Gagal mengambil video." };
        
            if (!respon.status) {
                return { status: false, msg: "Gagal mengambil video." };
            } else {
                console.log("download selesai!");
                return respon;
            }
        } catch (error) {
            return { status: false, msg: "terjadi keslahan dalam memproses." };
        }
    } else if  (type === "ig") {
        try {
            const fetch = (await import('node-fetch')).default; // Gunakan dynamic import
        
            let response = await fetch(`${apiXterm.url}/api/downloader/instagram?url=${vidurl}&key=${apiXterm.key}`);
            let respon = await response.json();
        
        // if (!respon.status) return { status: false, msg: "Gagal mengambil video." };
        
            if (!respon.status) {
                return { status: false, msg: "Gagal mengambil video." };
            } else {
                console.log("download selesai!");
                return respon;
            }
        } catch (error) {
            return { status: false, msg: "terjadi keslahan dalam memproses." };
        }
    }
}

export default downloadvid;
export {};
