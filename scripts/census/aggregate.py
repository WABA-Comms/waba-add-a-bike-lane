#!/usr/bin/which python3

import csv, json, re, collections, sys

metadata_csv = list(csv.DictReader(open("./data/convert/BG_METADATA_2015.csv")))
metadata = [
    (row['Short_Name'], list(map(lambda s: s.strip(), row['Full_Name'].split(':'))))\
    for row in metadata_csv
]

# transport
transport = [
    (
        row[0],
        "transport_" + re.sub(r"[^a-zA-Z0-9]+", "_", row[1][1]).strip("_").lower()
    ) for row in metadata if\
        row[1][0] == 'MEANS OF TRANSPORTATION TO WORK' and\
        row[1][2] == 'Workers 16 years and over -- (Estimate)'
]

# income
income = [
    (
        row[0],
        "income_" + re.sub(r"[^a-zA-Z0-9]+", "_", row[1][1]).strip("_").lower()
    ) for row in metadata if\
        row[1][0] == 'HOUSEHOLD INCOME IN THE PAST 12 MONTHS (IN 2015 INFLATION-ADJUSTED DOLLARS)' and\
        row[1][2] == 'Households -- (Estimate)'
]

# population
population = [('B01003e1', 'population_total')]

extra_data = collections.defaultdict(dict)
for f in ["X01_AGE_AND_SEX.csv", "X08_COMMUTING.csv", "X19_INCOME.csv"]:
    data = csv.DictReader(open("./data/convert/" + f))

    file_fields = []
    for field in transport + income + population:
        if field[0] in data.fieldnames:
            file_fields.append(field)

    for row in data:
        for field in file_fields:
            extra_data[row['GEOID']][field[1]] = row[field[0]]

geojson = json.load(open("./data/convert/features.geojson"))
for feature in geojson['features']:
    feature['properties'] = {**feature['properties'], **extra_data[feature['properties']['GEOID_Data']]}

json.dump(geojson, sys.stdout, indent=4)


