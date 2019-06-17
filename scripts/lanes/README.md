This directory contains a script for aggregating connected networks of bike lanes and trails in DC.

# Steps:

* create a `data` subdirectory
* add the bike lanes and bike trails data to it (`data/Bicycle_Lanes/Bicycle_Lanes.shp` and `data/Bike_Trails/Bike_Trails.shp` should exist)
* run the `convert.sh` script to convert to geojson
* run the `cluster.js` script, which should generate a `data/out.geojson` file with the aggregated network