Module.register("MMM-weather-meteoblue-astronomy", {
	defaults: {
		apikey: "",
		package: "basic-day",
		refreshHours: 1,
		refreshMinutes: 0,
		tz: "Europe%2FZurich",
		pictogramSmall: 30,
		pictogramLarge: 80,
		layout: "vertical",
		maxElements: 10,
		opacityFactor: 0.8,

		daysOfWeek: [ "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT" ]
	},

	getScripts: function() {
		return [ "moment.js" ];
	},

	getStyles: function() {
		return [ "weather-icons.css", "weather-icons-wind.css", "MMM-weather-meteoblue-astronomy.css" ];
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
		} else {
			if (this.weather.data_xmin) {
				dom = this.getForecastDom(this.weather.data_xmin, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_1h) {
				dom = this.getForecastDom(this.weather.data_1h, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_3h) {
				hours_3 = Math.floor(mom.hours()/3)*3;
				dom = this.getForecastDom(this.weather.data_3h, true, 'YYYY-MM-DD hh:mm', mom.hours(hours_3).minutes(0).seconds(0).milliseconds(0));
				wrapper.appendChild(dom);
			}
			if (this.weather.data_day) {
				dom = this.getForecastDom(this.weather.data_day, false, 'YYYY-MM-DD', mom.startOf('day'));
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

	getForecastDom: function(data, detailedPicto, dateTimeFormat, roundedNow) {
		if (this.config.layout === 'vertical') {
			return this.getForecastVerticalDom(data, detailedPicto, dateTimeFormat, roundedNow);
		} else {
			return this.getForecastHorizontalDom(data, detailedPicto, dateTimeFormat, roundedNow);
		}
	},

	getForecastHorizontalDom: function(data, detailedPicto, dateTimeFormat, roundedNow) {
		var self = this;
		table = document.createElement("table");
		table.className = "small";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		if (data.time && false) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");
				td.className = "align-left";
				td.innerHTML = data.time[i];
				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.pictocode) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				var td = document.createElement("td");
				var img = document.createElement("img");
				if (detailedPicto) {
					img.src = self.pictocodeDetailedToUrl(data.pictocode[i], data.isdaylight[i])
				} else {
					img.src = self.pictocodeToUrl(data.pictocode[i])
				}
				img.width = self.config.pictogramLarge;
				img.height = self.config.pictogramLarge;
				td.appendChild(img);
				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.precipitation) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");
				td.className = "align-left";

				span = document.createElement("span");
				span.innerHTML = self.round1(data.precipitation[i]);
				span.className = "bright";
				td.appendChild(span);

				span = document.createElement("span");
				span.innerHTML = " mm";
				span.className = "dimmed xsmall";
				td.appendChild(span);

				if (data.precipitation_probability) {
					span = document.createElement("span");
					span.innerHTML = "&nbsp;" + data.precipitation_probability[i] + "%";
					span.className = "dimmed xsmall";
					td.appendChild(span);
				}

				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.temperature || data.temperature_min || date.temperature_max) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");
				td.className = "align-left";
				if (data.temperature) {
					span = document.createElement("span");
					span.innerHTML = self.round1(data.temperature[i]) + "&deg;";
					span.style.color = self.temperatureToColor(data.temperature[i]);
					span.className = "bright";
					td.appendChild(span);
				}
				if (data.temperature_min) {
					span = document.createElement("span");
					span.innerHTML = self.round1(data.temperature_min[i]) + "&deg;";
					span.style.color = self.temperatureToColor(data.temperature_min[i]);
					span.className = "bright";
					td.appendChild(span);
				}
				if (data.temperature_min && data.temperature_max) {
					span = document.createElement("span");
					span.innerHTML = "&hellip;";
					td.appendChild(span);
				}
				if (data.temperature_max) {
					span = document.createElement("span");
					span.innerHTML = self.round1(data.temperature_max[i]) + "&deg;";
					span.style.color = self.temperatureToColor(data.temperature_max[i]);
					span.className = "bright";
					td.appendChild(span);
				}
				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.windspeed || data.windspeed_max) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");
				td.className = "align-left";
				if (data.windspeed) {
					span = document.createElement("span");
					span.innerHTML = self.round1(data.windspeed[i]);
					span.className = "bright";
					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = " m/s";
					span.className = "dimmed xsmall";
					td.appendChild(span);

				}
				if (data.windspeed_max) {
					span = document.createElement("span");
					span.innerHTML = self.round1(data.windspeed_max[i]);
					span.className = "bright";
					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = " m/s";
					span.className = "dimmed xsmall";
					td.appendChild(span);
				}
				if (data.winddirection) {
//					span = document.createElement("span");
//					span.innerHTML = "<i class=\"center-icon wi wi-wind from-" + self.round0(data.winddirection[i]) + "-deg\">&nbsp;</i>";
//					span.className = "dimmed";
//					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = "&nbsp;" + self.translate(self.degToCompass(data.winddirection[i]));
					span.className = "dimmed";
					td.appendChild(span);
				}
				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.lowclouds || data.midclouds || data.highclouds) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");

				if (data.highclouds) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.highclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}
				if (data.midclouds) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.midclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}
				if (data.lowclouds) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.lowclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}

				return td;
			});
			tbody.appendChild(tr);
		}

		if (data.lowclouds_min || data.midclouds_min || data.highclouds_min) {
			var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function(i) {
				td = document.createElement("td");

				if (data.highclouds_min) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.highclouds_min[i]));
					div.appendChild(self.createCloudCoverElement(data.highclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}
				if (data.midclouds_min) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.midclouds_min[i]));
					div.appendChild(self.createCloudCoverElement(data.midclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}
				if (data.lowclouds_min) {
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.lowclouds_min[i]));
					div.appendChild(self.createCloudCoverElement(data.lowclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
				}

				return td;
			});
			tbody.appendChild(tr);
		}

		return table;
	},

	createTableRow: function(data, dateTimeFormat, roundedNow, createTableData) {
		var tr = document.createElement("tr");

		opacity = 1.0;
		for (let i = 0; i < data.time.length && i < this.config.maxElements; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}

			var td = createTableData(i);
			td.style.opacity = opacity;
			opacity = opacity * this.config.opacityFactor;
			tr.appendChild(td);
		}

		return tr;
	},

	getForecastVerticalDom: function(data, detailedPicto, dateTimeFormat, roundedNow) {
		table = document.createElement("table");
		table.className = "small";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		// add data rows
		opacity = 1.0;
		for (let i = 0; i < data.time.length && i < this.config.maxElements; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}

			tr = document.createElement("tr");
			tr.style.opacity = opacity;
			opacity = opacity * this.config.opacityFactor;
			tbody.appendChild(tr);

			td = document.createElement("td");
			td.className = "align-left";
			td.innerHTML = data.time[i] + " " + this.translate(this.config.daysOfWeek[mom.day()]);

			tr.appendChild(td);


			if (data.pictocode) {
				td = document.createElement("td");
				img = document.createElement("img");
				if (detailedPicto) {
					img.src = this.pictocodeDetailedToUrl(data.pictocode[i], data.isdaylight[i])
				} else {
					img.src = this.pictocodeToUrl(data.pictocode[i])
				}
				img.width = this.config.pictogramSmall;
				img.height = this.config.pictogramSmall;
				td.appendChild(img);
				tr.appendChild(td);
			}

			if (data.precipitation) {
				td = document.createElement("td");
				td.className = "dimmed table-icon";
				if (data.snowfraction && data.snowfraction[i] > 0.0) {
					td.innerHTML = "<i class=\"wi wi-snowflake-cold\">&nbsp;</i>";
				} else {
					td.innerHTML = "<i class=\"wi wi-raindrop\">&nbsp;</i>";
				}
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = this.round1(data.precipitation[i]) + " mm";
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.precipitation_probability) {
				td = document.createElement("td");
				td.innerHTML = data.precipitation_probability[i] + "%";
				tr.appendChild(td);
			}

			if (data.temperature || data.temperature_min || data.temperature_max) {
				td = document.createElement("td");
				td.innerHTML = "<i class=\"fa fa-thermometer-half\">&nbsp;</i>";
				td.className = "dimmed table-icon";
				tr.appendChild(td);
			}

			if (data.temperature) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature[i]) + "&deg;";
				td.style.color = this.temperatureToColor(data.temperature[i]);
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.temperature_min) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature_min[i]) + "&deg;";
				td.style.color = this.temperatureToColor(data.temperature_min[i]);
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.temperature_max) {
				td = document.createElement("td");
				td.innerHTML = "&hellip;";
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = this.round1(data.temperature_max[i]) + "&deg;";
				td.style.color = this.temperatureToColor(data.temperature_max[i]);
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.windspeed || data.windspeed_max) {
				td = document.createElement("td");
				td.innerHTML = "<i class=\"wi wi-strong-wind\">&nbsp;</i>";
				td.className = "dimmed table-icon";
				tr.appendChild(td);
			}

			if (data.windspeed) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.windspeed[i]) + " m/s";
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.windspeed_max) {
				td = document.createElement("td");
				td.innerHTML = this.round1(data.windspeed_max[i]) + " m/s";
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.winddirection) {
				td = document.createElement("td");
				td.innerHTML = "<i class=\"center-icon wi wi-wind from-" + this.round0(data.winddirection[i]) + "-deg\">&nbsp;</i>";
				td.className = "dimmed";
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = this.translate(this.degToCompass(data.winddirection[i]));
				td.className = "bright";
				tr.appendChild(td);
			}

			if (data.lowclouds || data.lowclouds_min) {
				td = document.createElement("td");
				td.innerHTML = "<i class=\"wi wi-cloud\">&nbsp;</i>";
				td.className = "dimmed table-icon";
				tr.appendChild(td);
			}

			if (data.lowclouds) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.lowclouds[i]));
				tr.appendChild(td);
			}
			if (data.midclouds) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.midclouds[i]));
				tr.appendChild(td);
			}
			if (data.highclouds) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.highclouds[i]));
				tr.appendChild(td);
			}

			if (data.lowclouds_min) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.lowclouds_min[i]));
				tr.appendChild(td);
			}
			if (data.midclouds_min) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.midclouds_min[i]));
				tr.appendChild(td);
			}
			if (data.highclouds_min) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.highclouds_min[i]));
				tr.appendChild(td);
			}

			if (data.lowclouds_max) {
				td = document.createElement("td");
				td.innerHTML = "&hellip;";
				tr.appendChild(td);

				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.lowclouds_max[i]));
				tr.appendChild(td);
			}
			if (data.midclouds_max) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.midclouds_max[i]));
				tr.appendChild(td);
			}
			if (data.highclouds_max) {
				td = document.createElement("td");
				td.appendChild(this.createCloudCoverElement(data.highclouds_max[i]));
				tr.appendChild(td);
			}

			if (data.visibility) {
				td = document.createElement("td");
				td.innerHTML = data.visibility[i] + " m";
				tr.appendChild(td);
			}
		}

		return table;
	},

	createCloudCoverElement: function(cloud) {
		var span = document.createElement("span");
		span.innerHTML = cloud + "%";
		span.className = "xsmall";
		span.style.color = this.cloudToForegroundColor(cloud);
		span.style.backgroundColor = this.cloudToBackgroundColor(cloud);
		span.style.flex = 1;
		return span;
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
		//console.log("socketNotificationReceived: " + this.notification);

		if (notification === 'WEATHER_RESULT') {
			this.processWeather(payload);
			this.updateDom();
		}
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

	temperatureToColor: function(celsius) {
		var center = 18
		if (celsius > center) {
			var x = Math.min(1.0, (celsius - center) / 20);
			var r = 100;
			var g = 100 - x * 50;
			var b = 100 - x * 50;
			return "rgb(" + r + "%," + g + "%," + b + "%)";
		} else {
			var x = Math.min(1.0, (center - celsius) / 20);
			var r = 100 - x * 50;
			var g = 100 - x * 50;
			var b = 100;
			return "rgb(" + r + "%," + g + "%," + b + "%)";
		}
		return "white";
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
