var myLayer;
var map;
var Images;
var user_Id;
var user_number;
var album_id;
var openAlbumDetails;

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
            var userNumberDirty = data.feed.author[0].uri.$t
            user_number = userNumberDirty.split('/').pop();

            var imgString = "<img src='" + picasaAuthorIcon + "' class='authorImgSrc' />";
            $("#authorName").text(picasaAuthor);
            $("#authorNumberAlbums").text("Number of Albums: " + data.feed.entry.length);
            $("#authorImg").append(imgString);
            $("#authorDetails").css("display", "block");

            for (var i = 0; i < data.feed.entry.length; i++) {
                var albumId = getAlbumId(data.feed.entry[i].id.$t);
                var albumTitle = data.feed.entry[i].title.$t;
                var albumThumbnail = data.feed.entry[i].media$group.media$thumbnail[0].url;
                var albumPublished = data.feed.entry[i].published.$t;

                insertAlbum(albumId, albumTitle, albumThumbnail, albumPublished);

                if (i == data.feed.entry.length - 1) {
                    //remove the loading image
                    $(".loader").css("display", "none");
                    $(".error").css("display", "none");
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

    var newRow = "<tr id='" + albumId + "' ><td style='width:75px'><img class='albumImg' src='" + albumThumbnail + "' /></td><td><p class='albumTitle'>" + albumTitle + "</p></td></tr><td colspan='2' id='details" + albumId + "' class='albumDetails'></td><tr>";

    $("#albumResults").append(newRow);
}

function clearPrevious() {
    $("#authorDetails").css("display", "none"); //clear author
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

    //unhighlight current open web map
    if (typeof openAlbumDetails != "undefined") {
        var oldAlbumId = openAlbumDetails.replace("details", "");
        $("#"+oldAlbumId).css("background-color","#eee");
    }
    $(".error").css("display", "none");
    //display the loading image
    $(".mapLoader").css("display", "block");

    var url = "http://picasaweb.google.com/data/feed/base/user/:user_id/albumid/:album_id?alt=json&kind=photo";

    url = url.replace(/:user_id/, user_id).replace(/:album_id/, album_id);
    var theCenter;
    $.getJSON(url, function (data) {
            Images = data.feed.entry;
            var image1_src = Images[0].content.src;
            putPicasaOnMap(data);
        })
        .error(function () {
            $(".error").css("display", "block");
            $(".mapLoader").css("display", "none");
        });
}

function putPicasaOnMap(data) {
    var geoJson = [];
    var markerCluster = L.markerClusterGroup();
    var albumTitle = data.feed.title.$t;
    var numberOfEntries = data.feed.entry.length;
    var updated = data.feed.updated.$t.split('T')[0];
    //    updated = updated.split('T')[0];
    //var linkWebAlbum = //https://picasaweb.google.com/107375869608905315121/Bolzano_bike_trip
    var linkGooglePlus = "https://plus.google.com/photos/" + user_number + "/albums/" + album_id;

    for (var i = 0; i < Images.length; i++) {
        if (typeof Images[i].georss$where != "undefined") {
            //if (Images[i].georss$where.gml) {
            var thumbnail = Images[i].media$group.media$thumbnail[0];
            var largeImg = Images[i].media$group.media$thumbnail[2];
            var coordinate = Images[i].georss$where.gml$Point.gml$pos.$t;
            var photoTitle = Images[i].title.$t || "";
            var photoLink = Images[i].content.src;
            coordinate = coordinate.split(" ");
            /************  This is the GeoJson Code ******************* */
            //            var thisPhoto = {
            //                "type": "Feature",
            //                "geometry": {
            //                    "type": "Point",
            //                    "coordinates": [coordinate[1],
            //                                      coordinate[0]]
            //                },
            //                "properties": {
            //                    "title": photoTitle,
            //                    "icon": {
            //                        "iconUrl": thumbnail.url,
            //                        "iconSize": [50, 50], // size of the icon
            //                        "iconAnchor": [25, 25], // point of the icon which will correspond to marker's location
            //                        "className": "markerClass"
            //                    },
            //                    "image": largeImg.url,
            //                    "photoLink": photoLink
            //                }
            //            }

            var title = photoTitle;
            var thisPhoto = L.marker(new L.LatLng(coordinate[0], coordinate[1]), {
                icon: L.icon({
                    'iconUrl': thumbnail.url,
                    'iconSize': [50, 50], // size of the icon
                    'iconAnchor': [25, 25], // point of the icon which will correspond to marker's location
                    'popupAnchor': [0, -25], // point from which the popup should open relative to the iconAnchor
                    'className': "markerClass"
                }),
                title: title
            });

            // Create custom popup content
            var popupContent = '<a href="' + photoLink + '" data-featherlight="image" ><h3>' + title + '</h3><br />' +
                '<img src="' + largeImg.url + '" /></a>';

            thisPhoto.bindPopup(popupContent, {
                closeButton: true,
                minWidth: 310
            });
            //            thisPhoto.bindPopup(title);
            geoJson.push(thisPhoto);
            markerCluster.addLayer(thisPhoto);
        }
        if (i == Images.length - 1) {
            //After all images remove mapLoader
            $(".mapLoader").css("display", "none");

            if (geoJson.length == 0) {
                displayNoGPSMessage(); //if no images have gps, display a notice
            } else {
                $("#shareButton").css("visibility", "visible"); //display the Share Button
                showAlbumDetails(albumTitle, geoJson.length, numberOfEntries, updated, linkGooglePlus);
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
    //    myLayer.setGeoJSON(geoJson);
    map.addLayer(markerCluster);
    map.fitBounds(markerCluster.getBounds());

    //remove the loading image
    $(".loader").css("display", "none");
}

function showAlbumDetails(title, numberGeoTagged, numberOfEntries, updated, linkGooglePlus) {

    closeAlbumDetails();

    var detailsId = "details" + album_id;
    $("#" + detailsId).animate({
        height: 200
    }, 200);

    var theString = "<h3>" + title + "</h3>";
    theString += "<p>Displaying " + numberGeoTagged + " of " + numberOfEntries + " photos</p>";
    theString += "<p>Last Updated: " + updated + "</p>";
    theString += "<button class='btn btn-default'><a href='" + linkGooglePlus + "' target='blank'>View Google+ Album</a></button>";
    $("#" + detailsId).html(theString);
    $("#" + album_id).css("background-color", "#fff"); //highlight title

    openAlbumDetails = detailsId; //update the new opened album details variable
}

function closeAlbumDetails() {
    //check if details from another web album are open and if so close it
    if (typeof openAlbumDetails !== 'undefined') {
        $("#" + openAlbumDetails).html("");
        $("#" + openAlbumDetails).animate({
            height: 0
        }, 200);

    }
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

function showShareLink() {
    var shareUrl = createShareLink();
    $("#shareLinkInput").val(shareUrl); //Insert the Link into the input 
    $("#shareLinkInput").css("display", "block").select(); //show the input boxs
}

function showShareEmbed() {
    var shareUrl = createShareLink();
    var shareEmbed = '<iframe width="560" height="315" src="' + shareUrl + '" frameborder="0" allowfullscreen></iframe>';
    $("#shareLinkInput").val(shareEmbed); //Insert the Link into the input 
    $("#shareLinkInput").css("display", "block").select(); //show the input boxs
}

function createShareLink() {
    var shareUrl = "http://natsmaps.com/Picasa-Map/loadSaved.html?user_id=" + user_id + "&album_id=" + album_id; //Create the Link
    return shareUrl;
}

/*  ************** Click Events  *************  */

$(document).ready(function () {
    $("#loadAlbumsButton").click(function () {
        loadAlbumsButton();
    });

    $("#shareLink").click(function () {
        showShareLink();
    });

    $("#shareEmbed").click(function () {
        showShareEmbed();
    });

    $("#albumResults").on("click", "tr", function () {
        var albumId = $(this).attr("id");
        loadPicasaAlbum(albumId);
    });
});