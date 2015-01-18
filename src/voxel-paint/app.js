(function ( window, document, Base, THREE, Detector ) {
    //constants
    var DEFAULT_BOX = {
        x: 50,
        y: 50,
        z: 50
    };

    var base;
    // var basePlaneGeometry, basePlaneMesh;
    var textureMappings = {
        "default": THREE.ImageUtils.loadTexture( "atlas.png" )
    };
    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.x, DEFAULT_BOX.y, DEFAULT_BOX.z  );
    var currentBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        ambient: 0x00ff80, 
        shading: THREE.FlatShading, 
        map: textureMappings["default"]
    } );
    var currentHelperBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        ambient: 0x00ff80, 
        shading: THREE.FlatShading, 
        map: textureMappings["default"],
        opacity: .5,
        transparent: true
    } );
    var helperCube, currentCube;
    var gridHelper;
    var allIntersectableObjects = [];
    var cubeMeshes = [];
    var ambientLight, directionalLight, soloPointLight;
    var mouseOnScreenVector;
    var raycaster;

    function onWindowResize(event) {

        base.WINDOW_WIDTH = window.innerWidth;
        base.WINDOW_HEIGHT = window.innerHeight;
        base.WINDOW_HEIGHT_HALF = base.WINDOW_HEIGHT / 2.0;
        base.WINDOW_WIDTH_HALF = base.WINDOW_WIDTH / 2.0;

        base.camera.aspect = base.WINDOW_WIDTH / base.WINDOW_HEIGHT;
        base.camera.updateProjectionMatrix();
        base.renderer.setSize( base.WINDOW_WIDTH, base.WINDOW_HEIGHT );

    }

    function subInit() {
        //grid
        gridHelper = new THREE.GridHelper( 5000, 50 );
        base.scene.add( gridHelper );
        allIntersectableObjects.push( gridHelper );

        //light
        ambientLight = new THREE.AmbientLight( 0x606060 );
        base.scene.add( ambientLight );

        //helper cube
        helperCube = new THREE.Mesh( defaultBoxGeometry, currentHelperBoxMaterial );
        base.scene.add( helperCube );

        //current cube
        currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );

        //intersection detector
        raycaster = new THREE.Raycaster();
        mouseOnScreenVector = new THREE.Vector2();


    }

    function animate() {
        requestAnimationFrame( animate );
        base.renderer.render( base.scene, base.camera );
    }

    base = new Base( document.body );
    base.init( onWindowResize, subInit );
    animate();

})( window, document, Base, THREE, Detector );