/**
*@author Gonster  ( gonster.github.io )
*/

(function( window, document, Base, THREE, Detector ){
    //image download dom element
    var imageCaptureDomElement = document.createElement('a');
    imageCaptureDomElement.id = 'imageCapture';
    imageCaptureDomElement.style.display = 'none';    
    imageCaptureDomElement.target = '_blank';
    document.body.appendChild(imageCaptureDomElement);

    //utils
    function iterateTextures( isReversed ){
        var textureId = sidebarParams['textures'] + ((isReversed) ? -1 : 1 )
        var radio = document.getElementById('texture'+textureId);
        if(!radio){
            textureId = (isReversed) ? (materials.length - 1) : 0;
            radio = document.getElementById('texture'+textureId);
            if(!radio) return;
        }
        var isColor = radio.parentElement.className.indexOf('btn-color');
        var isImage = radio.parentElement.className.indexOf('btn-image');

        if(isColor > -1) {
            texturesButton.color = Number(radio.value);
            document.getElementById('colorTexture').parentElement.click();
        }
        else if(isImage > -1) {
            texturesButton.image = Number(radio.value);
            document.getElementById('imageTexture').parentElement.click();
        }
    }

    function insertAIntoB(a, b){
        var c = b.clone();
        for(var i in a){
            c[i] = a[i];
        }
        return c;
    }

    function downloadCanvasImage(domElement, filename) {
        if(getInternetExplorerVersion() !== -1){
            window.navigator.saveBlob = window.navigator.saveBlob || window.navigator.msSaveBlob;                
            if (domElement.msToBlob && window.navigator.saveBlob) {
                window.navigator.saveBlob(domElement.msToBlob(), filename);
            }
            else {
              alert('failed to save image, please use other tools to capture it.');
            } 
        }
        else{
            imageCaptureDomElement.href = domElement.toDataURL();
            imageCaptureDomElement.download = filename;
            imageCaptureDomElement.click();
        } 
    }

    function getInternetExplorerVersion()
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    {
      var rv = -1; // Return value assumes failure.
      if (navigator.appName.indexOf("Internet Explorer")!=-1 || navigator.userAgent.toLowerCase().indexOf("trident")!=-1)
      {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
          rv = parseFloat( RegExp.$1 );
        else{
            re  = new RegExp("rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
              rv = parseFloat( RegExp.$1 );
        }
      }
      return rv;
    }

    function calcEventPagePosition(event){
        if ( event.pageX == null && event.clientX !=  null ) {  
            var doc = document.documentElement, body = document.body;  
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft  || body && body.clientLeft || 0);  
            event.pageY = event.clientY + (doc && doc.scrollTop  ||  body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);  
        } 
    }

    //classes
    var VoxelAnimationManager = function(endFlag){
        // this.animationCount = 0;     
        // this.animationIntervalHandler = [];
        this.endFlag = endFlag;
        this.currentAnimationIntervalHandler = -1;
        this.currentMeshes = [];
        this.currentIterator = 0;
    };

    VoxelAnimationManager.prototype = {  
        'asyncLoadDefaultInterval': 1,
        'loadBoxAnimation': function() {            
                
                var meshes = voxelAnimationManager.currentMeshes;
                if(voxelAnimationManager.currentIterator < meshes.length){
                    meshes[voxelAnimationManager.currentIterator].meshObject.visible = true;
                }
                else{
                    voxelAnimationManager.endFlag = true;
                    clearInterval(voxelAnimationManager.currentAnimationIntervalHandler);
                }
                voxelAnimationManager.currentIterator++;       

        },
        'begin': function(animation, meshes, interval){
            this.endFlag = false;
            this.currentMeshes = meshes;
            this.currentIterator = 0;
            this.currentAnimationIntervalHandler = setInterval( animation, interval || this.asyncLoadDefaultInterval );
            return;
        },
        'instantComplete': function(animation) {    
            if (this.endFlag === true) return;      
            var meshes = voxelAnimationManager.currentMeshes;
            clearInterval(this.currentAnimationIntervalHandler);
            while(this.currentIterator < meshes.length){
                animation();
            }
            this.endFlag = true;
        }
    };

    var VoxelPaintStorageManager = function(isLoadingBoxEnd){
        //loading animation flag   not end yet
        this.isLoadingBoxEnd = isLoadingBoxEnd;
    };

    VoxelPaintStorageManager.prototype = {
        'LOAD_TYPE': {
            'async': 0,
            'sync': 1
        },
        'storageKeys': {
            'meshes': 'vp_meshs',
            'camera': 'vp_camera',
            'sidebar': 'vp_sidebar'
        },
        'load': function (key){
            return  window.localStorage && window.localStorage.getItem(key || this.storageKeys.meshes);
        },
        'save': function (key, data){
            if( ! window.localStorage ) return;
            var save = '';
            if( ! data ){
                switch(key){
                    default:
                    case this.storageKeys.meshes:
                    case undefined:
                        if( ! this.isLoadingBoxEnd && actionRecorder.currentActionIndex < 0) return;
                        for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                            save += cubeMeshes[i].geo.id.replace('geo','') + ',';
                            save += cubeMeshes[i].material.id.replace('texture','') + ',';
                            save += cubeMeshes[i].meshObject.position.x + ',';
                            save += cubeMeshes[i].meshObject.position.y + ',';
                            save += cubeMeshes[i].meshObject.position.z + ';';
                        }
                        break;
                    case this.storageKeys.camera:
                        save += (base.controls.target.x + ',' + base.controls.target.y + ',' + base.controls.target.z + ';');
                        save += (base.controls.object.position.x + ',' + base.controls.object.position.y + ',' + base.controls.object.position.z + ';');
                        break;
                    case this.storageKeys.sidebar:
                        save += texturesButton.image + ',' + texturesButton.color + ',' + sidebarParams['texturesType'] + ',' + sidebarParams['sidebarResize'];
                        break;
                }
            }
            else save = data;
            window.localStorage.setItem(key || this.storageKeys.meshes, save);
        },
        'loadMeshes': function loadMeshes(key, loadType, animation){
            this.isLoadingBoxEnd = false;
            var loadDataArray = []; 
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
                                //generate all meshes    visible
                                pen.draw( Number(currentData[0]), Number(currentData[1]), [Number(currentData[2]), Number(currentData[3]), Number(currentData[4])]);
                            }
                        }
                        this.isLoadingBoxEnd = true;
                        break;
                    default:
                    case this.LOAD_TYPE.async:
                        for(var i = 0, l = loadDataArray.length; i < l; i++){
                            var currentData = loadDataArray[i].split(',');
                            if( currentData.length > 2 ){
                                //generate all meshes    invisible
                                pen.draw( Number(currentData[0]), Number(currentData[1]), [Number(currentData[2]), Number(currentData[3]), Number(currentData[4])], undefined, undefined, true);
                            }
                        }
                        voxelAnimationManager.begin(animation, cubeMeshes);
                        break;
                }
            }
            else{
                voxelAnimationManager.endFlag = true;
            }
        },
        'loadCamera': function loadCamera(key) {
            var loadDataArray = []; 
            {
                var load = this.load(key);
                if(load) loadDataArray = load.split(';');
            }
            if(loadDataArray.length > 0){
                for(var i = 0, l = loadDataArray.length; i < l; i++){
                    var currentData = loadDataArray[i].split(',');
                    switch(i){
                        case 0:
                            base.controls.target.set(Number(currentData[0]) || 0, Number(currentData[1]) || 0, Number(currentData[2]) || 0);
                            break;
                        case 1:
                            base.controls.object.position.set(Number(currentData[0]) || 0, Number(currentData[1]) || 0, Number(currentData[2]) || 0);
                            break;
                    }
                }
                base.controls.update();
            }
        },
        'loadSidebarSelectedButtons': function loadSidebarSelectedButtons(key) {
            var loadDataArray = []; 
            {
                var load = this.load(key);
                if(load) loadDataArray = load.split(',');
            }
            if(loadDataArray.length > 0){
                for(var i = 0, l = loadDataArray.length; i < l; i++){
                    var currentData = loadDataArray[i];
                    if(currentData === '' || Number(currentData) === NaN) {}
                    else{
                        switch(i){
                            case 0:
                                texturesButton.image = Number(currentData) || 0;
                                break;
                            case 1:
                                texturesButton.color = Number(currentData) || 0;
                                break;
                            case 2:
                                if(Number(currentData) === 1){
                                    document.getElementById('colorTexture').parentElement.click();
                                }
                                else{
                                    document.getElementById('imageTexture').parentElement.click();
                                }
                                break;
                            case 3:
                                if(Number(currentData) === 1){
                                    document.getElementById('minSidebar').parentElement.click();
                                }
                                else{
                                    document.getElementById('normalSidebar').parentElement.click();
                                }
                                break;
                        }
                    }
                }
            }
            else{
                document.getElementById('imageTexture').parentElement.click();
            }
        }
    };


    var ActionRecorder = function () {
        this.currentActionIndex = -1;
        this.actionArray = [];
    };

    ActionRecorder.prototype = {
        'undo': function() {
            var currentAction;
            if(this.currentActionIndex < 0) return;
            currentAction = this.actionArray[this.currentActionIndex];
            var reverseOperation = pen.reverseOperationMap[currentAction.type];
            var meshes= currentAction.meshes;
            if(meshes instanceof Array) {
            }
            else{
                meshes = [meshes];
            }
            for (var i = 0, l = meshes.length; i < l; i++) {
                var mesh = meshes[i];
                if(mesh){
                    switch(reverseOperation) {
                        case 'draw':
                            var mesh = pen.draw(
                                mesh.geo, 
                                mesh.material, 
                                [mesh.meshObject.position.x, mesh.meshObject.position.y, mesh.meshObject.position.z],
                                undefined,
                                mesh.meshObject
                            );
                            break;
                        case 'erase':
                            pen.erase(mesh.meshObject);
                            break;
                    }
                }
            }
            this.currentActionIndex--;
            this.updateDom();
        },
        'redo': function() {
            var currentAction;
            if(this.currentActionIndex >= (this.actionArray.length - 1)) return;
            currentAction = this.actionArray[this.currentActionIndex + 1];
            var sameOperation = currentAction.type;
            var meshes= currentAction.meshes;
            if(meshes instanceof Array) {
            }
            else{
                meshes = [meshes];
            }
            for (var i = 0, l = meshes.length; i < l; i++) {
                var mesh = meshes[i];
                if(mesh){
                    switch(sameOperation) {
                        case 'draw':
                            pen.draw(
                                mesh.geo, 
                                mesh.material, 
                                [mesh.meshObject.position.x, mesh.meshObject.position.y, mesh.meshObject.position.z],
                                undefined,
                                mesh.meshObject
                            );
                            break;
                        case 'erase':
                            pen.erase(mesh.meshObject);
                            break;
                    }
                }
            }
            this.currentActionIndex++;
            this.updateDom();
        },
        'addAction': function(actionType, mesh) {
            //截断
            this.actionArray.length = (this.currentActionIndex + 1 > -1) ? this.currentActionIndex + 1 : 0

            var action = {
                'type': actionType,
                'meshes': mesh
            };
            this.actionArray.push(action);
            this.currentActionIndex++;
            this.updateDom();
        },
        'appendObjectToCurrentAction': function(mesh) {
            var currentAction = this.actionArray[this.currentActionIndex];
            if(currentAction.meshes === undefined) {
                currentAction.meshes = mesh;
            }
            else{

                if(currentAction.meshes instanceof Array) {
                }
                else{
                    currentAction.meshes = [currentAction.meshes];
                }

                if(mesh instanceof Array) {
                    for (var i = 0, l = mesh.length; i < l; i++) {
                        currentAction.meshes.push(mesh[i]);
                    };
                }
                else{
                    currentAction.meshes.push(mesh);
                }

            }
        },
        'updateDom': function() {            
            document.getElementById('undo').disabled = (this.currentActionIndex < 0) ? true : false;
            document.getElementById('redo').disabled = (this.currentActionIndex >= (this.actionArray.length - 1)) ? true : false;
        }
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
        'draw': function (geo, material, xyz, intersect, mesh, notVisibleInTheScene){

            var geoIndex,currentBoxGeometryParent,materialIndex,currentBoxMaterialParent;

            if(geo === undefined || typeof geo === 'number'){
                geoIndex = geo || 0;
                currentBoxGeometryParent = geometries[geoIndex];
            }
            else{
                currentBoxGeometryParent = geo;
            }

            if(material === undefined || typeof material === 'number'){
                materialIndex = material || 0;
                currentBoxMaterialParent = materials[materialIndex];
            }
            else{
                currentBoxMaterialParent = material;
            }

            var currentBoxGeometry = currentBoxGeometryParent.data;
            var currentBoxMaterial = currentBoxMaterialParent.data;
            var currentCube = mesh || new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );
            currentCube.castShadow = true;
            currentCube.receiveShadow = true;
            intersect ? setMeshPositionToFitTheGrid( currentCube, intersect ) : currentCube.position.set(xyz[0], xyz[1], xyz[2]);
            (!notVisibleInTheScene) || (currentCube.visible = false);
            base.scene.add( currentCube );
            allIntersectableObjects.push( currentCube );
            cubeMeshes.push( { 'meshObject': currentCube,  'geo': currentBoxGeometryParent, 'material': currentBoxMaterialParent } );
            return cubeMeshes[cubeMeshes.length - 1];
        },
        'erase': function (intersectObject){
            base.scene.remove( intersectObject );
            var index = allIntersectableObjects.indexOf( intersectObject );
            if(index < 0) return undefined;
            allIntersectableObjects.splice( index , 1 );
            var mesh = cubeMeshes[index - 1];
            cubeMeshes.splice( index - 1, 1 );
            return mesh;
        },
        'reverseOperationMap': {
            'draw': 'erase',
            'erase': 'draw'
        }
    };


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
            'directionalLightDensity': 0.4

        },
        'canvas': {
            'ambientLightColor': 0x909090,
            'directionalLightDensity': 0.9
        }
    }

    var DRAW_VOXEL_SAME_CUBE_DEFINITION = 3;

    var base;
    var basePlaneGeometry, basePlaneMesh;
    var reloadFlag = 0;

    var autoSaveInterval = 120*1000;
    var autoSaveIntervalHandler;
    var defaultLoadType = VoxelPaintStorageManager.prototype.LOAD_TYPE.async;
    var defaultTexturesButtonWidth = 50;

    var defaultMaterial = new THREE.MeshLambertMaterial( { color: 0x090909 } );

    var helperBoxMaterialDiff={        
        opacity: .5,
        transparent: true
    };

    var materials = [
        {
            'name': 'default',
            'type': 'color',
            'uniqueData': '#090909',
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

    var texturesButton = {
        'image': 30,
        'color' : 0 
    };
    var auxToggle = true;
    var sidebarParams = {
        'toolsType': 0,
        'toolsRadius': 0,
        'textures': 0,
        'texturesType': 0,
        'toggleAux': function(){
            (sidebarParams['toolsType'] === 1) || (helperCube.visible = ! helperCube.visible);
            gridHelper.visible = ! gridHelper.visible;
            auxToggle = ! auxToggle;
        },
        'capture': function(){
            downloadCanvasImage( base.renderer.domElement, 'capture.png' );
        },
        'clearAll': function(){
            if( !voxelAnimationManager.endFlag ){
                voxelAnimationManager.instantComplete(voxelAnimationManager.loadBoxAnimation);
            }
            if (cubeMeshes.length < 1) return; 
            var mesh = pen.erase(cubeMeshes[0].meshObject);
            actionRecorder.addAction('erase', mesh);
            for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                mesh = pen.erase(cubeMeshes[0].meshObject);
                actionRecorder.appendObjectToCurrentAction(mesh);
            };
        },
        'undo': function(){
            actionRecorder.undo();
        },
        'redo': function(){
            actionRecorder.redo();   
        }         
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

    var voxelAnimationManager = new VoxelAnimationManager();
    var voxelPaintStorageManager = new VoxelPaintStorageManager(false);
    var actionRecorder =new ActionRecorder();
    var pen = new Pen();





    function drawVoxel(intersectResult, isDrawOnSameVoxel, isEraseWhileMoving, isMouseMoving){
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
                var mesh = pen.draw(currentBoxGeometryParentIndex, currentBoxMaterialParentIndex, undefined, intersect);
                if(isMouseMoving) actionRecorder.appendObjectToCurrentAction(mesh);
                else actionRecorder.addAction('draw', mesh);
                return;
            }

            //remove cube
            if(currentToolsType === 1 && isEraseWhileMoving){
                if( intersect.object !== basePlaneMesh ) {
                    var mesh = pen.erase(intersect.object);
                    if(isMouseMoving) actionRecorder.appendObjectToCurrentAction(mesh);
                    else actionRecorder.addAction('erase', mesh);
                    return;
                }
            }
        }
    }

    //listeners
    function onWindowBeforeUnload(event) {
        if(reloadFlag === 0){
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
            voxelPaintStorageManager.save();
        }
    }

    function onWindowReload(event) {
        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
        voxelPaintStorageManager.save();
        reloadFlag = 1;
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
        var intersects;
        var currentToolsType;
        
        if( mouseState[0] === 1 ) {
            intersects = calculateIntersectResult(event);
            drawVoxel(intersects, event.ctrlKey, event.ctrlKey, true);
        }
        else{
            currentToolsType = sidebarParams['toolsType'];
            if(currentToolsType === 1) {
                if(helperCube.visible) helperCube.visible = false;
            }
            else {
                if(!helperCube.visible && auxToggle) helperCube.visible = true;
                intersects = calculateIntersectResult(event);
                updateHelperCube(intersects);
            }
        }
        
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
                if( !voxelAnimationManager.endFlag ){
                    voxelAnimationManager.instantComplete(voxelAnimationManager.loadBoxAnimation);
                    break;
                }
                mouseState[0] = 1;
                // onWindowResize();
                var intersects = calculateIntersectResult(event);
                drawVoxel(intersects, undefined, true, false);
                if(sidebarParams['toolsType'] === 0) updateHelperCube(intersects);
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
            switch(radio.name){
                case 'toolsType':
                    var currentToolsType = Number(radio.value);
                    if(currentToolsType === 1) {
                        if(helperCube.visible) helperCube.visible = false;
                    }
                    else {
                        if(!helperCube.visible && auxToggle) helperCube.visible = true;
                    }
                    break;
                case 'textures':
                    currentBoxMaterialParentIndex = sidebarParams[radio.name];
                    currentBoxMaterialParent = materials[currentBoxMaterialParentIndex];
                    currentBoxMaterial = currentBoxMaterialParent.data;
                    currentHelperBoxMaterial = currentBoxMaterialParent.helperData = materials[sidebarParams[radio.name]].helperData || insertAIntoB(helperBoxMaterialDiff, currentBoxMaterial);
                    helperCube.material = currentHelperBoxMaterial;
                    document.getElementById('cube').parentElement.click();
                    switch(sidebarParams['texturesType']){
                        case 0:
                            texturesButton.image = radio.value;
                            break;
                        default:
                        case 1:                            
                            texturesButton.color = radio.value;
                            break;
                    }
                    break;
                case 'sidebarResize' :
                    var sidebar = GoUI.map['sidebar'].domElement;
                    if(radio.value === '0'){
                        $(sidebar).animate({top:'0',height:'100%'});
                    }
                    else{
                        $(sidebar).animate({top:'60%',height:'40%'});
                    }
                    break;
                case 'texturesType':
                    var type = radio.id;
                    if(type === 'imageTexture'){
                        $('.btn-color').hide();
                        $('.btn-image').show(); 
                        document.getElementById('texture'+texturesButton.image).parentElement.click();                  
                    }
                    else if(type === 'colorTexture'){
                        $('.btn-color').show();           
                        $('.btn-image').hide();                           
                        document.getElementById('texture'+texturesButton.color).parentElement.click();                                 
                    }
                    break;
            }
        }
        else if(this.type === 'button' || this.nodeName.toLowerCase() === 'button'){
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
        switch(event.keyCode){
            //c
            case 67:
                iterateTextures();
                break;
            //x
            case 88:
                iterateTextures(true);
                break;
        }
    }

    function onDocumentKeyUp(event) {  
        if(mouseState[0]) return;    
        switch(event.keyCode){
            //shift
            case 16:
                if(sidebarParams['toolsType'] === 0){
                    document.getElementById('eraser').parentElement.click();
                }
                else if(sidebarParams['toolsType'] === 1){
                    document.getElementById('cube').parentElement.click();
                }
                break;
            //z
            case 90:
                if(event.ctrlKey) actionRecorder.undo();
                break;
            //y
            case 89:
                if(event.ctrlKey) actionRecorder.redo();
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
        // directionalLight.shadowCameraVisible = true;
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
        window.addEventListener('unload', onWindowBeforeUnload, false );
        window.addEventListener('reload', onWindowReload, false );
        base.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        base.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        base.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
        document.addEventListener( 'keyup', onDocumentKeyUp, false );
        autoSaveIntervalHandler = setInterval(onWindowBeforeUnload, autoSaveInterval);
    }



    function animate() {
        requestAnimationFrame( animate );
        base.renderer.render( base.scene, base.camera );
    }

    //begin
    base = new Base( document.body );
    base.init( onWindowResize, subInit );
    animate();
    // var sidebar = new GoUI.Sidebar();
    var UI_JSON = {
            'UIType': 'sidebar',
            'id': 'sidebar',  
            'children':[     
                {                    
                    'UIType': 'buttonGroup',
                    'id': 'sidebarResize',
                    'name': 'sidebarResize',
                    'buttons':[
                        {
                            'title': ' + ',
                            'id': 'normalSidebar',
                            'checked': true
                        },
                        {
                            'title': ' -',
                            'id': 'minSidebar'
                        }
                    ] 
                },
                // {
                //     'UIType': 'panel',
                //     'id': 'panel0',
                //     'title': '缩略图',
                //     'name': 'navigator',
                //     'children':[
                //         {
                //             'UIType': 'nav',
                //             'title': '缩略图',
                //             'id': 'map'
                //         }
                //     ]
                // },
                {
                    'UIType': 'panel',
                    'title': '画笔',
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
                                }
                                // {
                                //     'UIType': 'buttonGroup',
                                //     'title': '画笔半径',
                                //     'id': 'buttonGroup1',
                                //     'name': 'toolsRadius',
                                //     'buttons':[
                                //         {
                                //             'title': '1',
                                //             'id': 'radius0',
                                //             'checked': true 
                                //         },
                                //         {
                                //             'title': '2',
                                //             'id': 'radius1'
                                //         },
                                //         {
                                //             'title': '4',
                                //             'id': 'radius2'
                                //         }
                                //     ]
                                // }
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
                            'title': '',
                            'id': 'buttonGroup3',
                            'name': 'aux',
                            'buttonType': 'button',
                            'appendClass': 'btn-group-toolbtn',
                            'buttons': [
                                {
                                    'title': '辅助物体开关',
                                    'id': 'toggleAux',
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
                                    'name': 'actions',
                                    'buttonType': 'button',
                                    'appendClass': 'btn-group-toolbtn',
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
                            'title': '',
                            'id': 'buttonGroupTexturesType',
                            'name': 'texturesType',
                            'buttons':[
                                {
                                    'title': '贴图',
                                    'id': 'imageTexture',
                                    'checked': true  
                                },
                                {
                                    'title': '颜色',
                                    'id': 'colorTexture'
                                }
                            ]
                        },
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
                                    'bgTypeData': materials[0].uniqueData,
                                    'width': defaultTexturesButtonWidth,
                                    'height': defaultTexturesButtonWidth,
                                    'checked': true  
                                }
                            ]
                        }
                    ]
                }
            ]
        };

    if(base.WINDOW_WIDTH < 600) {
        var children = UI_JSON['children'];
        for(var i = 0, l = children.length; i < l; i++) {
            if(children[i].id === 'sidebarResize'){
                var bottons = children[i].buttons;

                for(var j = 0, l = bottons.length; j < l; j++) {
                    if(bottons[j].id === 'normalSidebar') delete bottons[j].checked;
                    if(bottons[j].id === 'minSidebar') bottons[j].checked = true;
                }
                break;
            }
        }
        sidebarParams['sidebarResize'] = 1;
    }
    else{
        sidebarParams['sidebarResize'] = 0;
    }

    GoUI.Utils.domCreationDirector(UI_JSON);

    actionRecorder.updateDom();
    
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
    function loadSidebarTextures(raw){

    }

    var basicColors = [
        {'color': '#333333'},{'color': '#7f7f7f'},{'color': '#c3c3c3'},{'color': '#ffffff'},
        {'color': '#b97a57'},{'color': '#ff7f27'},{'color': '#880015'},{'color': '#ed1c24'},{'color': '#ffaec9'},
        {'color': '#ffc90e'},{'color': '#fff200'},{'color': '#efe4b0'},{'color': '#22b14c'},{'color': '#b5e61d'},
        {'color': '#00a2e8'},{'color': '#3f48cc'},{'color': '#7092be'},{'color': '#a349a4'},{'color': '#c8bfe7'},
        {'color': '#66ccff'},{'color': '#ff6600'},{'color': '#cc3333'},{'color': '#ffcc33'},{'color': '#33cc99'},
        {'color': '#ff55cc'},{'color': '#b1eb00'},{'color': '#b1eb88'},{'color': '#ff85cb'},{'color': '#ff432e'}
        // ,
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'}
    ];

    for (var i = 0, l = basicColors.length ; i < l; i++) {
        var m ={
            'name': basicColors[i].color,
            'type': 'color',
            'id': 'texture' + (i+1),
            'uniqueData': basicColors[i].color,
            'data': new THREE.MeshLambertMaterial( { color: basicColors[i].color } )
        }
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.uniqueData,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }

    var texturePaths = [
        'texture/grass.png',
        'texture/sand.png',
        'texture/glass.png',
        'texture/rock.png',
        'texture/clay.png',
        'texture/dirt.png',
        'texture/bark.png',
        'texture/slats.png'
    ];

    THREE.ImageUtils.crossOrigin = 'Anonymous';
    for (var i = 0, l = texturePaths.length ; i < l; i++) {
        var m ={
            'name': texturePaths[i].replace('texture/','').replace('.png',''),
            'type': 'image',
            'id': 'texture' +materials.length,
            'uniqueData': texturePaths[i],
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
            'bgTypeData': m.uniqueData,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }
    
    voxelPaintStorageManager.loadCamera(voxelPaintStorageManager.storageKeys.camera);

    voxelPaintStorageManager.loadSidebarSelectedButtons(voxelPaintStorageManager.storageKeys.sidebar);

    voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);

})( window, document, Base, THREE, Detector );