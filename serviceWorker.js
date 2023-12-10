const staticCacheName = "foodMunchCache";
const dynamicCacheName = "foodMunchCache";

const cacheAssets = [
  "./",
  "/index.html",
  "/cart.html",
  "/fallback.html",
  "/css/style.css",
  "/assets/foodmunchlogo.png",
  "/js/main.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
];

// install event
self.addEventListener("install", (evt) => {
  //console.log('SW installed');
  evt.waitUntil(
    caches
      .open(staticCacheName)
      .then((cache) => {
        console.log("caching shell assets");
        cache.addAll(cacheAssets);
      })
      .catch((err) => {
        console.log(err);
      })
  );
});

// activate event
self.addEventListener("activate", (event) => {
  //console.log('SW activated');

  event.waitUntil(clients.claim());

  event.waitUntil(
    caches.keys().then((keys) => {
      //console.log(keys);
      //removes unnecessary caches
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

self.addEventListener("fetch", (evt) => {
  if (evt.request.url.indexOf("firestore.googleapis.com") === -1) {
    evt.respondWith(
      caches
        .match(evt.request)
        .then((cacheRes) => {
          return (
            cacheRes ||
            fetch(evt.request).then((fetchRes) => {
              return caches.open(dynamicCacheName).then((cache) => {
                cache.put(evt.request.url, fetchRes.clone());
                // check cached items size
                limitCacheSize(dynamicCacheName, 15);
                return fetchRes;
              });
            })
          );
        })
        .catch(() => {
          if (evt.request.url.indexOf(".html") > -1) {
            return caches.match("/fallback.html");
          }
        })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  switch (event.action) {
    case "okay":
      sendMessageToClients("We will be right over there soon!");
      break;
    default:
      console.log("Default Click");
      break;
  }
});

self.addEventListener("push", (event) => {
  console.log("Event", event);
  console.log("Data", event.data);

  const data = event.data.json();
  console.log("Data content:", data);

  const option = {
    body: data.description,
  };
  event.waitUntil(self.registration.showNotification(data.title, option));
});

function sendMessageToClients(message) {
  const channel = new BroadcastChannel("notificationChannel");
  channel.postMessage(message);

  channel.close();
}
