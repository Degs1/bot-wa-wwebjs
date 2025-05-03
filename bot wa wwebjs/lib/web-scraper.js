import puppeteer from 'puppeteer';
import fs from 'fs';

async function fetchPrayerSchedule() {
    const browser = await puppeteer.launch({ headless: false }); // Buka browser headless
    const page = await browser.newPage();

    console.log("📡 Mengambil data dari Kompas...");
    await page.goto('https://www.jadwalsholat.org/jadwal-sholat/monthly.php?id=21', { waitUntil: 'networkidle2' });

    // Tunggu elemen tabel muncul
    await page.waitForSelector('.table_header');

    // Ambil data tabel
    const data = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr')); // Pastikan selektor ini benar
        return rows.map(row => {
            const cols = row.querySelectorAll('td');
            return {
                hari: cols[0]?.innerText.trim(),
                tanggal: cols[0]?.innerText.trim(),
                imsak: cols[1]?.innerText.trim(),
                subuh: cols[2]?.innerText.trim(),
                terbit: cols[3]?.innerText.trim(),
                dzuhur: cols[5]?.innerText.trim(),
                ashar: cols[6]?.innerText.trim(),
                maghrib: cols[7]?.innerText.trim(),
                isya: cols[8]?.innerText.trim(),
            };
        });
    });

    await browser.close();

    // Simpan data ke file JSON
    const filePath = './temp/jadwal-sholat.json';
    fs.writeFileSync(filePath, JSON.stringify({ jadwal: data }, null, 2), 'utf-8');

    console.log(`✅ Data berhasil disimpan di ${filePath}`);
}

fetchPrayerSchedule();
