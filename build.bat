cd lib
copy CanvasRenderer.js+Projector.js+OrbitControls.js+Detector.js+base.js+ui.js+..\src\voxel-paint\app.js ..\build\app.js /b
java -jar E:\download\compiler-latest\compiler.jar --js ..\build\app.js --js_output_file ..\build\app.min.js