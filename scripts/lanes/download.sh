mkdir -p data

if [ ! -d ./data/Bicycle_Lanes.zip ]; then
    wget "https://opendata.arcgis.com/datasets/294e062cdf2c48d5b9cbc374d9709bc0_2.zip" -O ./data/Bicycle_Lanes.zip
    unzip ./data/Bicycle_Lanes.zip -d ./data/Bicycle_Lanes
fi

if [ ! -d ./data/Bike_Trails.zip ]; then
    wget "https://opendata.arcgis.com/datasets/e8c2b7ef54fb43d9a2ed1b0b75d0a14d_4.zip" -O ./data/Bike_Trails.zip
    unzip ./data/Bike_Trails.zip -d ./data/Bike_Trails
fi

ogr2ogr -t_srs EPSG:4326 -f GeoJSON data/Bicycle_Lanes.geojson ./data/Bicycle_Lanes/Bicycle_Lanes.shp
ogr2ogr -t_srs EPSG:4326 -f GeoJSON data/Bike_Trails.geojson ./data/Bike_Trails/Bike_Trails.shp

rm -r ./data/Bicycle_Lanes
rm -r ./data/Bike_Trails
rm ./data/Bicycle_Lanes.zip
rm ./data/Bike_Trails.zip
