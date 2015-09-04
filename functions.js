var myLayer;
var map;
var Images;
var user_Id;
var album_id;

function loadAlbumsButton() {
    //clear the previous results
    clearPrevious();

    //display the loading image
    $(".loader").css("display", "block");

    user_id = $("#picasa_id").val();
    var url = "http://picasaweb.google.com/data/feed/base/user/" + user_id + "?alt=json"
        //url = url.replace(/:user_id/, 'natevatt')
    $.getJSON(url, function (data) {
            var picasaAuthor = data.feed.author[0].name.$t;
            var picasaAuthorIcon = data.feed.icon.$t;

            var imgString = "<img src='" + picasaAuthorIcon + "' />";
            $("#authorName").text(picasaAuthor);
            $("#authorNumberAlbums").text("Number of Albums: "+data.feed.entry.length);
            $("#authorImg").append(imgString);
            $("#authorDetails").css("display","block");

            for (var i = 0; i < data.feed.entry.length; i++) {
                var albumId = getAlbumId(data.feed.entry[i].id.$t);
                var albumTitle = data.feed.entry[i].title.$t;
                var albumThumbnail = data.feed.entry[i].media$group.media$thumbnail[0].url;
                var albumPublished = data.feed.entry[i].published.$t;

                insertAlbum(albumId, albumTitle, albumThumbnail, albumPublished);

                if (i == data.feed.entry.length - 1) {
                    //remove the loading image
                    $(".loader").css("display", "none");
                }
            }

        })
        .error(function (message) {
            console.log(message);
            $(".error").css("display", "block");
            $(".loader").css("display", "none");
        });

}

function insertAlbum(albumId, albumTitle, albumThumbnail, albumPublished) {

    var newRow = "<tr id='" + albumId + "' ><td style='width:75px'><img class='albumImg' src='" + albumThumbnail + "' /></td><td>" + albumTitle + "</td></tr>";

    $("#albumResults").append(newRow);
}

function clearPrevious() {
    $("#authorDetails").css("display","none"); //clear author
    $("#authorName").empty(); //clear author
    $("#authorNumberAlbums").empty(); //clear author
    $("#authorImg").empty(); //clear author picture
    $("#albumResults").empty(); //clear table album results
}

function getAlbumId(idString) {
    var firstSplit = idString.split('albumid/');
    var cleanId = firstSplit[1].split('?');
    return (cleanId[0]);
}

function loadPicasaAlbum(id) {
    album_id = id;
    $(".error").css("display", "none");
    //display the loading image
    $(".mapLoader").css("display", "block");

    var url = "http://picasaweb.google.com/data/feed/base/user/:user_id/albumid/:album_id?alt=json&kind=photo";

    url = url.replace(/:user_id/, user_id).replace(/:album_id/, album_id);
    var theCenter;
    $.getJSON(url, function (data) {
            Images = data.feed.entry;
            var image1_src = Images[0].content.src;
            putPicasaOnMap();
        })
        .error(function () {
            $(".error").css("display", "block");
            $(".mapLoader").css("display", "none");
        });
}

function putPicasaOnMap() {

    var geoJson = [];

    for (var i = 0; i < Images.length; i++) {
        if (typeof Images[i].georss$where != "undefined") {
            //if (Images[i].georss$where.gml) {
            var thumbnail = Images[i].media$group.media$thumbnail[0];
            var largeImg = Images[i].media$group.media$thumbnail[2];
            var coordinate = Images[i].georss$where.gml$Point.gml$pos.$t;
            var photoTitle = Images[i].title.$t || "";
            var photoLink = Images[i].content.src;
            coordinate = coordinate.split(" ");

            var thisPhoto = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [coordinate[1],
                                      coordinate[0]]
                },
                "properties": {
                    "title": photoTitle,
                    "icon": {
                        "iconUrl": thumbnail.url,
                        "iconSize": [50, 50], // size of the icon
                        "iconAnchor": [25, 25], // point of the icon which will correspond to marker's location
                        "popupAnchor": [0, -25], // point from which the popup should open relative to the iconAnchor
                        "className": "markerClass"
                    },
                    "image": largeImg.url,
                    "photoLink": photoLink
                }
            }
            geoJson.push(thisPhoto);
        }
        if (i == Images.length - 1) {
            //After all images remove mapLoader
            $(".mapLoader").css("display", "none");


            if (geoJson.length == 0) {
                displayNoGPSMessage(); //if no images have gps, display a notice
            } else {
                $("#shareButton").css("visibility", "visible"); //display the Share Button 
            }
        }
    }

    myLayer.on('layeradd', function (e) {
        var marker = e.layer,
            feature = marker.feature;
        marker.setIcon(L.icon(feature.properties.icon));

        // Create custom popup content
        var popupContent = '<a href="' + feature.properties.photoLink + '" target="blank"><h3>' + feature.properties.title + '</h3><br />' +
            '<img src="' + feature.properties.image + '" /></a>';

        marker.bindPopup(popupContent, {
            closeButton: true,
            minWidth: 310
        });
    });

    // Add features to the map.
    myLayer.setGeoJSON(geoJson);
    map.fitBounds(myLayer.getBounds());

    //remove the loading image
    $(".loader").css("display", "none");
}

function displayNoGPSMessage() {
    $("#noGPSMessage").css("display", "block");
    setTimeout(function () {
        $("#noGPSMessage").fadeOut("slow");
    }, 3000);
}

function getUrlVariables() {
    var urlString = window.location.search.substring(1).split('&');
    user_id = urlString[0].split('=').pop();
    album_id = urlString[1].split('=').pop();
    console.log(user_id + " " + album_id);
    loadPicasaAlbum(album_id);
}

function showShareLink(){
    var shareUrl = "http://natsmaps.com/Picasa-Map/loadSaved.html?user_id=" + user_id + "&album_id=" + album_id; //Create the Link
    $("#shareLinkInput").val(shareUrl);//Insert the Link into the input 
    $("#shareLinkInput").css("display","block").select();//show the input box
    //focus on input box
}