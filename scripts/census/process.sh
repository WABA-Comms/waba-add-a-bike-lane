rm -rf data/convert
mkdir data/convert

ogr2ogr -f "GeoJSON" -t_srs EPSG:4326 data/convert/features.geojson data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA

ogr2ogr -f "CSV" data/convert/X01_AGE_AND_SEX.csv data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb X01_AGE_AND_SEX
ogr2ogr -f "CSV" data/convert/X08_COMMUTING.csv data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb X08_COMMUTING
ogr2ogr -f "CSV" data/convert/X19_INCOME.csv data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb X19_INCOME
ogr2ogr -f "CSV" data/convert/BG_METADATA_2015.csv data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb BG_METADATA_2015

python3 aggregate.py > data/census.geojson

echo "Combined GeoJSON written to ./data/census.geojson"
