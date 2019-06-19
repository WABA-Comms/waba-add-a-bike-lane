mkdir -p data

if [ ! -d ./data/ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb ]; then
    wget "http://www2.census.gov/geo/tiger/TIGER_DP/2015ACS/ACS_2015_5YR_BG_11.gdb.zip" -O ./data/ACS_2015_5YR_BG_11.gdb.zip
    unzip ./data/ACS_2015_5YR_BG_11.gdb.zip
    mv ACS_2015_5YR_BG_11_DISTRICT_OF_COLUMBIA.gdb data/
fi

rm -r ./data/ACS_2015_5YR_BG_11.gdb.zip
