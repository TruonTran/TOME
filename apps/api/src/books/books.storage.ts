import { mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { ConfigService } from '@nestjs/config';

/** Thư mục lưu file: <STORAGE_DIR>/uploads (file gốc) và <STORAGE_DIR>/html (DOCX đã convert). */
export function storageDir(config: ConfigService, sub: 'uploads' | 'html') {
  const dir = join(resolve(config.get<string>('STORAGE_DIR', './storage')), sub);
  mkdirSync(dir, { recursive: true });
  return dir;
}
