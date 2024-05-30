self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('static-cache').then(cache => {
        return cache.addAll([
          "css/*",
          "fonts/Courier BOLD.ttf",
          "fonts/neomatrix/neomatrix.ttf",
          "project.json",
          "images/*.svg"
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(cacheResponse => {
        if (cacheResponse) {
          return cacheResponse;
        }
  
        return fetch(event.request).then(response => {
          if (response.ok) {
            return caches.open('static-cache').then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
  
          return response;
        });
      })
    );
  });