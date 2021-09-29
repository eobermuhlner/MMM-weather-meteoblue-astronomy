Module.register("MMM-weather-meteoblue-astronomy", {
	defaults: {
		apikey: "",
		package: "basic-day",
		refreshHours: 1,
		refreshMinutes: 0,
		tz: "Europe%2FZurich",
		pictogramSmall: 40,
		pictogramLarge: 80,

		daysOfWeek: [ "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT" ]
	},

	getScripts: function() {
		return [ "moment.js" ];
	},

	getStyles: function() {
		return [ "weather-icons.css", "weather-icons-wind.css" ];
	},

	getTranslations: function() {
		return {
			en: "translations/en.json",
			de: "translations/de.json"
		};
	},

	start: function () {
		this.url = "https://my.meteoblue.com/packages/" + this.config.package + "?apikey=" + this.config.apikey + "&lat=" + this.config.lat + "&lon=" + this.config.lon + "&format=json&tz=" + this.config.tz
		if (this.config.asl) {
			this.url += "&asl=" + this.config.asl
		}

		this.weather = null;
	},

	round0: function (v) {
		return parseFloat(v).toFixed(0);
	},
	round1: function (v) {
		return parseFloat(v).toFixed(1);
	},
	padDigits: function (v, length) {
		return v.toString().padStart(length, '0');
	},

	getDom: function() {
		//console.log("getDom: ");

		var wrapper = document.createElement("div");

		if (this.config.apikey === '') {
			wrapper.innerHTML = this.translate("MISSING_APIKEY", { module: this.name });
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.weather) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.apikey === 'TEST') {
			mom = moment('2021-09-29 05:33');
		} else {
			mom = moment();
		}

		if (this.config.package.includes("current")) {
			dom = this.getCurrentDom(this.weather.data_current);
			wrapper.appendChild(dom);
		}
		if (this.config.package.includes("basic")) {
			if (this.weather.data_xmin) {
				dom = this.getBasicDom(this.weather.data_xmin, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_1h) {
				dom = this.getBasicDom(this.weather.data_1h, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_3h) {
				hours_3 = Math.floor(mom.hours()/3)*3;
				dom = this.getBasicDom(this.weather.data_3h, true, 'YYYY-MM-DD hh:mm', mom.hours(hours_3).minutes(0).seconds(0).milliseconds(0));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_day) {
				dom = this.getBasicDom(this.weather.data_day, false, 'YYYY-MM-DD', mom.startOf('day'));
				wrapper.appendChild(dom);
			}
		}
		if (this.config.package.includes("clouds")) {
			if (this.weather.data_1h) {
				dom = this.getCloudsDom(this.weather.data_1h, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_3h) {
				hours_3 = Math.floor(mom.hours()/3)*3;
				dom = this.getCloudsDom(this.weather.data_3h, 'YYYY-MM-DD hh:mm', mom.hours(hours_3).minutes(0).seconds(0).milliseconds(0));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_day) {
				dom = this.getCloudsDom(this.weather.data_day, 'YYYY-MM-DD', mom.startOf('day'));
				wrapper.appendChild(dom);
			}
		}

		return wrapper;
	},

	getCurrentDom: function(data) {
		table = document.createElement("table");
		table.className = "small";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		tr = document.createElement("tr");
		tbody.appendChild(tr);

		td = document.createElement("td");
		tr.appendChild(td);

		img = document.createElement("img");
		img.src = this.pictocodeDetailedToUrl(data.pictocode_detailed, data.isdaylight)
		img.width = this.config.pictogramLarge;
		img.height = this.config.pictogramLarge;
		td.appendChild(img);

		// Temperature
		if (data.temperature) {
			td = document.createElement("td");
			td.className = "align-left";
			td.innerHTML = "<i class=\"fa fa-thermometer-half\">&nbsp;</i>";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = this.round1(data.temperature) + "&deg;";
			tr.appendChild(td);
		}

		// Windspeed
		if (data.windspeed) {
			td = document.createElement("td");
			td.className = "align-left";
			td.innerHTML = "<i class=\"wi wi-strong-wind\">&nbsp;</i>";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = this.round1(data.windspeed) + " m/s";
			tr.appendChild(td);
		}

		return table;
	},

	getBasicDom: function(data, detailedPicto, dateTimeFormat, roundedNow) {
		table = document.createElement("table");
		table.className = "small";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		// add header
		tr = document.createElement("tr");
		tbody.appendChild(tr);

		td = document.createElement("td");
		td.className = "align-left";
		td.innerHTML = "Date/Time";
		tr.appendChild(td);

		td = document.createElement("td");
		td.className = "align-left";
		//td.innerHTML = "Pictocode";
		tr.appendChild(td);

		td = document.createElement("td");
		td.className = "align-left";
		td.setAttribute("colspan", 2);
		//td.innerHTML = "Precipitation";
		td.innerHTML = "<i class=\"wi wi-rain\">&nbsp;</i>";
		tr.appendChild(td);

		td = document.createElement("td");
		td.className = "align-left";
		//td.innerHTML = "Temperature";
		td.innerHTML = "<i class=\"fa fa-thermometer-half\">&nbsp;</i>";
		if (data.temperature_min) {
			td.setAttribute("colspan", 2);
		}
		tr.appendChild(td);

		td = document.createElement("td");
		td.className = "align-left";
		td.setAttribute("colspan", 2);
		//td.innerHTML = "Wind Direction";
		td.innerHTML = "<i class=\"wi wi-wind-direction\">&nbsp;</i>";
		tr.appendChild(td);

		td = document.createElement("td");
		td.className = "align-left";
		//td.innerHTML = "Wind Speed";
		td.innerHTML = "<i class=\"wi wi-strong-wind\">&nbsp;</i>";
		if (data.windspeed_min) {
			td.setAttribute("colspan", 2);
		}
		tr.appendChild(td);

		// add data rows
		opacity = 1.0;
		for (let i = 0; i < data.time.length && i < 10; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}

			tr = document.createElement("tr");
			tr.style.opacity = opacity;
			opacity = opacity * 0.8;
			tbody.appendChild(tr);

			td = document.createElement("td");
			td.className = "align-left";
			td.innerHTML = data.time[i] + " " + this.translate(this.config.daysOfWeek[mom.day()]);

			tr.appendChild(td);

			td = document.createElement("td");
			tr.appendChild(td);

			img = document.createElement("img");
			if (detailedPicto) {
				img.src = this.pictocodeDetailedToUrl(data.pictocode[i], data.isdaylight[i])
			} else {
				img.src = this.pictocodeToUrl(data.pictocode[i])
			}
			img.width = this.config.pictogramSmall;
			img.height = this.config.pictogramSmall;
			td.appendChild(img);


			td = document.createElement("td");
			td.innerHTML = this.round1(data.precipitation[i]) + " mm";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = data.precipitation_probability[i] + "%";
			tr.appendChild(td);

			if (data.temperature) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature[i]) + "&deg;";
				tr.appendChild(td);
			}

			if (data.temperature_min) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature_min[i]) + "&deg;";
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature_max[i]) + "&deg;";
				tr.appendChild(td);
			}

			td = document.createElement("td");
			td.innerHTML = this.round1(data.winddirection[i]) + "&deg";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = this.degToCompass(data.winddirection[i]) + "<i class=\"wi wi-wind from-" + this.round0(data.winddirection[i]) + "-deg\">&nbsp;</i>";
			tr.appendChild(td);

			if (data.windspeed) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.windspeed[i]) + " m/s";
				tr.appendChild(td);
			}

			if (data.windspeed_min) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.windspeed_min[i]) + " m/s";
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = this.round1(data.windspeed_max[i]) + " m/s";
				tr.appendChild(td);
			}
		}

		return table;
	},

	getCloudsDom: function(data, dateTimeFormat, roundedNow) {
		table = document.createElement("table");
		table.className = "small";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		// add header
		tr = document.createElement("tr");
		tbody.appendChild(tr);

		td = document.createElement("td");
		td.innerHTML = "Date/Time";
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = "Low";
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = "Mid";
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = "High";
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = "Visibility";
		tr.appendChild(td);

		// add data rows
		opacity = 1.0;
		for (let i = 0; i < data.time.length; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}

			tr = document.createElement("tr");
			tr.style.opacity = opacity;
			opacity = opacity * 0.92;
			tbody.appendChild(tr);

			td = document.createElement("td");
			td.innerHTML = data.time[i];
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = data.lowclouds[i] + "%";
			td.style.color = this.cloudToForegroundColor(data.lowclouds[i]);
			td.style.backgroundColor = this.cloudToBackgroundColor(data.lowclouds[i]);
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = data.midclouds[i] + "%";
			td.style.color = this.cloudToForegroundColor(data.midclouds[i]);
			td.style.backgroundColor = this.cloudToBackgroundColor(data.midclouds[i]);
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = data.highclouds[i] + "%";
			td.style.color = this.cloudToForegroundColor(data.highclouds[i]);
			td.style.backgroundColor = this.cloudToBackgroundColor(data.highclouds[i]);
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = data.visibility[i] + " m";
			tr.appendChild(td);
		}

		return table;
	},

	getWeather: function() {
		console.log("getWeather: " + this.url);

		this.sendSocketNotification('GET_WEATHER', this.url);
	},

	notificationReceived: function(notification, payload, sender) {
		//console.log("notificationReceived: " + this.notification);

		switch(notification) {
			case "DOM_OBJECTS_CREATED":
				this.getWeather();

				var millis = this.config.refreshHours*60*60*1000 + this.config.refreshMinutes*60*1000
				var timer = setInterval(()=>{
					this.getWeather();
				}, millis)
				break;
			}
	},

	processWeather: function(data) {
		this.weather = data;
	},

	socketNotificationReceived: function(notification, payload) {
		console.log("socketNotificationReceived: " + this.notification);

		if (notification === 'WEATHER_RESULT') {
			this.processWeather(payload);
			this.updateDom();
		}
	},

	convertToWeatherIcon: function(icon) {
		wi-day-sunny
	},

	cloudToForegroundColor: function(percent) {
		return percent < 70 ? "white" : "black";
	},

	cloudToBackgroundColor: function(percent) {
		// 00003c = 0%
		// 909090 = 60%
		// f0f0c8 = 100%
    	var r = 0xf0 * percent * 0.01;
    	var g = 0xf0 * percent * 0.01;
    	var b = (0xc8 - 0x3c) * percent * 0.01 + 0x3c;
		return "rgb(" + r + "," + g + "," + b + ")";
	},

	pictocodeToUrl: function(pictocode) {
		return "./modules/MMM-weather-meteoblue-astronomy/icons/" + this.padDigits(pictocode, 2) + "_iday.svg";
	},

	pictocodeDetailedToUrl: function(pictocode, isdaylight) {
		pictoSuffix = isdaylight ? "day" : "night";
		return "./modules/MMM-weather-meteoblue-astronomy/icons/" + this.padDigits(pictocode, 2) + "_" + pictoSuffix + ".svg";
	},

	degToCompass: function(num) {
		var index = Math.floor((num / 22.5) + 0.5) % 16;
		var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
		return arr[index];
	},

})
