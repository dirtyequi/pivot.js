#/bin/bash
file=pivot-js.js
rm $file 2>/dev/null
cat pivot.js >> $file
cat pivot_controller.js >> $file
cat pivot_chart.js >> $file
cat pivot_table.js >> $file
cat jquery_pivot_controller.js >> $file
cat jquery_pivot_chart.js >> $file
cat jquery_pivot_table.js >> $file

echo "generated $file"
