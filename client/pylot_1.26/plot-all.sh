#! /bin/bash

echo "Starting to plot all pylot results"

find ./results -iregex '.*agent_stats.csv' | while read line; do
	filedir=$(dirname $line)
	filename=$(basename $line)
	targetfile="response_time_graph.png"
	target="$filedir/$targetfile"
	echo "starting gnuplot, target = $target"
	
	gnuplot << EOF
	
set terminal png size 1300,800
set datafile separator ","

set output "$target"

set title "$filedir"
set grid y
set xlabel "request"
set ylabel "response time(ms)"
plot "$line" using 9 smooth sbezier with lines title "Avg Response Time (secs)", \
	"$line" using 10 smooth sbezier with lines title "Avg Connect Time (secs)"	
EOF

done

find ./results -iregex '.*agent_throughputs.csv' | while read line; do
	filedir=$(dirname $line)
	filename=$(basename $line)
	targetfile="throughput_graph.png"
	target="$filedir/$targetfile"
	echo "starting gnuplot, target = $target"
	
	gnuplot << EOF
	
set terminal png size 1300,800
set datafile separator ","

set output "$target"

set title "$filedir"
set grid y
set xlabel "elapsed time"
set ylabel "requests per sec"
plot "$line" using 2 smooth sbezier with lines title "graph"

EOF
done

echo "finished plotting"
