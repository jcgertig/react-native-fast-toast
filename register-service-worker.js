"serviceWorker"in navigator&&window.addEventListener("load",(function(){navigator.serviceWorker.register("/react-native-fast-toast/expo-service-worker.js",{scope:"/react-native-fast-toast/"}).then((function(e){})).catch((function(e){console.info("Failed to register service-worker",e)}))}));