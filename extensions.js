Array.prototype.shuffle = function() {
	var places = [];
	var indices = [];
	while (places.length < this.length) {
		var index = Math.floor(Math.random() * this.length);
		if (indices[index]) continue;
		indices[index] = 1;
		places.push(this[index]);
	}
	return places;
}

String.prototype.integrateData = function(data) {
	var res = this;
	for (var placeholder in data) {
		res = res.replace(placeholder, data[placeholder]);
	}
	return res;
}