#! /bin/sh 
BASE=`dirname "$0"`/..
aws s3 cp $BASE/portraits/$1  s3://dev.portraits/$1 --recursive