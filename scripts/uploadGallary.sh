#! /bin/sh 
BASE=`dirname "$0"`/..
aws s3 cp $BASE/gallary  s3://dev.gallary/ --include="*" --recursive