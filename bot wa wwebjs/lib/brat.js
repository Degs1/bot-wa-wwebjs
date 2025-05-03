import axios from "axios";
import { Buffer } from "buffer";
import * as fs from 'fs';

export const brat = async (msg, text) => {
  try {
    if (!text) throw new Error("missing text input");

       // const res = await axios.get(`https://api.siputzx.my.id/api/m/brat?text=${text}&isVideo=false&delay=0`, {
          const res = await axios.get(`https://brat.caliphdev.com/api/brat?text=${text}`, {
	  responseType: "arraybuffer"
        });
		//console.log(res);
        const image = Buffer.from(res.data); // Alternatif pengganti Buffer di ESM
		fs.writeFileSync("./temp/sticker.jpeg", image);

    return {status: res.status};
  } catch (e) {
    console.log(e.message);
    return {status: false, msg: e}
  }
};
