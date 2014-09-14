#!/bin/bash

file=../pivot_chart.js
rm $file 2>/dev/null
find . -name "0*.js" | sort | xargs cat >> $file

echo "generated $file"
