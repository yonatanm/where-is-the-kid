#! /bin/sh

FILES=`aws s3 ls s3://dev.portraits/$1/ | awk '{print $4}'`
echo $FILES


for F in $FILES 
do 
      P=$1/$F
      echo extrating faces $P
      aws rekognition index-faces  --image '{"S3Object":{"Bucket":"dev.portraits","Name":"'$P'"}}' \
            --collection-id face-collection-$1       --max-faces 1    \
               --quality-filter "AUTO"       --detection-attributes "ALL" \
                  --external-image-id $F   --region us-east-1 
done
