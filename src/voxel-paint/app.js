(function ( window, document, Base, THREE, Detector ) {
    //constants
    var DEFAULT_BOX = {
        "width": 50.0
    };
    var DEFAULT_PLANE = {
        "width": 10000.0,
        "height": 10000.0
    }

    var base;
    var basePlaneGeometry, basePlaneMesh;
    // var textureMappings = {
    //     "default": THREE.ImageUtils.loadTexture( "atlas.png" )
    // };
    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.width, DEFAULT_BOX.width, DEFAULT_BOX.width  );
    var currentBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        // ambient: 0x00ff80, 
        // shading: THREE.FlatShading, 
        // map: textureMappings["default"]
    } );
    var currentHelperBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        // ambient: 0x00ff80, 
        // shading: THREE.FlatShading, 
        // map: textureMappings["default"],
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

    function calculateIntersectResult(event) {
        mouseOnScreenVector.set( ( event.clientX / base.WINDOW_WIDTH ) * 2 - 1, - ( event.clientY / base.WINDOW_HEIGHT ) * 2 + 1 );
        raycaster.setFromCamera( mouseOnScreenVector, base.camera );
        return raycaster.intersectObjects( allIntersectableObjects );
    }

    function setMeshPositionToFitTheGrid(mesh,intersect) {
            mesh.position.copy( intersect.point ).add( intersect.face.normal );
            mesh.position.divideScalar( DEFAULT_BOX.width )
            .floor()
            .multiplyScalar( DEFAULT_BOX.width )
            .addScalar( DEFAULT_BOX.width / 2.0 );
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            setMeshPositionToFitTheGrid( helperCube, intersect );
        }

        base.renderer.render( base.scene, base.camera );
    }

    function onDocumentMouseDown(event) {        
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            //add a solid cube
            if( event.which === 1 ) {
                var currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );
                setMeshPositionToFitTheGrid ( currentCube, intersect );
                base.scene.add( currentCube );
                allIntersectableObjects.push( currentCube );
                cubeMeshes.push( currentCube );
                onDocumentMouseMove(event);
                return;
            }
            //remove cube
            if(event.which === 2 ){
                if( intersect.object !== basePlaneMesh ) {
                    base.scene.remove( intersect.object );
                    allIntersectableObjects.splice( allIntersectableObjects.indexOf( intersect.object ), 1 );
                    cubeMeshes.splice( cubeMeshes.indexOf( intersect.object ), 1 );
                    onDocumentMouseMove(event);
                }
            }
        }
    }

    function onDocumentKeyDown(event) {        
    }

    function onDocumentKeyUp(event) {        
    }

    function subInit() {
        //grid
        gridHelper = new THREE.GridHelper( DEFAULT_PLANE.width / 2.0, DEFAULT_BOX.width );
        base.scene.add( gridHelper );

        //base plane
        basePlaneGeometry = new THREE.PlaneBufferGeometry( DEFAULT_PLANE.width, DEFAULT_PLANE.height );
        basePlaneGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
        basePlaneMesh = new THREE.Mesh( basePlaneGeometry );
        basePlaneMesh.visible = false;
        base.scene.add( basePlaneMesh );
        allIntersectableObjects.push( basePlaneMesh );

        //light
        ambientLight = new THREE.AmbientLight( 0x606060 );
        base.scene.add( ambientLight );
        directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        base.scene.add( directionalLight );

        //helper cube
        helperCube = new THREE.Mesh( defaultBoxGeometry, currentHelperBoxMaterial );
        helperCube.position.set( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0 );
        base.scene.add( helperCube );

        //current cube
        currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );

        //intersection detector
        raycaster = new THREE.Raycaster();
        mouseOnScreenVector = new THREE.Vector2();

        base.renderer.setClearColor( 0xf0f0f0 );

        //listeners
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
        document.addEventListener( 'keyup', onDocumentKeyUp, false );
    }

    function animate() {
        requestAnimationFrame( animate );
        base.renderer.render( base.scene, base.camera );
    }

    base = new Base( document.body );
    base.init( onWindowResize, subInit );
    animate();
    var sidebar = new GoUI.Sidebar();
    sidebar.createButtonGroups([
        {
            'name': 'tools',
            'buttons':[
                {
                    'name': 'cube'
                },
                {
                    'name': 'eraser'
                }
            ]    
        },
        {
            'name': 'tools radius',
            'buttons':[
                {
                    'name': '1'       
                },
                {
                    'name': '2'
                },
                {
                    'name': '4'
                }
            ]
        }
    ]);

})( window, document, Base, THREE, Detector );