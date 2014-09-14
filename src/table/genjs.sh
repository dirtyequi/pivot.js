#!/bin/bash

file=../pivot_table.js
[ -f $file ] && rm $file

find . -name "0*.js" | sort | xargs cat >> $file;

echo "generated $file"
