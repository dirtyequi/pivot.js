#!/bin/bash

file=../pivot.js
[ -f $file ] && rm $file

cat summaries.js >> $file
cat utils.js >> $file
find . -name "0*.js" | sort | xargs cat >> $file;

echo "generated $file"
