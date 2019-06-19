mkdir -p data

if [ ! -d ./data/Crashes_in_DC.geojson ]; then
    wget "https://opendata.arcgis.com/datasets/70392a096a8e431381f1f692aaa06afd_24.geojson" -O ./data/Crashes_in_DC.geojson
fi
