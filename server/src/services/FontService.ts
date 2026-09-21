import fs from 'fs';
import path from 'path';
import https from 'https';
import { logger } from '../utils/logger.js';

export interface CuratedFontDefinition {
  family: string;
  cleanName: string;
  fileName: string;
  url: string;
}

export const CURATED_FONTS: Record<string, CuratedFontDefinition> = {
  'inter': {
    family: 'Inter',
    cleanName: 'Inter',
    fileName: 'Inter.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf',
  },
  'poppins': {
    family: 'Poppins',
    cleanName: 'Poppins',
    fileName: 'Poppins.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf',
  },
  'montserrat': {
    family: 'Montserrat',
    cleanName: 'Montserrat',
    fileName: 'Montserrat.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',
  },
  'bebas neue': {
    family: 'Bebas Neue',
    cleanName: 'Bebas Neue',
    fileName: 'BebasNeue.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf',
  },
  'anton': {
    family: 'Anton',
    cleanName: 'Anton',
    fileName: 'Anton.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf',
  },
  'oswald': {
    family: 'Oswald',
    cleanName: 'Oswald',
    fileName: 'Oswald.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald%5Bwght%5D.ttf',
  },
  'dm sans': {
    family: 'DM Sans',
    cleanName: 'DM Sans',
    fileName: 'DMSans.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf',
  },
  'space grotesk': {
    family: 'Space Grotesk',
    cleanName: 'Space Grotesk',
    fileName: 'SpaceGrotesk.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf',
  },
  'archivo black': {
    family: 'Archivo Black',
    cleanName: 'Archivo Black',
    fileName: 'ArchivoBlack.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf',
  },
  'plus jakarta sans': {
    family: 'Plus Jakarta Sans',
    cleanName: 'Plus Jakarta Sans',
    fileName: 'PlusJakartaSans.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf',
  },
};

export class FontService {
  private fontsDir: string;

  constructor() {
    // server/fonts
    this.fontsDir = path.resolve(process.cwd(), 'fonts');
    if (!fs.existsSync(this.fontsDir)) {
      fs.mkdirSync(this.fontsDir, { recursive: true });
    }
  }

  public getFontsDir(): string {
    return this.fontsDir;
  }

  public getSupportedFamilies(): string[] {
    return Object.values(CURATED_FONTS).map((f) => f.family);
  }

  public validateFontFamily(requestedFont?: string): string {
    if (!requestedFont) return 'Montserrat';
    const normalized = requestedFont.toLowerCase().replace(/['"]/g, '').trim();
    if (CURATED_FONTS[normalized]) {
      return CURATED_FONTS[normalized].family;
    }
    // Check partial matches or default safely to Montserrat
    for (const key of Object.keys(CURATED_FONTS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return CURATED_FONTS[key].family;
      }
    }
    return 'Montserrat';
  }

  public async ensureFontCached(family: string): Promise<string> {
    const validFamily = this.validateFontFamily(family);
    const fontDef = CURATED_FONTS[validFamily.toLowerCase()];
    if (!fontDef) return path.join(this.fontsDir, 'Montserrat.ttf');

    const targetPath = path.join(this.fontsDir, fontDef.fileName);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
      return targetPath;
    }

    // Download font TTF into cache
    logger.info(`FontService: Downloading ${fontDef.family} to ${targetPath}`);
    await this.downloadFont(fontDef.url, targetPath);
    return targetPath;
  }

  public async ensureAllCuratedFonts(): Promise<void> {
    logger.info('FontService: Verifying and caching all 10 curated fonts...');
    for (const fontDef of Object.values(CURATED_FONTS)) {
      const targetPath = path.join(this.fontsDir, fontDef.fileName);
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < 1000) {
        try {
          await this.downloadFont(fontDef.url, targetPath);
          logger.info(`FontService: Cached ${fontDef.family}`);
        } catch (err: any) {
          logger.warn(`FontService: Failed to cache ${fontDef.family}:`, err.message);
        }
      }
    }
  }

  private downloadFont(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      https
        .get(url, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            if (!redirectUrl) {
              file.close();
              return reject(new Error('Redirect with no location header'));
            }
            file.close();
            return this.downloadFont(redirectUrl, destPath).then(resolve).catch(reject);
          }
          if (response.statusCode !== 200) {
            file.close();
            fs.unlink(destPath, () => {});
            return reject(new Error(`Failed to download font: HTTP ${response.statusCode}`));
          }
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', (err) => {
          file.close();
          fs.unlink(destPath, () => {});
          reject(err);
        });
    });
  }
}

export const fontService = new FontService();
