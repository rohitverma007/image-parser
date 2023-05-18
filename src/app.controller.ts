import { Block } from '@aws-sdk/client-textract';
import { Controller, Get, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TextractService } from './textract.service';

@Controller()
export class AppController {
  constructor(private readonly textractService: TextractService) { }

  @Get()
  getHello(): string {
    return "Post 'form-data' with 'file' as key and image as value to the /upload endpoint to retrieve date of birth and expiry date of a passport image"
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    type FinalResult = {
      dateOfBirth: string | undefined,
      dateOfExpiry: string | undefined
    }
    const document = new Uint8Array(file.buffer);
    let formFieldsFromDocument;
    try {
      formFieldsFromDocument = await this.textractService.analyzeDocument(document);
    } catch (exception) {
      throw new HttpException('Could not parse document, please upload PDF, PNG or JPEG under the 5MB size limit', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const dateOfBirthResult = this.textractService.getDateOfBirthResult(formFieldsFromDocument);
    const dateOfExpiryResult = this.textractService.getDateOfExpiryResult(formFieldsFromDocument);
    const dateOfBirth =
      dateOfBirthResult && dateOfBirthResult.length > 0
        ? dateOfBirthResult[0]["values"]
        : "Date of Birth not found, please retry or upload a clearer picture."
    const dateOfExpiry =
      dateOfExpiryResult && dateOfExpiryResult.length > 0
        ? dateOfExpiryResult[0]["values"]
        : "Date of Expiry not found, please retry or upload a clearer picture."
    if (dateOfBirthResult && dateOfBirthResult.length == 0 && dateOfExpiryResult && dateOfExpiryResult.length == 0) {
      throw new HttpException('Could not find date of birth or expiry date, please upload a clearer image.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const finalResult: FinalResult = { dateOfBirth, dateOfExpiry }
    return finalResult
  }
}
