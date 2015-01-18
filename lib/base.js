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
        if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

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
        this.renderer = renderer || new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( this.WINDOW_WIDTH, this.WINDOW_HEIGHT );
        this.domParent.appendChild( this.renderer.domElement );
        this.scene = scene || new THREE.Scene();
        this.camera = camera
            || new THREE.PerspectiveCamera( 35, this.WINDOW_WIDTH / this.WINDOW_HEIGHT, .1, 10000 );
        this.camera.position.set( 2000, 1000, 2000 );
        this.camera.lookAt( this.scene.position );

        if ( controls ) {
            this.controls =controls;
        }
        else {
            this.controls = new THREE.OrbitControls( this.camera );
            this.controls.target.set( 0, 0, 0 );
            this.controls.rotateSpeed = 1.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.panSpeed = 0.8;
            this.controls.noZoom = false;
            this.controls.noPan = false;
            this.controls.keys = [ 65, 83, 68 ];
        }

        subInit();
    };

    window.Base = Base;

    if( typeof module === 'object' ) {
        module.exports = Base;
    }

})( window, document, THREE, Detector );