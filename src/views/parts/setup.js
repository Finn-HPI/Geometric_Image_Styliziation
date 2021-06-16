window.addEventListener("load", function(event) {
    const canvas = document.getElementById('webgl-canvas');
    canvas.addEventListener('dblclick', () => {
        if(document.fullscreen) {
            document.exitFullscreen();
        } else {
            canvas.requestFullscreen();
        }
    });
    console.log("setup");
    initializeRenderer('webgl-canvas');
})