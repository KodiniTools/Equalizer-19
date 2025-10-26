// ULTIMATE FIX: Styles direkt per JavaScript setzen
// Dies läuft NACH dem Vue-Rendering und überschreibt ALLES

function forceStyles() {
  console.log('🔧 FORCING STYLES...');

  // Warte bis DOM geladen ist
  const applyStyles = () => {
    // Recording Controls
    const recordingControls = document.querySelectorAll('.recording-controls');
    recordingControls.forEach(el => {
      el.style.setProperty('background', '#2D3748', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Recording Controls styled');
    });

    // Recording Header h3
    const recordingHeaders = document.querySelectorAll('.recording-header h3, .recording-controls h3');
    recordingHeaders.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Recording Headers styled');
    });

    // Format Selector
    const formatSelectors = document.querySelectorAll('.format-selector');
    formatSelectors.forEach(el => {
      el.style.setProperty('background', '#4B5563', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Format Selectors styled');
    });

    // Format Selector Labels und Spans
    const formatLabels = document.querySelectorAll('.format-selector label, .format-selector span');
    formatLabels.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Format Labels styled');
    });

    // Output Recording
    const outputRecording = document.querySelectorAll('.output-recording');
    outputRecording.forEach(el => {
      el.style.setProperty('background', '#2D3748', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Output Recording styled');
    });

    // Output Recording h3
    const outputHeaders = document.querySelectorAll('.output-recording h3');
    outputHeaders.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Output Headers styled');
    });

    // Btn Format
    const btnFormats = document.querySelectorAll('.btn-format');
    btnFormats.forEach(el => {
      el.style.setProperty('background', '#4B5563', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Btn Formats styled');
    });

    // Btn Format Spans
    const btnFormatSpans = document.querySelectorAll('.btn-format span, .btn-format i');
    btnFormatSpans.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Btn Format Text styled');
    });

    // Playlist
    const playlists = document.querySelectorAll('.playlist');
    playlists.forEach(el => {
      el.style.setProperty('background', '#2D3748', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Playlist styled');
    });

    // Playlist Header h3
    const playlistHeaders = document.querySelectorAll('.playlist-header h3');
    playlistHeaders.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Playlist Headers styled');
    });

    // Playlist Items
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach(el => {
      el.style.setProperty('background', '#4B5563', 'important');
      el.style.setProperty('color', '#FFFFFF', 'important');
      console.log('✅ Playlist Items styled');
    });

    // Track Names
    const trackNames = document.querySelectorAll('.track-name');
    trackNames.forEach(el => {
      el.style.setProperty('color', '#FFFFFF', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Track Names styled');
    });

    // Track Meta
    const trackMetas = document.querySelectorAll('.track-meta');
    trackMetas.forEach(el => {
      el.style.setProperty('color', '#E5E7EB', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('text-shadow', '0 0 5px rgba(0,0,0,0.8)', 'important');
      console.log('✅ Track Metas styled');
    });

    console.log('🎉 ALL STYLES FORCED!');
  };

  // Versuche sofort
  applyStyles();

  // Versuche nach kurzer Verzögerung (für Vue-Rendering)
  setTimeout(applyStyles, 100);
  setTimeout(applyStyles, 500);
  setTimeout(applyStyles, 1000);

  // Versuche bei jedem DOM-Update
  const observer = new MutationObserver(() => {
    applyStyles();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Starte sofort
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', forceStyles);
} else {
  forceStyles();
}
