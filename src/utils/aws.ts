import { S3Client, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DeleteCollectionCommand, CreateCollectionCommand, SearchFacesByImageCommand, IndexFacesCommand, CompareFacesCommand } from "@aws-sdk/client-rekognition";
import 'dotenv/config'

const clientConfig = {
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY||'',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY||''
    }, 
    region: "us-east-1"
}

const rekognitionClient = new RekognitionClient(clientConfig);
const s3 = new S3Client(clientConfig);


export { s3, rekognitionClient, ListObjectsCommand, PutObjectCommand, DeleteCollectionCommand, CreateCollectionCommand, SearchFacesByImageCommand, IndexFacesCommand, CompareFacesCommand }