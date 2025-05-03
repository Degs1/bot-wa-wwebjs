import axios from 'axios';

export async function sendInfoGempa(message) {
    try {
        const response = await axios.get('https://api.siputzx.my.id/api/info/bmkg');
        const data = response.data.data;

        let pesan = '*[Info Gempa Terbaru]*\n\n';

        // **Gempa Terbaru (Auto)**
        const autoGempa = data.auto.Infogempa.gempa;
        pesan += `📅 Tanggal: ${autoGempa.Tanggal}\n`;
        pesan += `🕒 Waktu: ${autoGempa.Jam}\n`;
        pesan += `📍 Lokasi: ${autoGempa.Wilayah}\n`;
        pesan += `📌 Koordinat: ${autoGempa.Coordinates}\n`;
        pesan += `💪 Magnitudo: ${autoGempa.Magnitude}\n`;
        pesan += `📏 Kedalaman: ${autoGempa.Kedalaman}\n`;
        pesan += `⚠️ Potensi: ${autoGempa.Potensi}\n`;
        pesan += `---------------------------------\n\n`;

        // **Gempa Dirasakan**
        pesan += '*[Gempa Dirasakan]*\n\n';
        data.dirasakan.Infogempa.gempa.forEach((gempa, index) => {
            pesan += `*${index + 1}. ${gempa.Tanggal} ${gempa.Jam}*\n`;
            pesan += `📍 Lokasi: ${gempa.Wilayah}\n`;
            pesan += `💪 Magnitudo: ${gempa.Magnitude}\n`;
            pesan += `📏 Kedalaman: ${gempa.Kedalaman}\n`;
            pesan += `🌍 Dirasakan: ${gempa.Dirasakan}\n`;
            pesan += `---------------------------------\n`;
        });

        message.reply(pesan);
    } catch (error) {
        console.error('Error mengambil data gempa:', error);
        message.reply('Terjadi kesalahan mengambil data gempa.');
    }
}

// **2. Fungsi untuk Mengirim Gempa Terkini**
export async function sendGempaTerkini(message) {
    try {
        const response = await axios.get('https://api.siputzx.my.id/api/info/bmkg');
        const data = response.data.data;

        let pesan = '*[Gempa Terkini]*\n\n';
        data.terkini.Infogempa.gempa.slice(0, 5).forEach((gempa, index) => {
            pesan += `*${index + 1}. ${gempa.Tanggal} ${gempa.Jam}*\n`;
            pesan += `📍 Lokasi: ${gempa.Wilayah}\n`;
            pesan += `💪 Magnitudo: ${gempa.Magnitude}\n`;
            pesan += `📏 Kedalaman: ${gempa.Kedalaman}\n`;
            pesan += `⚠️ Potensi: ${gempa.Potensi}\n`;
            pesan += `---------------------------------\n`;
        });

        message.reply(pesan);
    } catch (error) {
        console.error('Error mengambil data gempa terkini:', error);
        message.reply('Terjadi kesalahan mengambil data gempa terkini.');
    }
}
