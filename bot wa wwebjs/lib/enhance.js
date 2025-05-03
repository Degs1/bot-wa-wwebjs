import * as fetch from 'node-fetch';
import * as dotenv from "dotenv";
dotenv.config();
const apiXterm = {
  url: process.env.XTERM_URL, // Ganti dengan URL API Xterm
  key: process.env.XTERM_API_KEY, // Ganti dengan API Key yang benar
};

async function enhance(imageUrl, type) {
    const fetch = (await import('node-fetch')).default; // Gunakan dynamic import
    let tryCount = 0;
  
    let response = await fetch(`${apiXterm.url}/api/tools/enhance/createTask?url=${imageUrl}&type=${type}&key=${apiXterm.key}`);
    let task = await response.json();
  
    if (!task.status) return { status: false, msg: "Gagal membuat task enhance." };
  
    console.log(`Task ID: ${task.id} - Memproses gambar...`);
  
    while (tryCount < 50) {
      tryCount++;
  
      let statusResponse = await fetch(`${apiXterm.url}/api/tools/enhance/taskStatus?id=${task.id}`);
      let status = await statusResponse.json();
  
      if (status.task_status === "failed") {
        return { status: false, msg: "Terjadi kesalahan dalam proses enhance. Coba gunakan gambar lain!" };
      } else if (status.task_status === "done") {
        console.log("Enhance selesai!");
        return status;
      }
  
      console.log(`🔄 Proses Enhance (${tryCount}/50)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  
    return { status: false, msg: "Timeout: Enhance gagal setelah 50 percobaan." };
  }
  
  export default enhance;
export {};
