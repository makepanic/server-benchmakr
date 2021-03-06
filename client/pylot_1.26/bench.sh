#! /bin/bash

# USAGE:
# -t TEST-APP
# -f TEST-CASE

if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "runs a pylot benchmark, creates result graphs with gnuplot (via plot-all.sh)"
  echo ""
  echo "Usage:"
  echo "	-t application type, eg. \"nodejs\""
  echo "	-f pylot case file , eg. \"time\" ( automatically adds *.xml )"
  echo ""
  echo "Example: ./bench.sh -t nodejs -f mysql"
  exit 0
fi

# pylot cfg
agents=100
duration=30
rampup=0
target="http://your-server-baseurl-here.com"
timeout=2

# cases cfg
caseDir="cases/"
targetPath=""
caseFile=""
testType=""

if [ -d "cases.bak" ]; then
	# abort if old cases backup exists
	# dont run pylot tests parallel
	echo "old case backup exists, stopping"
	exit 1
fi

while getopts ":f:t:" optname
  do
    case "$optname" in
      "t")
        echo "-t set $OPTARG"
        testType="$OPTARG"
        ;;
      "f")
        echo "-f set $OPTARG"
        caseFile="$OPTARG"
        ;;
      "?")
        echo "Unknown option $OPTARG"
        exit 1;
        ;;
      ":")
        echo "No argument value for option $OPTARG"
        exit 1;
        ;;
      *)
      # Should not occur
        echo "Unknown error while processing options"
        exit 1;
        ;;
    esac
  done

if [[ -z "$testType" ]]; then
	echo "no testType set, aborting"
	exit 1
fi
if [[ -z "$caseFile" ]]; then
	echo "no caseFile set, aborting"
	exit 1
fi

targetPath="$caseDir$testType/$caseFile.xml"


if [ ! -e "$targetPath" ]; then
	echo "target path $targetPath does not exists, aborting"
	exit 1
fi

echo "running with case '$targetPath'"
echo "pylot agents=$agents duration=$duration"
echo "inserting target url in pylot test cases"

cp -R ./cases ./cases.bak
sed -i "s|TARGETURL|$target|g" $caseFile

name=$caseFile
# run pylot with defined config
cmd="python2 run.py -n $name -r $rampup -a $agents -d $duration -x $caseFile > results/$name.pylot"

# sleep a while
sleep $timeout

# plot results via gnuplot
echo "exec plot script"
sh ./plot-all.sh

# revert backup cases
echo "reverting cases files"
rm -rf ./cases
mv ./cases.bak ./cases

echo "finished, now exiting"
exit
