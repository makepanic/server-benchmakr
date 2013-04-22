#! /bin/bash

agents=100
duration=30
rampup=0
target="http://your-server-baseurl-here.com"
timeout=5

echo "pylot agents=$agents duration=$duration"

echo "removing old results"
rm -rf ./results/*

echo "inserting target url in pylot test cases"
cp -R ./cases ./cases.bak
sed -i "s|TARGETURL|$target|g" ./cases/*.xml

find ./cases -iregex '.*.xml' | while read line; do
	filedir=$(dirname $line)
	filename=$(basename $line)
	name="${filename%.*}"

	echo "remote ctrl start command"
	curl "$target:9001"

	sleep $timeout
	
	cmd="python2 run.py -n $name -r $rampup -a $agents -d $duration -x cases/$filename > results/$name.pylot"
	echo "running $cmd"
	#eval $cmd

	echo "remote ctrl stop command"
	curl "$target:9002"

	sleep $timeout
done

echo "exec plot script"
sh ./plot-all.sh

echo "creating result archive"
tar -zcvf pylot-results.tar.gz ./results/

echo "moving pylot-results.tar.gz to ~"
cp pylot-results.tar.gz ~/

echo "reverting cases files"
rm -rf ./cases
mv ./cases.bak ./cases

echo "finished, now exiting"
exit
