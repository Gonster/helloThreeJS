/**
*@author Gonster  ( gonster.github.io )
*/

(function ( window, document, THREE, Detector ) {

    var Base = function ( domParent ) {

        if ( typeof domParent === 'object' ) {
            this.domParent = domParent;
        }
        else {
            this.domParent = document.body;
        }

    };



    Base.prototype.init = function ( onWindowResize, subInit, renderer, scene, camera, controls ) {
        //webgl support test
        // if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        //specify requestAnimation
        if ( ! window.requestAnimationFrame ) {
            window.requestAnimationFrame = ( function() {
                return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( callback, element ) {
                    window.setTimeout( callback, 1000 / 60 );
                };
            } )();
        }

        if ( this.domParent === document.body ) {
            this.WINDOW_WIDTH = window.innerWidth;
            this.WINDOW_HEIGHT = window.innerHeight;
            this.WINDOW_HEIGHT_HALF = this.WINDOW_HEIGHT / 2.0;
            this.WINDOW_WIDTH_HALF = this.WINDOW_WIDTH / 2.0;
            window.addEventListener( 'resize', onWindowResize, false );
        }

        //variables
        this.renderType = ( ! Detector.webgl ) ? 'canvas' : 'webgl'; 
        this.renderer = renderer || ( ( ! Detector.webgl ) ? new THREE.CanvasRenderer( { preserveDrawingBuffer: true } ) : new THREE.WebGLRenderer( { antialias: true,preserveDrawingBuffer: true } ) );
        this.renderer.setSize( this.WINDOW_WIDTH, this.WINDOW_HEIGHT );
        this.domParent.appendChild( this.renderer.domElement );
        this.scene = scene || new THREE.Scene();
        this.camera = camera
            || new THREE.PerspectiveCamera( 35, this.WINDOW_WIDTH / this.WINDOW_HEIGHT, .1, 100000 );
        this.camera.position.set( 1000, 500, 1000 );
        this.camera.lookAt( this.scene.position );

        if ( controls ) {
            this.controls =controls;
        }
        else {
            this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement, {cameraAsOrbitCenter: true} );
            this.controls.target.set( 0, 0, 0 );
            this.controls.rotateSpeed = 1.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.keyPanSpeed = 10;
            this.controls.panSpeed = 1;
            this.controls.noZoom = true;
            this.controls.keys = { LEFT: 65, FORWARD: 87, RIGHT: 68, BACKWARD: 83, UP: 81, BOTTOM: 69 };
            this.controls.mouseButtons = { ORBIT: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
        }

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.zIndex = '999';
        this.stats.domElement.style.display = 'none';
        document.body.appendChild( this.stats.domElement );
        this.stats.end();
        subInit();
    };

    window.Base = Base;

    if( typeof module === 'object' ) {
        module.exports = Base;
    }

})( window, document, THREE, Detector );
