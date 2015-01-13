var THREE = require('components/three.js');

if ( !window.requestAnimationFrame ) {

	window.requestAnimationFrame = ( function() {

		return window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {

			window.setTimeout( callback, 1000 / 60 );

		};

	} )();

}

var WINDOW_WIDTH = window.innerWidth;
var WINDOW_HEIGHT = window.innerHeight;

//renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize( WINDOW_WIDTH, WINDOW_HEIGHT );
document.body.appendChild( renderer.domElement );

//scene
var scene = new THREE.Scene();

//camera
var camera = new THREE.PerspectiveCamera( 35, WINDOW_WIDTH/WINDOW_HEIGHT, .1, 10000 );
camera.position.set( 20, 20, 20 );
camera.lookAt( scene.position );

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

var onDocumentMouseMove = function(event) {
    if(event.button === 0){
        camera.setViewOffset( camera.fullWidth, camera.fullHeight, camera.x + event.movementX, camera.y + event.movementY, camera.width, camera.height );
    }
}

