import { Injectable } from '@nestjs/common';
import { TextractClient, AnalyzeDocumentCommand, Block } from "@aws-sdk/client-textract";

@Injectable()
export class TextractService {
  private readonly textractClient: TextractClient;

  constructor() {
    this.textractClient = new TextractClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      region: process.env.AWS_REGION || "us-east-1",
    });
  }


  extractText(blocks: any[], block: any) {
    if (!block.Relationships) {
      return '';
    }
    const wordIds = block.Relationships.filter((rel: { Type: string; }) => rel.Type === 'CHILD').flatMap((rel: { Ids: any; }) => rel.Ids);
    const words = blocks.filter((b) => wordIds.includes(b.Id));
    return words.map((word) => word.Text).join(' ');
  }

  groupFormFields(blocks: Block[] | undefined) {
    const keyValueSets = blocks?.filter((block) => block.BlockType === 'KEY_VALUE_SET');

    const keys = keyValueSets?.filter((block) => block?.EntityTypes?.includes('KEY'))
      .map((block: any) => ({ block, text: this.extractText(blocks as Block[], block) }));

    const values = keyValueSets?.filter((block) => block?.EntityTypes?.includes('VALUE'))
      .map((block: any) => ({ block, text: this.extractText(blocks as Block[], block) }));

    const formFields = keys?.map((key: { text: string, block: { Relationships: { Type: string, Ids: [string] }[]; }; }) => {
      const relatedValues = values?.filter((value: { block: { Id: string; }; }) => {
        const keyRelationships = key.block.Relationships || [];
        return keyRelationships.some(
          (relationship) => relationship.Type === 'VALUE' && relationship?.Ids?.includes(value.block.Id as string),
        );
      });
      return { key, values: relatedValues };
    });

    return formFields;
  }

  getDateOfBirthResult(formattedFormFields: any[] | undefined): any[] | undefined {
    const arrayOfDOBMatches = [
      "date of birth",
      "date of bith",
    ]
    const dateOfBirthExists = formattedFormFields?.filter((eachResult) => {
      return arrayOfDOBMatches.some((dobMatch: string) => {
        return eachResult.key?.toLowerCase().includes(dobMatch)
      })
    });
    return dateOfBirthExists
  }

  getDateOfExpiryResult(formattedFormFields: any[] | undefined): any[] | undefined {
    const arrayOfExpiryDateMatches = [
      "date of expiry",
      "expiry date"
    ]
    const dateOfExpiryExists = formattedFormFields?.filter((eachResult) => {
      return arrayOfExpiryDateMatches.some((dobMatch: string) => {
        return eachResult.key?.toLowerCase().includes(dobMatch)
      })
    });
    return dateOfExpiryExists
  }

  async analyzeDocument(document: Uint8Array): Promise<any[] | undefined> {
    const params = {
      Document: { Bytes: document },
      FeatureTypes: ['FORMS'],
    };
    const analyzeDoc = new AnalyzeDocumentCommand(params)
    const results = await this.textractClient.send(analyzeDoc)
    const formFields = this.groupFormFields(results.Blocks);
    const formattedFormFields = formFields?.map((field) => ({
      key: field.key.text,
      values: field?.values?.map((value) => value.text)[0],
    }));
    return formattedFormFields
  }
}
