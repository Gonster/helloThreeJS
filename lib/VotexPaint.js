(function ( window, document, module, THREE, Detector ) {

    var VoxelPaint = function ( domParent ){
        this.with
    };



    VoxelPaint.prototype.init = function (){

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

    };



    //constants
    var WINDOW_WIDTH = window.innerWidth;
    var WINDOW_HEIGHT = window.innerHeight;
    var WINDOW_HEIGHT_HALF = WINDOW_HEIGHT / 2.0;
    var WINDOW_WIDTH_HALF = WINDOW_WIDTH / 2.0;

    //variables
    var renderer, scene, camera;
    var controls;
    var basePlaneGeometry, basePlaneMesh;
    var gridHelper;
    var cubes = [];
    var ambientLight, directionalLight, soloPointLight;
    var mouseOnScreenVector;


    //facilities
    function onWindowResize(event) {

        WINDOW_WIDTH = window.innerWidth;
        WINDOW_HEIGHT = window.innerHeight;
        WINDOW_HEIGHT_HALF = WINDOW_HEIGHT / 2.0;
        WINDOW_WIDTH_HALF = WINDOW_WIDTH / 2.0;

        camera.aspect = WINDOW_WIDTH / WINDOW_HEIGHT;
        camera.updateProjectionMatrix();
        renderer.setSize( WINDOW_WIDTH, WINDOW_HEIGHT );
    }

    function onDocumentMouseMove(event) {

    }

    function onDocumentMouseClick(event) {

    }



    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( WINDOW_WIDTH, WINDOW_HEIGHT );
    document.body.appendChild( renderer.domElement );

    //camera
    camera = new THREE.PerspectiveCamera( 35, WINDOW_WIDTH/WINDOW_HEIGHT, .1, 10000 );
    camera.position.set( 20, 20, 20 );
    camera.lookAt( scene.position );

    //controls
    controls = new THREE.OrbitControls( camera );
    controls.target.set( 0, 0, 0 );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.keys = [ 65, 83, 68 ];

    //scene
    scene = new THREE.Scene();

    //mesh = geometry + material       ---add into--->    scene
    var geometry = new THREE.CubeGeometry( 3, 4, 5 );
    var material = new THREE.MeshLambertMaterial( { color: 0xCCCCCC } );
    var mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //light
    var light = new THREE.PointLight( 0xFFFFF0 );
    light.position.set( 10, 10, 10 );
    scene.add( light );

    //render result
    renderer.render( scene, camera );

    //listener
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

    if( typeof module === ' object' ) {
        module.exports = VoxelPaint;
    }

})( window, document, module, THREE, Detector );
