import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { open, rm } from 'fs/promises';
import { basename, extname } from 'path';
import { Book, BookFormat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressDto } from './books.dto';

const MAGIC: Record<BookFormat, number[]> = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  DOCX: [0x50, 0x4b, 0x03, 0x04], // PK.. (docx là file zip)
};

async function startsWith(path: string, magic: number[]) {
  const fh = await open(path, 'r');
  try {
    const { buffer } = await fh.read(Buffer.alloc(magic.length), 0, magic.length, 0);
    return magic.every((byte, i) => buffer[i] === byte);
  } finally {
    await fh.close();
  }
}

/** Ẩn đường dẫn nội bộ trước khi trả về client. */
export function toPublic(book: Book) {
  const { filePath, htmlPath, ...rest } = book;
  return rest;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService, @InjectQueue('books') private readonly queue: Queue) {}

  async create(userId: string, file: Express.Multer.File | undefined, title?: string) {
    if (!file) throw new BadRequestException('Chưa chọn file');

    // multer đọc tên file theo latin1 nên tên tiếng Việt bị vỡ, đổi lại sang utf8
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = extname(originalName).toLowerCase();
    const format: BookFormat | null = ext === '.pdf' ? 'PDF' : ext === '.docx' ? 'DOCX' : null;

    // kiểm tra cả đuôi file lẫn "magic bytes", không tin mỗi tên file
    if (!format || !(await startsWith(file.path, MAGIC[format]))) {
      await rm(file.path, { force: true });
      throw new BadRequestException('Chỉ hỗ trợ file PDF và DOCX hợp lệ');
    }

    const book = await this.prisma.book.create({
      data: {
        userId,
        format,
        originalName,
        filePath: file.path,
        title: title?.trim() || basename(originalName, ext),
      },
    });
    // việc nặng (đếm trang, convert DOCX...) giao cho worker chạy nền
    await this.queue.add('process', { bookId: book.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true });
    return toPublic(book);
  }

  async list(userId: string) {
    const books = await this.prisma.book.findMany({
      where: { userId },
      orderBy: [{ lastReadAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    });
    return books.map(toPublic);
  }

  /** Lấy sách và đảm bảo đúng chủ sở hữu. */
  async getOwned(userId: string, id: string) {
    const book = await this.prisma.book.findFirst({ where: { id, userId } });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    return book;
  }

  async updateProgress(userId: string, id: string, dto: ProgressDto) {
    const book = await this.getOwned(userId, id);
    const updated = await this.prisma.book.update({
      where: { id: book.id },
      data: {
        page: dto.page,
        percent: dto.percent,
        lastReadAt: new Date(),
        finishedAt: dto.percent >= 0.98 ? (book.finishedAt ?? new Date()) : null,
      },
    });
    return toPublic(updated);
  }

  async remove(userId: string, id: string) {
    const book = await this.getOwned(userId, id);
    await this.prisma.book.delete({ where: { id: book.id } });
    await Promise.all([rm(book.filePath, { force: true }), book.htmlPath ? rm(book.htmlPath, { force: true }) : undefined]);
    return { ok: true };
  }
}
