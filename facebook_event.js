$(function() {
	intervalId = setInterval(checkURL, 1000)
});

function checkURL() {
	var pathSplit = window.location.pathname.split("/");
	if (pathSplit.length > 3 && pathSplit[1] === "events") {
		if ($(".gcal_link").length === 0) {
			addAndBindLink();
		}
	}
	delete pathSplit;
}
function addAndBindLink() {
	var link = $("<span />")
		.text("Add to Google Calendar")
		.addClass("gcal_link")
		.css("margin-left", "10px").css("font-weight", "bold")
		.css("color", "#3B5998").css("cursor", "pointer");
	$("#headerArea .fbEventHeaderBlock .mbm").append(link);
	$(".gcal_link").bind("click", openFacebook);
}

try {
	function openFacebook() {
		var path = window.location.pathname.split("/");
		var eventId = parseInt(path[path.length-2], 10);
		var appID = "125933790862204";
		var path = 'https://www.facebook.com/dialog/oauth?';
		var queryParams = ['client_id=' + appID,'redirect_uri=https://www.facebook.com/connect/login_success.html?event_id='+eventId, 'response_type=token', "scope=user_events"];
		var query = queryParams.join('&');
		var url = path + query;
		window.open(url);
	}

	if (window.location.hash.length > 0 && window.location.pathname.match("connect/login_success")) {
		return;
		var accessToken = window.location.hash.substring(1);
		var eventId = window.location.search.split("=")[1];
		var path = "https://graph.facebook.com/"+eventId+"?";

		var queryParams = [accessToken];
		var query = queryParams.join('&');
		var event_url = path + query;
		$.ajax({
			url : event_url,
			type : "GET",
			dataType: "JSON",
			success: function(response) {
				var titleText = response.name;
				var descriptionText = response.description ? response.description.substring(0, 1000) : "";
				var startTime = formatTime(response.start_time);
				var endTime = formatTime(response.end_time);
				if (startTime === null) {
					$("<div />").text("I'm sorry but the date on this event is invalid! Please try again").css("font-size", "75px").css("font-weight", "bold").css("text-align", "center").appendTo("body");
					return;
				}
				var locationText = get_location(response).replace(/\n$/,'').replace(/\n/g,'');
				var href = 'https://www.google.com/calendar/render?action=TEMPLATE'
				+ '&text=' + encodeURIComponent(titleText)
				+ '&dates='+ startTime + '/' + endTime
				+ '&location=' + locationText
				+ '&details=' + encodeURIComponent(descriptionText)
				+ '&trp;=true&sprop=+website:http://www.facebook.com&sprop;=name:Jave+Cafe&gsessionid=OK&sf=true&output=xml';
				window.open(href, "_self");
			}
		});
	}

	function get_location(response) {
		var venue = response.venue;
		if (venue && (venue.street || venue.name)) {
			result = locationTextString(response.location, venue.street, venue.city, venue.state, venue.zip);
		} else if (venue && venue.id) {
			var accessToken = window.location.hash.substring(1);
			var result = "";
			var path = "https://graph.facebook.com/"+venue.id+"?";
			var queryParams = [accessToken];
			var query = queryParams.join('&');
			var venue_url = path + query;
			$.ajax({
				url: venue_url,
				async: false,
				type : "GET",
				dataType: "JSON",
				success: function(response) {
					var venue = response.location;
					result = locationTextString(response.name, venue.street, venue.city, venue.state, venue.zip);
				}
			});
		}
		return result || "Unknown Location";
	}

	function locationTextString(name, street, city, state, zip) {
		var result = name + ", ";
		result = street ? result + " " + $.trim(street) : result;
		result = city ? result + ", " + $.trim(city) : result;
		result = state ? result + " " + $.trim(state) : result;
		result = zip ? result + " " + $.trim(zip) : result;
		return result;
	}

	function formatTime(dateTime) {
		var d = new XDate(new Date(dateTime));
		if (d.valid()) {
			d.addHours(d.getTimezoneOffset()/60);
			var dStr = d.getUTCFullYear()
		           + pad(d.getUTCMonth() + 1)
		           + pad(d.getUTCDate())
		           + 'T'
		           + pad(d.getUTCHours())
		           + pad(d.getUTCMinutes())
		           + '00Z';
			return dStr;
		} else {
			return null;
		}

	}

	function pad(str) {
	  str = str.toString();
	  return (str.length == 1) ? '0' + str : str;
	}
} catch(e) {
	$("<div />").text("See that success in the top left? That's a lie. Don't worry, I'm not lying to you. Facebook is. You have an error. Remember your event should have a start & end date, also facebook sometimes is slow and recently modified events sometimes aren't in their API yet. Just try again later. Sorry! You still getting this message after a week? Talk to me, shoot me an email at rohan.dhaimade@gmail.com and I'll see what I can do. Or send presents. Whatever. ").css("font-size", "25px").css("font-weight", "bold").appendTo("body");
}
