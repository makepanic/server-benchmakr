#! /bin/bash

echo "starting all nodejs files"

find . -maxdepth 1 -iregex '.*js' | while read line; do
	cmd="node $line &"
	echo "exec $cmd"
	eval $cmd
done

echo "finished"
exit
