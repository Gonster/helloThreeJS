/**
*@author Gonster  ( gonster.github.io )
*/

(function ( window, document, Base, THREE, Detector ) {

    //utils
    function insertAIntoB(a, b){
        var c = b.clone();
        for(var i in a){
            c[i] = a[i];
        }
        return c;
    }

    function calcEventPagePosition(event){
        if ( event.pageX == null && event.clientX !=  null ) {  
            var doc = document.documentElement, body = document.body;  
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft  || body && body.clientLeft || 0);  
            event.pageY = event.clientY + (doc && doc.scrollTop  ||  body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);  
        } 
    }

    //classes
    var VoxelPaintStorageManager = function(){};

    VoxelPaintStorageManager.prototype = {
        'LOAD_TYPE': {
            'async': 0,
            'sync': 1
        },
        'asyncLoadDefaultInterval': 0,
        'storageKeys': {
            'meshes': 'vp_meshs'
        },
        'load': function (key){
            return  window.localStorage && window.localStorage.getItem(key || this.storageKeys.meshes);
        },
        'save': function (key){
            if( ! window.localStorage ) return;
            var save = '';
            for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                save += cubeMeshes[i].geo.id.replace('geo','') + ',';
                save += cubeMeshes[i].material.id.replace('texture','') + ',';
                save += cubeMeshes[i].meshObject.position.x + ',';
                save += cubeMeshes[i].meshObject.position.y + ',';
                save += cubeMeshes[i].meshObject.position.z + ';';
            }
            window.localStorage.setItem(key || this.storageKeys.meshes, save);
        },
        'loadMeshes': function loadMeshes(key, loadType){
            var loadIterator = 0;
            {
                var loadDataArray = []; 
                var intervalCallback;
                {
                    var load = this.load(key);
                    if(load) loadDataArray = load.split(';');
                }
                if(loadDataArray.length > 0){
                    switch(loadType){
                        case this.LOAD_TYPE.sync:
                            for(var i = 0, l = loadDataArray.length; i < l; i++){
                                var currentData = loadDataArray[i].split(',');
                                if( currentData.length > 2 ){
                                    pen.draw( currentData[0], currentData[1], [currentData[2], currentData[3], currentData[4]] );
                                }
                            }
                            break;
                        default:
                        case this.LOAD_TYPE.async:
                            var loader = function(){
                                if(loadIterator < loadDataArray.length){
                                    var currentData = loadDataArray[loadIterator].split(',');
                                    if( currentData.length > 2 ){
                                        pen.draw( currentData[0], currentData[1], [currentData[2], currentData[3], currentData[4]] );
                                    }
                                }
                                else{
                                    clearInterval(intervalCallback);
                                    return;
                                }
                                loadIterator++;
                            };
                            intervalCallback = setInterval( loader, this.asyncLoadDefaultInterval );
                            break;
                    }
                }
            }
        }
    };


    var ActionRecorder = function () {
        this.currentAction = {};
        this.actionArray = [];
    };


    var Pen = function(){};

    function calculateIntersectResult(event) {
        calcEventPagePosition(event);
        mouseOnScreenVector.set( ( event.pageX / base.WINDOW_WIDTH ) * 2 - 1, - ( event.pageY / base.WINDOW_HEIGHT ) * 2 + 1 );
        raycaster.setFromCamera( mouseOnScreenVector, base.camera );
        return raycaster.intersectObjects( allIntersectableObjects );
    }

    function setMeshPositionToFitTheGrid(mesh,intersect) {
        if( ! intersect || ! mesh ) return;
        mesh.position.copy( intersect.point ).add( intersect.face.normal );
        mesh.position.divideScalar( DEFAULT_BOX.width )
        .floor()
        .multiplyScalar( DEFAULT_BOX.width )
        .addScalar( DEFAULT_BOX.width / 2.0 );
    }

    function updateHelperCube(intersects) {
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            setMeshPositionToFitTheGrid( helperCube, intersect );
        }
    }

    Pen.prototype = {
        'calculateIntersectResult': calculateIntersectResult,
        'setMeshPositionToFitTheGrid': setMeshPositionToFitTheGrid,
        'updateHelperCube': updateHelperCube,
        'draw': function (geoIndex, materialIndex, xyz, intersect){
            var geoIndex = geoIndex || 0;
            var materialIndex = materialIndex || 0;
            var currentBoxGeometryParent = geometries[geoIndex];
            var currentBoxMaterialParent = materials[materialIndex];
            var currentBoxGeometry = currentBoxGeometryParent.data;
            var currentBoxMaterial = currentBoxMaterialParent.data;
            var currentCube = new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );
            currentCube.castShadow = true;
            currentCube.receiveShadow = true;
            intersect ? setMeshPositionToFitTheGrid( currentCube, intersect ) : currentCube.position.set(xyz[0], xyz[1], xyz[2]);
            base.scene.add( currentCube );
            allIntersectableObjects.push( currentCube );
            cubeMeshes.push( { 'meshObject': currentCube,  'geo': currentBoxGeometryParent, 'material': currentBoxMaterialParent } );
        },
        'erase': function (intersectObject){
            base.scene.remove( intersectObject );
            var index = allIntersectableObjects.indexOf( intersectObject );
            if(index < 0) return;
            allIntersectableObjects.splice( index , 1 );
            cubeMeshes.splice( index - 1, 1 );
        },
        'reverseOperationMap': {
            'draw': 'erase',
            'erase': 'draw'
        }
    }


    //constants


    var DEFAULT_BOX = {
        'width': 50.0
    };
    var DEFAULT_PLANE = {
        'width': 10000.0,
        'height': 10000.0
    }

    var LIGHT_PARAMS = {
        'webgl': {
            'ambientLightColor': 0x202020,
            'directionalLightDensity': 0.3

        },
        'canvas': {
            'ambientLightColor': 0x909090,
            'directionalLightDensity': 0.9
        }
    }

    var DRAW_VOXEL_SAME_CUBE_DEFINITION = 3;

    var base;
    var basePlaneGeometry, basePlaneMesh;

    var defaultLoadType = VoxelPaintStorageManager.prototype.LOAD_TYPE.async;
    var defaultTexturesButtonWidth = 57;

    var defaultMaterial = new THREE.MeshLambertMaterial( { color: 0x86b74c } );

    var helperBoxMaterialDiff={        
        opacity: .5,
        transparent: true
    };

    var materials = [
        {
            'name': 'default',
            'type': 'color',
            'abstract': '#86b74c',
            'id': 'texture0',
            'data': defaultMaterial,
            'helperData': insertAIntoB(helperBoxMaterialDiff, defaultMaterial)
        }
    ];

    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.width, DEFAULT_BOX.width, DEFAULT_BOX.width  );
    var geometries = [
        {
            'name': 'default',
            'type': '1',
            'id': 'geo0',
            'data': defaultBoxGeometry
        }
    ];

    var sidebarParams = {
        'toolsType': 0,
        'toolsRadius': 0,
        'textures': 0
    };

    var currentBoxMaterialParentIndex = 0;
    var currentBoxMaterialParent = materials[0];
    var currentBoxMaterial = currentBoxMaterialParent.data;
    var currentHelperBoxMaterial = currentBoxMaterialParent.helperData;

    var currentBoxGeometryParentIndex = 0;
    var currentBoxGeometryParent = geometries[0];
    var currentBoxGeometry = currentBoxGeometryParent.data;

    var helperCube, currentCube;
    var gridHelper;
    var allIntersectableObjects = [];
    var cubeMeshes = [];
    var ambientLight, directionalLight, hemisphereLight, spotLight;
    var mouseOnScreenVector, mouseState = [0,0,0];
    var raycaster;

    var voxelPaintStorageManager = new VoxelPaintStorageManager();
    // var actionRecorder =new ActionRecorder();
    var pen = new Pen();





    function drawVoxel(intersectResult, isDrawOnSameVoxel, isEraseWhileMoving){
        var intersects = intersectResult || calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            var currentToolsType = sidebarParams['toolsType'];
            var sameVoxelFlag = false;
            var aioLen = allIntersectableObjects.length;
            if(aioLen && intersect.object !== basePlaneMesh ){
                for(var i = aioLen - 1; i > 0 && i > aioLen - 1 - DRAW_VOXEL_SAME_CUBE_DEFINITION ; i--){
                    if(intersect.object === allIntersectableObjects[i]){
                        sameVoxelFlag=true;
                        break;
                    }
                }
            }
            //add a solid cube
            if(currentToolsType === 0){
                if((sameVoxelFlag === true && isDrawOnSameVoxel === false) || (sameVoxelFlag === false && isDrawOnSameVoxel === true)) return;
                pen.draw(currentBoxGeometryParentIndex, currentBoxMaterialParentIndex, undefined, intersect);
                return;
            }

            //remove cube
            if(currentToolsType === 1 && isEraseWhileMoving){
                if( intersect.object !== basePlaneMesh ) {
                    pen.erase(intersect.object);
                    return;
                }
            }
        }
    }

    //listeners
    function onWindowBeforeUnload(event) {
        voxelPaintStorageManager.save();
    }

    function onWindowResize(event) {
        if( base.WINDOW_WIDTH !== window.innerWidth || base.WINDOW_HEIGHT !== window.innerHeight ){
            base.WINDOW_WIDTH = window.innerWidth;
            base.WINDOW_HEIGHT = window.innerHeight;
            base.WINDOW_HEIGHT_HALF = base.WINDOW_HEIGHT / 2.0;
            base.WINDOW_WIDTH_HALF = base.WINDOW_WIDTH / 2.0;

            base.camera.aspect = base.WINDOW_WIDTH / base.WINDOW_HEIGHT;
            base.camera.updateProjectionMatrix();
            base.renderer.setSize( base.WINDOW_WIDTH, base.WINDOW_HEIGHT );
            document.body.height = base.WINDOW_HEIGHT;
        }
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        updateHelperCube(intersects);
        ( mouseState[0] === 1 ) && drawVoxel(intersects, event.ctrlKey, event.ctrlKey);
        // base.renderer.render( base.scene, base.camera );
        
    }

    // function onTouchMove( event ) {
    //     event.preventDefault();
    //     switch ( event.touches.length ) {
    //         case 1:
    //             break;
    //     }
    // }

    function onDocumentMouseDown(event) {        
        event.preventDefault();
        switch(event.button){
            case -1:
                break;
            case 0:
                mouseState[0] = 1;
                // onWindowResize();
                var intersects = calculateIntersectResult(event);
                drawVoxel(intersects, undefined, true);
                updateHelperCube(intersects);
                // base.renderer.render( base.scene, base.camera );
                break;
            case 1:
                mouseState[1] = 1;
                break;
            case 2:
                mouseState[2] = 1;
                break;
        }
    }

    function onSidebarBtnClick(event){
        if(this.nodeName.toLowerCase() === 'label'){
            var radio = this.getElementsByTagName('input')[0];
            sidebarParams[radio.name] = Number(radio.value);
            // console.log(sidebarParams);
            if(radio.name === 'textures'){
                currentBoxMaterialParentIndex = sidebarParams[radio.name];
                currentBoxMaterialParent = materials[currentBoxMaterialParentIndex];
                currentBoxMaterial = currentBoxMaterialParent.data;
                currentHelperBoxMaterial = currentBoxMaterialParent.helperData = materials[sidebarParams[radio.name]].helperData || insertAIntoB(helperBoxMaterialDiff, currentBoxMaterial);
                helperCube.material = currentHelperBoxMaterial;
            }
        }
        else if(this.type === 'button'){
            sidebarParams[this.id]();
        }
    }

    function onDocumentMouseUp(event) {
        switch(event.button){
            case -1:
                break;
            case 0:
                mouseState[0] = 0;
                break;
            case 1:
                mouseState[1] = 0;
                break;
            case 2:
                mouseState[2] = 0;
                break;
        }
    }

    function onDocumentKeyDown(event) {   

    }

    function onDocumentKeyUp(event) {      
        switch(event.keyCode){
            case 16:
                if(mouseState[0]) return;
                if(sidebarParams['toolsType'] === 0){
                    document.getElementById('eraser').parentElement.click();
                }
                else if(sidebarParams['toolsType'] === 1){
                    document.getElementById('cube').parentElement.click();
                }
                break;
        }
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
        ambientLight = new THREE.AmbientLight( LIGHT_PARAMS[base.renderType].ambientLightColor );
        base.scene.add( ambientLight );

        directionalLight = new THREE.DirectionalLight( 0xeeeeee, LIGHT_PARAMS[base.renderType].directionalLightDensity );
        directionalLight.shadowCameraVisible = true;
        directionalLight.position.set( 0, 6000, 5000 );
        directionalLight.target.position.set( 0, 0, 0 );
        directionalLight.castShadow = true;
        directionalLight.shadowCameraNear = base.camera.near;
        directionalLight.shadowCameraFar = base.camera.far;
        directionalLight.shadowCameraFov = base.camera.fov;
        directionalLight.shadowBias = 0.000001;
        directionalLight.shadowDarkness = 0.5;
        directionalLight.shadowMapWidth = 1024;
        directionalLight.shadowMapHeight = 1024;
        base.scene.add( directionalLight );

        hemisphereLight = new THREE.HemisphereLight( 0xeeeeee, 0x303030, 0.95 );
        base.scene.add( hemisphereLight );

        //helper cube
        helperCube = new THREE.Mesh( currentBoxGeometry, currentHelperBoxMaterial );
        helperCube.position.set( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0 );
        base.scene.add( helperCube );

        //current cube
        currentCube = new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );

        //intersection detector
        raycaster = new THREE.Raycaster();
        mouseOnScreenVector = new THREE.Vector2();

        base.renderer.setClearColor( 0xf0f0f0 );
        base.renderer.shadowMapEnabled = true;
        base.renderer.shadowMapType = THREE.PCFShadowMap;
        //listeners
        window.addEventListener('beforeunload', onWindowBeforeUnload, false );
        base.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        base.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        base.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
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
    // var sidebar = new GoUI.Sidebar();
    GoUI.Utils.domCreationDirector({
        'UIType': 'sidebar',
        'id': 'sidebar',  
        'children':[
            {
                'UIType': 'panel',
                'id': 'panel0',
                'title': '缩略图',
                'name': 'navigator',
                'children':[
                    {
                        'UIType': 'nav',
                        'title': '缩略图',
                        'id': 'map'
                    }
                ]
            },
            {
                'UIType': 'panel',
                'title': '画笔类型/半径',
                'name': 'tools',
                'id': 'panel1',
                'children':[
                    {
                        'UIType': 'Toolbar',
                        'id': 'toolbar0',
                        'children':[
                            {
                                'UIType': 'buttonGroup',
                                'title': '画笔类型(shift切换 按住ctrl方块堆叠或连续擦除)',
                                'id': 'buttonGroup0',
                                'name': 'toolsType',
                                'buttons':[
                                    {
                                        'title': '方块',
                                        'id': 'cube',
                                        'checked': true
                                    },
                                    {
                                        'title': '擦除',
                                        'id': 'eraser'
                                    }
                                ]    
                            },
                            {
                                'UIType': 'buttonGroup',
                                'title': '画笔半径',
                                'id': 'buttonGroup1',
                                'name': 'toolsRadius',
                                'buttons':[
                                    {
                                        'title': '1',
                                        'id': 'radius0',
                                        'checked': true 
                                    },
                                    {
                                        'title': '2',
                                        'id': 'radius1'
                                    },
                                    {
                                        'title': '4',
                                        'id': 'radius2'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'UIType': 'panel',
                'title': '其他功能',
                'name': 'tools',
                'id': 'panel3',
                'children':[
                    {
                        'UIType': 'buttonGroup',
                        'title': '画笔半径',
                        'id': 'buttonGroup3',
                        'name': 'toolsRadius',
                        'buttons':[
                            {
                                'title': '隐藏辅助物体',
                                'id': 'hideAux',
                                'checked': true 
                            },
                            {
                                'title': '截图',
                                'id': 'capture'
                            },
                            {
                                'title': '清空',
                                'id': 'clearAll'
                            }
                        ]
                    },
                    {
                        'UIType': 'Toolbar',
                        'id': 'toolbar1',
                        'children':[
                            {
                                'UIType': 'buttonGroup',
                                'id': 'buttonGroup3',
                                'name': 'toolsType',
                                'buttons':[
                                    {
                                        'title': '撤销',
                                        'id': 'undo',
                                        'checked': true
                                    },
                                    {
                                        'title': '重做',
                                        'id': 'redo'
                                    }
                                ]    
                            }
                        ]
                    }
                ]
            },
            {
                'UIType': 'panel',
                'title': '材料',
                'name': 'tools',                
                'id': 'panel2',
                'overflow': 'hidden',
                'children':[
                    {
                        'UIType': 'buttonGroup',
                        'title': '材料',
                        'id': 'buttonGroup2',
                        'name': 'textures',
                        'appendClass': 'btn-group-rect',
                        'buttons':[
                            {
                                'title': '',
                                'id': 'texture0',
                                'bgType': materials[0].type,
                                'bgTypeData': materials[0].abstract,
                                'width': defaultTexturesButtonWidth,
                                'height': defaultTexturesButtonWidth,
                                'checked': true  
                            }
                        ]
                    }
                ]
            }
        ]
    });
    
    //sidebar event management
    var domArray = document.querySelectorAll('.btn');
    if(domArray instanceof Array || domArray.length){
        for (var i = domArray.length - 1; i >= 0; i--) {
            domArray[i].addEventListener('click', onSidebarBtnClick, false);
        }
    }
    else{
        if(domArray instanceof object){
            domArray.addEventListener('click', onSidebarBtnClick, false);
        }
    }

    //load other textures
    var basicColors = [
        '#66ccff',
        '#ff6600',
        '#cc3333',
        '#ffcc33',
        '#33cc99',
        '#3399cc',
        '#b1eb00',
        '#53bbf4',
        '#ff85cb',
        '#ff432e',        
        '#ffac00'
    ];

    for (var i = 0, l = basicColors.length ; i < l; i++) {
        var m ={
            'name': basicColors[i],
            'type': 'color',
            'id': 'texture' + (i+1),
            'abstract': basicColors[i],
            'data': new THREE.MeshLambertMaterial( { color: basicColors[i] } )
        }
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.abstract,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }

    var texturePaths = [
        'texture/grass.png',
        'texture/sand.png',
        'texture/glass.png'
    ];


    for (var i = 0, l = texturePaths.length ; i < l; i++) {
        var m ={
            'name': texturePaths[i].replace('texture/','').replace('.png',''),
            'type': 'image',
            'id': 'texture' +materials.length,
            'abstract': texturePaths[i],
            'data': new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture(texturePaths[i]), transparent: true } )
        }
        if(m.data.name === 'glass') m.data.map.opacity = 0.3;
        m.data.map.magFilter = THREE.NearestFilter;
        m.data.map.minFilter = THREE.LinearMipMapLinearFilter;
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.abstract,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }
    
    voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType);

})( window, document, Base, THREE, Detector );