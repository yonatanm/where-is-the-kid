import { S3Client, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DeleteCollectionCommand, CreateCollectionCommand, SearchFacesByImageCommand, IndexFacesCommand } from "@aws-sdk/client-rekognition";

const clientConfig = {
    credentials: {
    }, 
    region: "us-east-1"
}

const rekognitionClient = new RekognitionClient(clientConfig);
const s3 = new S3Client(clientConfig);


export { s3, rekognitionClient, ListObjectsCommand, PutObjectCommand, DeleteCollectionCommand, CreateCollectionCommand, SearchFacesByImageCommand, IndexFacesCommand }