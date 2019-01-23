mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2kiLCJhIjoiczVvbFlXQSJ9.1Gegt3V_MTupW6wfjxq2QA';

var map = new mapboxgl.Map({
  container: 'map',
  //style: 'mapbox://styles/nicki/cjav7yuqylrmk2speysk7tz9y',
  style: './add-bike-lane-style.json',
  center: [-77.007945, 38.896870],
  zoom: 12
});

var draw = new MapboxDraw({
  controls: {
    point: false,
    polygon: false
  }
});

// Since we are planning to also visualize the corridor data on the map, it's probably
// easiest to reuse the vector tiles for data querying.

// TODO: filter these crash queries to only include 2016 and later
// However, the `REPORTDATE` field contains string values, not numbers, so we may want to reformat these first
// although it would make data updates easier if we didn't reformat it...

map.on('load', function() {
  var corridorInfo = [
    {
      id: 'crashes-total',
      text: 'total crashes',
      geomType: 'point',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'Crashes_in_DC-d0weq7'
      }))
    },
    {
      id: 'crashes-cyclists',
      text: 'bike-related crashes',
      geomType: 'point',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'Crashes_in_DC-d0weq7',
        filter: ['>', 'TOTAL_BICY', 0]
      }))
    },
    {
      id: 'crashes-pedestrians',
      text: 'pedestrian-related crashes',
      geomType: 'point',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'Crashes_in_DC-d0weq7',
        filter: ['>', 'TOTAL_PEDE', 0]
      }))
    },
    {
      id: 'population',
      text: 'population',
      geomType: 'polygon',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'combined_features-7kmirr'
      })),
      measurements: ['population_total']
    },
    {
      id: 'modeshare',
      text: 'modeshare',
      geomType: 'polygon',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'combined_features-7kmirr',
      })),
      measurements: [
        'transport_bicycle',
        'transport_car_truck_or_van',
        'transport_walked',
        'transport_public_transportation_excluding_taxicab'
        ],
      total: 'transport_total'
    }
  ];

  //console.log(corridorInfo[2]);
  //console.log(corridorInfo[3]);

  // Display census data on map to help debug
  map.addLayer(
    {
      "id": "census-blocks",
      "source": "composite",
      "source-layer": "combined_features-7kmirr",
      "type": "line",
      "paint": {
        "line-color": "#0f0",
        "line-opacity": 1
      }
    }
  );
  map.addLayer(
    {
      "id": "census-blocks-population",
      "source": "composite",
      "source-layer": "combined_features-7kmirr",
      "type": "symbol",
      "layout": {
        "text-field": ["get", "population_total"],
        "symbol-placement": "point",
        "text-size": 10
      },
      "paint": {
        "text-color": "red"
      }
    }
  );

  map.addControl(draw);

  map.on('draw.create', updateCorridor);
  map.on('draw.delete', updateCorridor);
  map.on('draw.update', updateCorridor);

  function updateCorridor(e) {
    // Currently, this allows you to draw multiple unconnected lines as a "corridor"
    var corridor = draw.getAll();

    // Buffer the corridor to include adjacent point features in returned data.
    // Result is a featureCollection with a single Polygon feature
    var bufferedCorridor = turf.buffer(corridor, 10, {units: 'meters'});

    // Display buffered corridor on map to help debug
    map.addLayer(
      {
        "id": "bufferedCorridor",
        "source": {
          "type": "geojson",
          "data": bufferedCorridor
        },
        "type": "fill",
        "paint": {
          "fill-color": "#f00",
          "fill-opacity": 0.5
        }
      }
    );

    for (item in corridorInfo) {
      // Type: Point
      if (corridorInfo[item].geomType === "point") {
        var data = [turf.pointsWithinPolygon(corridorInfo[item].data, bufferedCorridor).features.length];
      }

      // Type: Polygon
      if (corridorInfo[item].geomType === "polygon") {
        var measurements = corridorInfo[item].measurements;
        var totalCount = [];
        measurements.forEach(function(){
           totalCount.push(0);
        });
        // Iterate through features to check for corridor overlap
        //console.log(corridorInfo[item]);
        for (i in corridorInfo[item].data.features) {
          var feature = corridorInfo[item].data.features[i];
          //console.log(feature);
          // We should be able to use the relatively new booleanIntersects function,
          // which is the inverse of booleanDisjoint,
          // but for some reason it isn't recognmized.
          //if (!turf.booleanDisjoint(bufferedCorridor.features[0].geometry, feature)) {
          if (!turf.booleanDisjoint(bufferedCorridor, feature)) {
            //console.log(feature.properties[measurements[0]]);
            // TODO: dedupe tiles using GEOID property (this is unique by block. Is there a better property?)
            // TODO: add optional % calculation
            // TODO: figure out why this function does seem to capture all intersecting census blocks
            for (j in measurements) {
            totalCount[j] += +feature.properties[measurements[j]];
            }
          }
          var data = totalCount;
        }
      }

      // Creates new rows in the table the first time a line is drawn
      // Replaces old data each time a new line is drawn
      // (There's probably better ways to update the table)
      if (document.getElementById('corridor-info-table').rows.length > item) {
        var row = document.getElementById(corridorInfo[item].id);
        var desc = row.cells[0];
        var more = row.cells[1];
      } else {
        var row = document.getElementById('corridor-info-table').insertRow(-1);
        row.id = corridorInfo[item].id;
        //console.log("Added row in corridor info table: " + row.id);
        var desc = row.insertCell(0);
        var more = row.insertCell(1);
      };

      if (data.length == 1) {
        console.log(data);
        desc.innerHTML =  corridorInfo[item].text + ': ' + '<span class="txt-bold">' + data[0] + '</span> ';
      } else {
        // TODO: Add additional rows for the sub-items
        desc.innerHTML =  corridorInfo[item].text + ': ' + '<span class="txt-bold">' + "test" + '</span> ';
      };
      // "More" section is a placeholder for accessing:
      // 1. Information about the data the statistic was derived from
      // (we could also consolidate all the data info in one place elsewhere)
      // 2. Toggling on/off visualizations on the map for that statistic
      more.innerHTML = '<svg class="icon inline"><use xlink:href="#icon-question"/></svg> <svg class="icon inline"><use xlink:href="#icon-map"/></svg>'
    };
    document.getElementById('corridor-info').style.visibility = 'visible';
  }
});

