
// This is a sample implementation of a resource fetcher plugin.  It is intended to show how a resource fetcher plugin might be written.
// This plugin uses an ajax call to call to a service to get the contents of a resource.
//
// It's based on a plugin used at Bibliotheca to get the contents of an epub from a server.  I've edited this file to remove
// some functionality specific to Bibliotheca.  The result may or may not be suitiable for your needs.

define(['readium_js_plugins', 'readium_shared_js/globals', '../../../js/epub-fetch/discover_content_type' ],
    function (Plugins, Globals,ContentTypeDiscovery) {
    var config = {};
     Plugins.register("ResourceFetcherPlugin", function (api) {

         api.plugin.CustomResourceFetcher = function(parentFetcher){
             var ebookURL = parentFetcher.getEbookURL();
             var ebookURL_filepath = parentFetcher.getEbookURL_FilePath();

             var self = this;

             // INTERNAL FUNCTIONS
             // PUBLIC API
             this.shouldConstructDomProgrammatically = function() { return true; }
             this.resolveURI = function (pathRelativeToPackageRoot) {
                 var pathRelativeToPackageRootUri = undefined;
                 try {
                     pathRelativeToPackageRootUri = new URI(pathRelativeToPackageRoot);
                 } catch(err) {
                     console.error(err);
                     console.log(pathRelativeToPackageRoot);
                 }
                 if (pathRelativeToPackageRootUri && pathRelativeToPackageRootUri.is("absolute")) return pathRelativeToPackageRoot; //pathRelativeToPackageRootUri.scheme() == "http://", "https://", "data:", etc.


                 var url = ebookURL_filepath;
                 try {
                     //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                     url = new URI(url).search('').hash('').toString();
                 } catch(err) {
                     console.error(err);
                     console.log(url);
                 }

                 return url + (url.charAt(url.length-1) == '/' ? "" : "/") + pathRelativeToPackageRoot;
             };

             this.fetchFileContents = function(pathRelativeToPackageRoot, isText, fetchCallback, onerror) {
                 var body={};
                 var config={ };

                 var success = function(data, textStatus, jqXHR) {
                     ReadiumSDK.emit('ResourceFetcher-Success', data, pathRelativeToPackageRoot, body, config);
                     fetchCallback(data);
                 };

                 var error = function (xhr, status, errorThrown, self) {
                     onerror(new Error(errorThrown));
                 }

                 // Hook; someone can listen for this event and modify the config object before the ajax call.
                 ReadiumSDK.emit('ResourceFetcher-BeforeFetchFileContents', pathRelativeToPackageRoot, isText, config, success,error);
                 config.isText=isText;

                 var ajaxArguments ={
                     retryCount: 0,
                     isText: isText,
                     headers: {
                         'Accept': 'application/json',
                         'Content-Type': 'application/json'
                     },
                     url: config.url,
                     type: 'POST',
                     dataType: 'json',
                     data: JSON.stringify(body),
                     success: success,
                     error: error
                 }

                 $.ajax(ajaxArguments);
             };

             this.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
                 this.fetchFileContents(pathRelativeToPackageRoot, true, function (result) {
                     fetchCallback(result);
                 }, onerror);
             };

             this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
                 this.fetchFileContents(pathRelativeToPackageRoot, false, function(result) {
                     var contentType = ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot);
                     var bytes = new Uint8Array(result.length); for (var i=0; i<result.length; i++) bytes[i] = result.charCodeAt(i);
                     var blob = new Blob([bytes],{type: contentType});
                     fetchCallback(blob);
                 },onerror);
             };

         };
         api.plugin.CustomResourceFetcher.openPackageDocument = function(ebookURL, callback, openPageRequest, openPackageDocument_) {
             openPackageDocument_(ebookURL, callback, openPageRequest, '');
         }
     });

    return config;
});

