import { v4 as uuidv4 } from 'uuid';

export const generateApiKey = (): string => {
  const prefix = process.env.API_KEY_PREFIX || 'kgiton_';
  const randomKey = uuidv4().replace(/-/g, '');
  return `${prefix}${randomKey}`;
};

export const generateVoucherCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
    if ((i + 1) % 4 === 0 && i !== 15) {
      code += '-';
    }
  }
  return code;
};

export const generateLicenseKey = (): string => {
  // Exclude 0 (zero) and O (letter O) to avoid confusion
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'.replace(/[O0]/g, '');
  const segments = 5;
  const segmentLength = 5;
  
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    parts.push(segment);
  }
  
  return parts.join('-');
};
