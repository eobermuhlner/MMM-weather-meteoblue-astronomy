Module.register("MMM-weather-meteoblue-astronomy", {
	defaults: {
		apikey: "",
		package: "basic-day",
		refreshHours: 6,
		refreshMinutes: 0,
		tz: "Europe%2FZurich",
		pictogramSmall: 30,
		pictogramLarge: 100,
		layout: "vertical",
		maxElements: 7,
		opacityFactor: 0.8,
		timeFormat: "hh:mm",
		show: [ "weekday", "time", "pictogram", "precipitation", "temperature", "wind", "clouds", "visibility" ],
		daysOfWeek: [ "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT" ]
	},

	getScripts: function() {
		return [ "moment.js", "font-awesome.js" ];
		return [ "moment.js", "font-awesome.js" ];
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
		var self = this;

		self.url = "https://my.meteoblue.com/packages/" + self.config.package + "?apikey=" + self.config.apikey + "&lat=" + self.config.lat + "&lon=" + self.config.lon + "&format=json&tz=" + self.config.tz
		if (self.config.asl) {
			self.url += "&asl=" + self.config.asl
		}

		self.weather = null;
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
		var self = this;
		//console.log("getDom: ");

		var wrapper = document.createElement("div");

		if (self.config.apikey === '') {
			wrapper.innerHTML = self.translate("MISSING_APIKEY", { module: self.name });
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!self.weather) {
			wrapper.innerHTML = self.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (self.config.apikey === 'TEST') {
			mom = moment('2021-09-29 05:33');
		} else {
			mom = moment();
		}

		if (self.config.package.includes("current")) {
			dom = self.getCurrentDom(self.weather.data_current);
			wrapper.appendChild(dom);
		} else {
			if (self.weather.data_day) {
				dom = self.getForecastDom(self.weather.data_day, false, false, 'YYYY-MM-DD', mom.startOf('day'));
				wrapper.appendChild(dom);
			}
			if (self.weather.data_3h) {
				hours_3 = Math.floor(mom.hours()/3)*3;
				dom = self.getForecastDom(self.weather.data_3h, true, true, 'YYYY-MM-DD hh:mm', mom.hours(hours_3).minutes(0).seconds(0).milliseconds(0));
				wrapper.appendChild(dom);
			}
			if (self.weather.data_1h) {
				dom = self.getForecastDom(self.weather.data_1h, true, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
			if (self.weather.data_xmin) {
				dom = self.getForecastDom(self.weather.data_xmin, true, true, 'YYYY-MM-DD hh:mm', mom.startOf('hour'));
				wrapper.appendChild(dom);
			}
		}

		return wrapper;
	},

	getCurrentDom: function(data) {
		var self = this;

		table = document.createElement("table");
		table.className = "medium";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		tr = document.createElement("tr");
		tbody.appendChild(tr);

		td = document.createElement("td");
		tr.appendChild(td);

		img = document.createElement("img");
		img.src = self.pictocodeDetailedToUrl(data.pictocode_detailed, data.isdaylight)
		img.width = self.config.pictogramLarge;
		img.height = self.config.pictogramLarge;
		td.appendChild(img);

		// Temperature
		if (data.temperature) {
			td = document.createElement("td");
			td.className = "align-left";
			td.innerHTML = "<i class=\"fa fa-thermometer-half\"></i>";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = self.round1(data.temperature) + "&deg;";
			tr.appendChild(td);
		}

		// Windspeed
		if (data.windspeed) {
			td = document.createElement("td");
			td.innerHTML = "<i class=\"wi wi-strong-wind\"></i>";
			td.className = "align-left";
			tr.appendChild(td);

			td = document.createElement("td");
			span = document.createElement("span");
			span.innerHTML = self.round1(data.windspeed);
			td.className = "bright";
			td.appendChild(span);

			span = document.createElement("span");
			span.innerHTML = "&nbsp;m/s";
			td.className = "dimmed";
			td.appendChild(span);
			tr.appendChild(td);
		}

		return table;
	},

	getForecastDom: function(data, detailedPicto, showTime, dateTimeFormat, roundedNow) {
		var self = this;

		if (self.config.layout === 'vertical') {
			return self.getForecastVerticalDom(data, detailedPicto, showTime, dateTimeFormat, roundedNow);
		} else {
			return self.getForecastHorizontalDom(data, detailedPicto, showTime, dateTimeFormat, roundedNow);
		}
	},

	getForecastHorizontalDom: function(data, detailedPicto, showTime, dateTimeFormat, roundedNow) {
		var self = this;

		table = document.createElement("table");
		table.className = "medium";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		for (var showIndex = 0; showIndex < self.config.show.length; showIndex++) {
			var showData = self.config.show[showIndex];

			if (showData === 'weekday' && data.time) {
				var lastDayOfWeek = null;
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, null, function(i) {
					td = document.createElement("td");
					td.className = "align-left";
					var dayOfWeek = mom.day();
					if (dayOfWeek != lastDayOfWeek) {
						td.innerHTML = self.translate(self.config.daysOfWeek[mom.day()]);
					}
					lastDayOfWeek = dayOfWeek;
					return td;
				});
				tbody.appendChild(tr);
			}

			if (showData === 'time' && data.time && showTime) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-time-" + self.round0(roundedNow.hours()) + "\"></i>";
					td.className = "dimmed align-left";
					return td;
				}, function(i) {
					td = document.createElement("td");
					td.innerHTML = mom.format(self.config.timeFormat);
					td.className = "align-left";
					return td;
				});
				tbody.appendChild(tr);
			}

			if (showData === 'pictogram' && data.pictocode) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, null, function(i) {
					var td = document.createElement("td");
					td.className = "align-left";
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

			if (showData === 'precipitation' && data.precipitation) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-raindrop\"></i>";
					td.className = "dimmed align-left";
					return td;
				}, function(i) {
					td = document.createElement("td");
					td.className = "align-left";

					span = document.createElement("span");
					span.innerHTML = self.round1(data.precipitation[i]);
					span.className = "bright";
					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = "&nbsp;mm";
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

			if (showData === 'temperature' && (data.temperature || data.temperature_min || data.temperature_max)) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"fa fa-thermometer-half\"></i>";
					td.className = "dimmed align-left";
					return td;
				}, function(i) {
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

			if (showData === 'wind' && (data.windspeed || data.windspeed_max)) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-strong-wind\"></i>";
					td.className = "dimmed align-left";
					return td;
				}, function(i) {
					td = document.createElement("td");
					td.className = "align-left";
					if (data.windspeed) {
						span = document.createElement("span");
						span.innerHTML = self.round1(data.windspeed[i]);
						span.className = "bright";
						td.appendChild(span);

						span = document.createElement("span");
						span.innerHTML = "&nbsp;m/s";
						span.className = "dimmed xsmall";
						td.appendChild(span);

					}
					if (data.windspeed_max) {
						span = document.createElement("span");
						span.innerHTML = self.round1(data.windspeed_max[i]);
						span.className = "bright";
						td.appendChild(span);

						span = document.createElement("span");
						span.innerHTML = "&nbsp;m/s";
						span.className = "dimmed xsmall";
						td.appendChild(span);
					}
					if (data.winddirection) {
	//					span = document.createElement("span");
	//					span.innerHTML = "<i class=\"center-icon wi wi-wind from-" + self.round0(data.winddirection[i]) + "-deg\"></i>";
	//					span.className = "dimmed";
	//					td.appendChild(span);

						span = document.createElement("span");
						span.innerHTML = "&nbsp;" + self.translate(self.degToCompass(data.winddirection[i]));
						span.className = "dimmed xsmall align-right";
						td.appendChild(span);
					}
					return td;
				});
				tbody.appendChild(tr);
			}

			if (showData === 'clouds' && (data.lowclouds || data.midclouds || data.highclouds)) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-cloud\"></i>";
					td.className = "dimmed align-left align-top";
					return td;
				}, function(i) {
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

			if (showData === 'clouds' && (data.lowclouds_min || data.midclouds_min || data.highclouds_min)) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-cloud align-top\"></i>";
					td.className = "align-left align-top";
					return td;
				}, function(i) {
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

			if (showData === 'visibility' && data.visibility) {
				var tr = self.createTableRow(data, dateTimeFormat, roundedNow, function() {
					td = document.createElement("td");
	//				td.innerHTML = "<i class=\"wi wi-raindrop\"></i>";
	//				td.className = "dimmed align-left";
					return td;
				}, function(i) {
					td = document.createElement("td");
					td.className = "align-left";

					span = document.createElement("span");
					span.innerHTML = self.round0(data.visibility[i]);
					span.className = "bright";
					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = "&nbsp;m";
					span.className = "dimmed xsmall";
					td.appendChild(span);

					return td;
				});
				tbody.appendChild(tr);
			}
		}

		return table;
	},

	createTableRow: function(data, dateTimeFormat, roundedNow, createTableHeader, createTableData) {
		var self = this;

		var tr = document.createElement("tr");

		var th = null;
		if (createTableHeader) {
			th = createTableHeader();
		} else {
			th = document.createElement("td");
		}
		tr.appendChild(th);

		opacity = 1.0;
		elementCount = 0;
		for (let i = 0; i < data.time.length; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}
			if (elementCount++ >= self.config.maxElements) {
				continue;
			}

			var td = createTableData(i);
			td.style.opacity = opacity;
			opacity = opacity * self.config.opacityFactor;
			tr.appendChild(td);
		}

		return tr;
	},

	getForecastVerticalDom: function(data, detailedPicto, dateTimeFormat, roundedNow) {
		var self = this;

		table = document.createElement("table");
		table.className = "medium";

		tbody = document.createElement("tbody");
		table.appendChild(tbody);

		var lastDayOfWeek = null;

		// add data rows
		opacity = 1.0;
		for (let i = 0; i < data.time.length && i < self.config.maxElements; i++) {
			mom = moment(data.time[i], dateTimeFormat);
			if (mom < roundedNow) {
				continue;
			}

			tr = document.createElement("tr");
			tr.style.opacity = opacity;
			opacity = opacity * self.config.opacityFactor;
			tbody.appendChild(tr);

			for (var showIndex = 0; showIndex < self.config.show.length; showIndex++) {
				var showData = self.config.show[showIndex];

				if (showData === 'weekday' && data.time) {
					td = document.createElement("td");
					td.className = "align-left";
					var dayOfWeek = mom.day();
					if (dayOfWeek != lastDayOfWeek) {
						td.innerHTML = self.translate(self.config.daysOfWeek[mom.day()]);
					}
					lastDayOfWeek = dayOfWeek;
					tr.appendChild(td);
				}

				if (showData === 'time' && data.time) {
					td = document.createElement("td");
					td.className = "align-left";
					lastDayOfWeek = dayOfWeek;
					td.innerHTML = mom.format(self.config.timeFormat);
					tr.appendChild(td);
				}

				if (showData === 'pictogram' && data.pictocode) {
					td = document.createElement("td");
					img = document.createElement("img");
					if (detailedPicto) {
						img.src = self.pictocodeDetailedToUrl(data.pictocode[i], data.isdaylight[i])
					} else {
						img.src = self.pictocodeToUrl(data.pictocode[i])
					}
					img.width = self.config.pictogramSmall;
					img.height = self.config.pictogramSmall;
					td.appendChild(img);
					tr.appendChild(td);
				}

				if (showData === 'precipitation' && data.precipitation) {
					td = document.createElement("td");
					td.className = "dimmed table-icon";
					if (data.snowfraction && data.snowfraction[i] > 0.0) {
						td.innerHTML = "<i class=\"wi wi-snowflake-cold\"></i>";
					} else {
						td.innerHTML = "<i class=\"wi wi-raindrop\"></i>";
					}
					tr.appendChild(td);

					td = document.createElement("td");

					scan = document.createElement("scan");
					scan.innerHTML = self.round1(data.precipitation[i]);
					scan.className = "bright";
					td.appendChild(scan);

					scan = document.createElement("scan");
					scan.innerHTML = "&nbsp;mm";
					scan.className = "dimmed xsmall";
					td.appendChild(scan);

					tr.appendChild(td);
				}

				if (showData === 'precipitation' && data.precipitation_probability) {
					td = document.createElement("td");
					td.innerHTML = "&nbsp;" + data.precipitation_probability[i] + "%";
					td.className = "dimmed xsmall";
					tr.appendChild(td);
				}

				if (showData === 'temperature' && (data.temperature || data.temperature_min || data.temperature_max)) {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"fa fa-thermometer-half\"></i>";
					td.className = "dimmed table-icon";
					tr.appendChild(td);
				}

				if (showData === 'temperature' && data.temperature) {
					td = document.createElement("td");
					td.innerHTML = self.round1(data.temperature[i]) + "&deg;";
					td.style.color = self.temperatureToColor(data.temperature[i]);
					td.className = "bright";
					tr.appendChild(td);
				}

				if (showData === 'temperature' && data.temperature_min) {
					td = document.createElement("td");
					td.innerHTML = self.round1(data.temperature_min[i]) + "&deg;";
					td.style.color = self.temperatureToColor(data.temperature_min[i]);
					td.className = "bright";
					tr.appendChild(td);
				}

				if (showData === 'temperature' && data.temperature_min && data.temperature_max) {
					td = document.createElement("td");
					td.innerHTML = "&hellip;";
					tr.appendChild(td);
				}

				if (showData === 'temperature' && data.temperature_max) {
					td = document.createElement("td");
					td.innerHTML = self.round1(data.temperature_max[i]) + "&deg;";
					td.style.color = self.temperatureToColor(data.temperature_max[i]);
					td.className = "bright";
					tr.appendChild(td);
				}

				if (showData === 'wind' && (data.windspeed || data.windspeed_max)) {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-strong-wind\"></i>";
					td.className = "dimmed table-icon";
					tr.appendChild(td);
				}

				if (showData === 'wind' && data.windspeed) {
					td = document.createElement("td");

					scan = document.createElement("scan");
					scan.innerHTML = self.round1(data.windspeed[i]);
					scan.className = "bright";
					td.appendChild(scan);

					scan = document.createElement("scan");
					scan.innerHTML = "&nbsp;m/s";
					scan.className = "dimmed xsmall";
					td.appendChild(scan);

					tr.appendChild(td);
				}

				if (showData === 'wind' && data.windspeed_max) {
					td = document.createElement("td");

					scan = document.createElement("scan");
					scan.innerHTML = self.round1(data.windspeed_max[i]);
					scan.className = "bright";
					td.appendChild(scan);

					scan = document.createElement("scan");
					scan.innerHTML = "&nbsp;m/s";
					scan.className = "dimmed xsmall";
					td.appendChild(scan);

					tr.appendChild(td);
				}

				if (showData === 'wind' && data.winddirection) {
	//				td = document.createElement("td");
	//				td.innerHTML = "<i class=\"center-icon wi wi-wind from-" + self.round0(data.winddirection[i]) + "-deg\"></i>";
	//				td.className = "dimmed";
	//				tr.appendChild(td);

					td = document.createElement("td");
					td.innerHTML = "&nbsp;" + self.translate(self.degToCompass(data.winddirection[i]));
					td.className = "dimmed";
					tr.appendChild(td);
				}

				if (showData === 'clouds' && (data.lowclouds || data.lowclouds_min)) {
					td = document.createElement("td");
					td.innerHTML = "<i class=\"wi wi-cloud\"></i>";
					td.className = "dimmed table-icon";
					tr.appendChild(td);
				}

				if (showData === 'clouds' && data.lowclouds) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.lowclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.midclouds) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.midclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.highclouds) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.highclouds[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}

				if (showData === 'clouds' && data.lowclouds_min) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.lowclouds_min[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.midclouds_min) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.midclouds_min[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.highclouds_min) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.highclouds_min[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}

				if (showData === 'clouds' && data.lowclouds_max) {
					td = document.createElement("td");
					td.innerHTML = "&hellip;";
					tr.appendChild(td);

					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.lowclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.midclouds_max) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.midclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}
				if (showData === 'clouds' && data.highclouds_max) {
					td = document.createElement("td");
					div = document.createElement("div");
					div.appendChild(self.createCloudCoverElement(data.highclouds_max[i]));
					div.className = "cloudlayer";
					td.appendChild(div);
					tr.appendChild(td);
				}

				if (showData === 'visibility' && data.visibility) {
					td = document.createElement("td");

					span = document.createElement("span");
					span.innerHTML = data.visibility[i];
					span.className = "bright";
					td.appendChild(span);

					span = document.createElement("span");
					span.innerHTML = "&nbsp;m";
					span.className = "dimmed xsmall";
					td.appendChild(span);

					tr.appendChild(td);
				}
			}
		}

		return table;
	},

	createCloudCoverElement: function(cloud) {
		var self = this;

		var span = document.createElement("span");
		span.innerHTML = cloud + "%";
		span.className = "xsmall";
		span.style.color = self.cloudToForegroundColor(cloud);
		span.style.backgroundColor = self.cloudToBackgroundColor(cloud);
		span.style.flex = 1;
		return span;
	},

	getWeather: function() {
		var self = this;

		console.log("getWeather: " + self.url);

		self.sendSocketNotification('GET_WEATHER', self.url);
	},

	notificationReceived: function(notification, payload, sender) {
		var self = this;

		//console.log("notificationReceived: " + self.notification);

		switch(notification) {
			case "DOM_OBJECTS_CREATED":
				self.getWeather();

				var millis = self.config.refreshHours*60*60*1000 + self.config.refreshMinutes*60*1000
				var timer = setInterval(()=>{
					self.getWeather();
				}, millis)
				break;
			}
	},

	processWeather: function(data) {
		var self = this;

		self.weather = data;
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		//console.log("socketNotificationReceived: " + self.notification);

		if (notification === 'WEATHER_RESULT') {
			self.processWeather(payload);
			self.updateDom();
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
		var self = this;
		return "./modules/MMM-weather-meteoblue-astronomy/icons/" + self.padDigits(pictocode, 2) + "_iday.svg";
	},

	pictocodeDetailedToUrl: function(pictocode, isdaylight) {
		var self = this;
		pictoSuffix = isdaylight ? "day" : "night";
		return "./modules/MMM-weather-meteoblue-astronomy/icons/" + self.padDigits(pictocode, 2) + "_" + pictoSuffix + ".svg";
	},

	degToCompass: function(num) {
		var index = Math.floor((num / 22.5) + 0.5) % 16;
		var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
		return arr[index];
	},

})
