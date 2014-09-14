#!/bin/bash
file=../pivot_controller.js
rm $file 2>/dev/null
find . -name "*.js" | sort | xargs cat >> $file
echo "generated $file"

rm -rf ./doc/ 2>/dev/null
jsdoc $file -d=doc
