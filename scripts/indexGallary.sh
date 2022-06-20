#! /bin/sh

FILES=`aws s3 ls s3://dev.gallary/ | awk '{print $4}'`
echo $FILES

aws rekognition delete-collection --collection-id face-collection-gallary  --region us-east-1
sleep 5
aws rekognition create-collection --collection-id face-collection-gallary  --region us-east-1

for F in $FILES 
do 
      echo extrating faces from $F
      aws rekognition index-faces --image '{"S3Object":{"Bucket":"dev.gallary","Name":"'$F'"}}' \
        --collection-id face-collection-gallary     \
             --quality-filter "AUTO"       --detection-attributes "ALL"     \
             --external-image-id $F   --region us-east-1 
done
