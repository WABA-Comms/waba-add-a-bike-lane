mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2kiLCJhIjoiczVvbFlXQSJ9.1Gegt3V_MTupW6wfjxq2QA';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-77.007945, 38.896870],
    zoom: 12
});

var draw = new MapboxDraw({
    controls: {
        point: false,
        polygon: false
    }
});
console.log('foo')
map.addControl(draw);

map.on('load', function() {
	d3.json('scripts/collisions/collisions.geojson', function(err, resp){
	console.log(resp)
	data = resp

	corridorInfo = [
		{
			id: 'crashes-total',
			text: 'total crashes',
			data: data
		},
		{
			id: 'crashes-cyclists',
			text: 'bike-related crashes',
			data: turf.featureCollection(data.features.filter(function(ft){
				return ft.properties.TOTAL_BICY > 0
			}))
		},
		{
			id: 'crashes-pedestrians',
			text: 'pedestrian-related crashes',
			data: turf.featureCollection(data.features.filter(function(ft){
				return ft.properties.PEDE > 0
			}))
		}
	];

// Since we are planning to also visualize the corridor data on the map, it's probably
// easiest to reuse the vector tiles for data querying.

// TODO: filter these crash queries to only include 2016 and later
// However, the `REPORTDATE` field contains string values, not numbers, so we may want to reformat these first
// although it would make data updates easier if we didn't reformat it...
	map
	.addLayer({
		'id':'collisions',
		'type':'circle',
		'source': {
			'type': 'geojson',
			'data': data
		},
		'paint':{
			'circle-radius':3
		}
	})
	.addLayer({
		'id':'buffer',
		'type':'fill',
		'source': {
			'type': 'geojson',
			'data': {
			  "type": "FeatureCollection",
			  "features": []
			}
		},
		'paint':{
			'fill-opacity':0.25
		}
	})

	map.on('draw.create', updateCorridor);
	map.on('draw.delete', updateCorridor);
	map.on('draw.update', updateCorridor);

	function updateCorridor(e) {

		var corridor = draw.getAll();

		// Currently, this allows you to draw multiple unconnected lines as a "corridor"
		var bufferedCorridor = turf.buffer(corridor, 10, {units: 'meters'});
		drawBuffer(bufferedCorridor)
		drawCollisions(turf.pointsWithinPolygon(data, bufferedCorridor));
		map.fitBounds(turf.bbox(bufferedCorridor), {padding:{left:400, top:20, right:20, bottom:20}})
		for (var i = 0; i < corridorInfo.length; i++) {
			// var data will need to be assigned differently depending on the source
			// current implementation only works for points
			var data = turf.pointsWithinPolygon(corridorInfo[i].data, bufferedCorridor).features.length;
			// Creates new rows in the table the first time a line is drawn
			// Replaces old data each time a new line is drawn
			// (There's probably better ways to update the table):
			if (document.getElementById('corridor-info-table').rows.length > i) {
				var row = document.getElementById(corridorInfo[i].id);
				var desc = row.cells[0];
				var more = row.cells[1];
			} else {
				var row = document.getElementById('corridor-info-table').insertRow(-1);
				row.id = corridorInfo[i].id;
				console.log(row.id);
				var desc = row.insertCell(0);
				var more = row.insertCell(1);
			};
			desc.innerHTML =  '<span class="txt-bold">' + data + '</span> ' + corridorInfo[i].text;
			// "More" section is a placeholder for accessing:
			// 1. Information about the data the statistic was derived from 
			// (we could also consolidate all the data info in one place elsewhere)
			// 2. Toggling on/off visualizations on the map for that statistic
			more.innerHTML = '<svg class="icon inline"><use xlink:href="#icon-question"/></svg> <svg class="icon inline"><use xlink:href="#icon-map"/></svg>'
		};
		document.getElementById('corridor-info').style.visibility = 'visible';
	}

	function drawBuffer(geojson){
		map.getSource('buffer')
			.setData(geojson)
	}

	function drawCollisions(geojson){
		map.getSource('collisions')
			.setData(geojson)
	}
});
})
