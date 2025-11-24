/**
 * Base64 Helper
 */
const toBase64 = (str: string): string => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const fromBase64 = (str: string): string => {
  return decodeURIComponent(escape(window.atob(str)));
};

/**
 * Baijiaxing Cipher (Simulation)
 * Maps Base64 characters to Surnames
 */
const BJX_SURNAMES = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝";
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export const encryptBaijiaxing = (text: string): string => {
  try {
    const b64 = toBase64(text);
    let result = "百家姓：";
    for (let i = 0; i < b64.length; i++) {
      const char = b64[i];
      const index = BASE64_CHARS.indexOf(char);
      if (index !== -1 && index < BJX_SURNAMES.length) {
        result += BJX_SURNAMES[index];
      } else {
        result += char; // Fallback
      }
    }
    return result;
  } catch (e) {
    console.error(e);
    return "加密失败";
  }
};

export const decryptBaijiaxing = (text: string): string => {
  try {
    let cleanText = text.replace("百家姓：", "").replace(/\s/g, "");
    let b64 = "";
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const index = BJX_SURNAMES.indexOf(char);
      if (index !== -1) {
        b64 += BASE64_CHARS[index];
      } else {
        // Ignore unknown chars or treat as raw if needed, but usually strict
      }
    }
    return fromBase64(b64);
  } catch (e) {
    return "解密失败：格式不正确";
  }
};

/**
 * Buddha Cipher (New Buddha Said / Tudou variant simulation)
 * Maps Base64 to Zen Characters
 */
const BUDDHA_HEADER = "佛曰：";
const BUDDHA_ALPHABET = "冥奢梵 呐俱 哆 怯 谙 罚 侄 钵 皤 嵇 迦 诺 娑 磨 耶 捺 f 唠 壤 参 骠 惹 g"; 
// The above is a simplified placeholder. A robust implementation uses a direct map.
// Let's implement a mapping similar to the popular "Tudou" algorithm used in Chinese forums.

const KEY_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const CIPHER_STR = "冥奢梵呐俱哆怯谙罚侄钵皤嵇迦诺娑磨耶捺唠壤参骠惹切抖恢慰缭合说 欲 萨 漫 竭 炽 盛 桧 禅 慈 悲 喜 舍 渡 众 生 苦 难 般 若 波 罗 蜜";
// Removing spaces for mapping
const CIPHER_MAP = CIPHER_STR.replace(/\s/g, '');

export const encryptBuddha = (text: string): string => {
  try {
    const b64 = toBase64(text);
    let result = BUDDHA_HEADER;
    for (let i = 0; i < b64.length; i++) {
      const char = b64[i];
      const index = KEY_STR.indexOf(char);
      if (index !== -1 && index < CIPHER_MAP.length) {
        result += CIPHER_MAP[index];
      } else {
        result += char;
      }
    }
    return result;
  } catch (e) {
    return "加密失败";
  }
};

export const decryptBuddha = (text: string): string => {
  try {
    let cleanText = text.replace(BUDDHA_HEADER, "").replace(/\s/g, "");
    let b64 = "";
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const index = CIPHER_MAP.indexOf(char);
      if (index !== -1) {
        b64 += KEY_STR[index];
      }
    }
    return fromBase64(b64);
  } catch (e) {
    return "解密失败：格式不正确";
  }
};