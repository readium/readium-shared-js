This fork was created to support WKWebview by replacing calls to console with message handlers.

XCode Find/Replace Regex
	console.([^(]*)\((.*)\);$
	webkit.messageHandlers.console$1.postMessage($2);

Javascript console logging
  console.log()   --> window.webkit.messageHandlers.consolelog.postMessage()
  console.debug() --> window.webkit.messageHandlers.consoledebug.postMessage()
  console.info()  --> window.webkit.messageHandlers.consoleinfo.postMessage()
  console.warn()  --> window.webkit.messageHandlers.consolewarn.postMessage()
  console.error() --> window.webkit.messageHandlers.consoleerror.postMessage()

Obj-C
  WKUserContentController *userContentController = [[WKUserContentController alloc] init];
  [userContentController addScriptMessageHandler:self name:@"consolelog"];
  [userContentController addScriptMessageHandler:self name:@"consoledebug"];
  [userContentController addScriptMessageHandler:self name:@"consoleinfo"];
  [userContentController addScriptMessageHandler:self name:@"consolewarn"];
  [userContentController addScriptMessageHandler:self name:@"consoleerror"];
