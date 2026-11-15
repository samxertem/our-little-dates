'use strict';
// Little things only the phone/tablet app needs. On the computer this file does nothing.
(function mobile() {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;

  document.documentElement.classList.add('native', `native-${cap.getPlatform()}`); // e.g. native-android
  const App = cap.registerPlugin('App');

  const openOverlays = () => [...document.querySelectorAll('.overlay')].filter((o) => !o.hidden);

  // ---------- android's back button ----------
  // Android's back gesture/button. Once we listen for it, Android stops doing its own thing
  // (closing the whole app), so whatever this function does is ALL that back does.
  // Return nothing; call App.minimizeApp() to tuck the app away like the home button would.
  function handleBack() {
    // TODO: decide what "back" means in our app (ideas: in the book, turn back a page
    // before closing it; clear a search or #tag filter; hop from done & loved to the wishlist).
    // For now: close whatever's open on top, otherwise tuck the app away.
    const top = openOverlays().pop();
    if (top) closeOverlay(top);
    else App.minimizeApp();
  }

  App.addListener('backButton', handleBack);
})();
