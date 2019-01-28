var fs = require('fs');

console.log('usin node!');

fs.readFile('collisions.geojson', encoding='utf8', function (err, data) {
	if (err) throw err;
	var output=JSON.parse(data).data;
	console.log(data)
	output.features.forEach(function(ft){
		Object.keys(ft.properties).forEach(function(key){
			if (key !== 'TOTAL_BICY' && key !== 'TOTAL_PEDE') delete ft.properties[key]
		})
	})
	
	fs.writeFileSync('output.geojson', JSON.stringify(output))
});