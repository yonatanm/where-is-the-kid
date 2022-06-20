#! /bin/sh
BASE=`dirname "$0"`/..

# $BASE/scripts/uploadGallary.sh
# $BASE/scripts/indexGallary.sh $1

echo mathing $1 portraits with Gallarry
#PORTRAIT_FACES=`aws rekognition list-faces --collection-id face-collection-$1 --region us-east-1 | jq '.Faces[].FaceId' | tr -d '"'`


FILES=`aws s3 ls s3://dev.portraits/$1/ | awk '{print $4}'`
echo $FILES

for F in $FILES 
do
    P=$1/$F
#   echo looking $P
  aws rekognition search-faces-by-image  --image '{"S3Object":{"Bucket":"dev.portraits","Name":"'$P'"}}' --collection-id face-collection-gallary --face-match-threshold 70 --region us-east-1 | jq '.FaceMatches[].Face.ExternalImageId' |  tr -d '"' 
done
