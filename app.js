mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2kiLCJhIjoiczVvbFlXQSJ9.1Gegt3V_MTupW6wfjxq2QA';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/nicki/cjav7yuqylrmk2speysk7tz9y',
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
      text: 'Population',
      geomType: 'polygon',
      data: turf.featureCollection(map.querySourceFeatures('composite', {
        sourceLayer: 'combined_features-7kmirr'
      }))
    }
  ];

  console.log(corridorInfo[3]);

  map.addControl(draw);

  map.on('draw.create', updateCorridor);
  map.on('draw.delete', updateCorridor);
  map.on('draw.update', updateCorridor);

  function updateCorridor(e) {
    // Currently, this allows you to draw multiple unconnected lines as a "corridor"
    var corridor = draw.getAll();

    // Buffer the corridor to include adjacent point features in returned data
    var bufferedCorridor = turf.buffer(corridor, 10, {units: 'meters'});

    for (item in corridorInfo) {
      // Type: Point
      if (corridorInfo[item].geomType === "point") {
        var data = turf.pointsWithinPolygon(corridorInfo[item].data, bufferedCorridor).features.length;
      }

      // Type: Polygon
      if (corridorInfo[item].geomType === "polygon") {
        // Iterate through features to check for corridor overlap
        console.log(corridorInfo[item]);
        for (i in corridorInfo[item].data.features) {
          console.log("STUFF HAPPENED");
          var feature = corridorInfo[item].data.features[i];
          console.log(feature);
          if (turf.booleanOverlap(bufferedCorridor, feature)) {
            console.log(feature.properties.population_total);
          }
        };
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
        console.log(row.id);
        var desc = row.insertCell(0);
        var more = row.insertCell(1);
      };

      desc.innerHTML =  corridorInfo[item].text + ': ' + '<span class="txt-bold">' + data + '</span> ';
      // "More" section is a placeholder for accessing:
      // 1. Information about the data the statistic was derived from
      // (we could also consolidate all the data info in one place elsewhere)
      // 2. Toggling on/off visualizations on the map for that statistic
      more.innerHTML = '<svg class="icon inline"><use xlink:href="#icon-question"/></svg> <svg class="icon inline"><use xlink:href="#icon-map"/></svg>'
    };
    document.getElementById('corridor-info').style.visibility = 'visible';
  }
});

