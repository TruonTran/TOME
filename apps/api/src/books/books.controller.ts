import {
  Body, ConflictException, Controller, Delete, Get, Param, Post, Put, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { AuthGuard, UserId } from '../auth/auth.guard';
import { BooksService, toPublic } from './books.service';
import { ProgressDto } from './books.dto';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

@UseGuards(AuthGuard)
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@UserId() userId: string, @UploadedFile() file: Express.Multer.File, @Body('title') title?: string) {
    return this.books.create(userId, file, title);
  }

  @Get()
  list(@UserId() userId: string) {
    return this.books.list(userId);
  }

  @Get(':id')
  async one(@UserId() userId: string, @Param('id') id: string) {
    return toPublic(await this.books.getOwned(userId, id));
  }

  /** File gốc (PDF/DOCX). sendFile tự hỗ trợ Range để pdf.js tải từng phần. */
  @Get(':id/file')
  async file(@UserId() userId: string, @Param('id') id: string, @Res() res: Response) {
    const book = await this.books.getOwned(userId, id);
    res.type(book.format === 'PDF' ? 'application/pdf' : DOCX_MIME);
    res.sendFile(resolve(book.filePath));
  }

  /** HTML đã convert (chỉ có với DOCX). */
  @Get(':id/html')
  async html(@UserId() userId: string, @Param('id') id: string, @Res() res: Response) {
    const book = await this.books.getOwned(userId, id);
    if (book.status !== 'READY' || !book.htmlPath) throw new ConflictException('Sách chưa xử lý xong');
    res.type('text/html').send(await readFile(book.htmlPath, 'utf8'));
  }

  @Put(':id/progress')
  progress(@UserId() userId: string, @Param('id') id: string, @Body() dto: ProgressDto) {
    return this.books.updateProgress(userId, id, dto);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.books.remove(userId, id);
  }
}
