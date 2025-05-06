import axios from 'axios';

export default async function Cuacacek(lokasi, msg) {
    if (lokasi === "") return msg.reply("⚠ Masukkan lokasi yang ingin dicek");
    try {
        msg.reply("Getting data...");
        const response = await axios.get(`https://api.siputzx.my.id/api/info/cuaca?q=${lokasi}`);
        const data = response.data.data; 

        if (!data || data.length === 0) {
            return msg.reply("⚠ Data cuaca tidak ditemukan untuk lokasi tersebut.");
        }

        // Ambil hanya lokasi pertama
        const lokasiPilihan = data[0];
     //   const lokasiPilihan11 = data[1];

        let pesan = `*[Prakiraan Cuaca]*\n\n`;
        pesan += `🏙 *${lokasiPilihan.lokasi.kotkab}, ${lokasiPilihan.lokasi.provinsi}*\n📍 Kecamatan: ${lokasiPilihan.lokasi.kecamatan}\n\n`;
        await msg.reply(lokasiPilihan.cuaca)
        // Looping hanya data cuaca yang sesuai jam 08, 14, 20
        lokasiPilihan.cuaca.flat().forEach(cuaca => {
            const jam = cuaca.local_datetime.split(' ')[1].split(':')[0];
           // const jam = cuaca.local_datetime.split('T')[1].split(':')[0];  

            if (["06", "15", "21"].includes(jam)) {
                pesan += `*🕒 ${cuaca.local_datetime}*\n`;
                pesan += `🌤 Cuaca: ${cuaca.weather_desc}\n`;
                pesan += `🌡 Suhu: ${cuaca.t}°C\n`;
                pesan += `💨 Angin: ${cuaca.wd} (${cuaca.ws} m/s)\n`;
                pesan += `💧 Kelembaban: ${cuaca.hu}%\n`;
                pesan += `---------------------------------\n`;
            }
        });

        if (!pesan.includes("🕒")) {
            pesan += "⚠ Tidak ada data cuaca yang tersedia untuk jam yang dipilih.";
        }

        // Kirim pesan ke pengirim
        msg.reply(pesan);
    } catch (error) {
        console.error('Error mengambil data cuaca:', error);
        msg.reply('Terjadi kesalahan mengambil data cuaca.');
    }
};
