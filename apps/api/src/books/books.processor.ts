import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Book } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';
import * as mammoth from 'mammoth';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { storageDir } from './books.storage';

/**
 * Worker chạy nền (BullMQ + Redis): xử lý file sau khi upload.
 * Hiện đang chạy chung tiến trình với API; sau này có thể tách ra thành service riêng.
 */
@Processor('books')
export class BooksProcessor extends WorkerHost {
  private readonly log = new Logger(BooksProcessor.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    super();
  }

  async process(job: Job<{ bookId: string }>) {
    const book = await this.prisma.book.findUnique({ where: { id: job.data.bookId } });
    if (!book) return;
    try {
      if (book.format === 'PDF') await this.processPdf(book);
      else await this.processDocx(book);
    } catch (err) {
      this.log.error(`Xử lý "${book.title}" thất bại: ${(err as Error).message}`);
      const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (lastAttempt) {
        await this.prisma.book.update({
          where: { id: book.id },
          data: { status: 'FAILED', error: 'Không đọc được file này. File có thể bị hỏng hoặc đặt mật khẩu.' },
        });
      }
      throw err;
    }
  }

  private async processPdf(book: Book) {
    const doc = await PDFDocument.load(await readFile(book.filePath), { ignoreEncryption: true, updateMetadata: false });
    await this.prisma.book.update({
      where: { id: book.id },
      data: { status: 'READY', totalPages: doc.getPageCount(), author: doc.getAuthor()?.trim() || null },
    });
  }

  private async processDocx(book: Book) {
    const { value } = await mammoth.convertToHtml({ path: book.filePath });
    const html = sanitizeHtml(value, {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'img'],
      allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: { img: ['data'] }, // mammoth nhúng ảnh dạng data URI
    });
    const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
    const htmlPath = join(storageDir(this.config, 'html'), `${book.id}.html`);
    await writeFile(htmlPath, html, 'utf8');
    await this.prisma.book.update({
      where: { id: book.id },
      data: { status: 'READY', htmlPath, wordCount: text.split(/\s+/).filter(Boolean).length },
    });
  }
}
