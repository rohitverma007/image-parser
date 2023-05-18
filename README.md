## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Endpoints

Send a multipart/form-data with `file` as key and the file itself as the value to the `/upload` endpoint to retreive Date of Birth and Date of Expiry from the document.

Example Request via curl:

`curl --location 'http://localhost:3000/upload' --form 'file=@"file.pdf"'`

Example Successful Response:

```
{
    "dateOfBirth": "17 AUG 1945",
    "dateOfExpiry": "26 JAN 2016"
}
```

Example Error Response:

```
{
    "statusCode":500,
    "message":"Could not parse document, please upload PDF, PNG or JPEG under the 5MB size limit"
}
```
