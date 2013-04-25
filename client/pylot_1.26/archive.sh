#! /bin/bash

echo "creating result archive"
tar -zcvf "archives/pylot-results-$(date +%s).tar.gz" ./results/

echo "removing old results"
rm -rf ./results/*