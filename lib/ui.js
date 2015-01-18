(function(){

    var GoUI = {};

    GoUI.Sidebar = function(settings){
        var defaultSettings = {
            'align': 'l',
            'cols': 3,
            'button-width': 30
        }

        this.domElement = document.createElement('div');
        this.domElement.classname = 'c-sidebar';


    };

    //Button group objects
    GoUI.Sidebar.prototype.createButtonGroups = function(buttonGroups){
        for (var i = 0, l=buttonGroups.length - 1; i < l; i++) {
            buttonGroups[i]
        };
    }

    GoUI.settingMixin = function(o1, o2){
        if((typeof o1 === 'object') && (typeof o2 === 'object')){
            var dist = {};
            for(var i in o1) {
                dist[i] = o1[i];
            }
            for(var j in o2){
                if(o2[j] !== undefined){
                    dist[j] = o2[j];
                }
            }
            return dist;
        }
        else{
            return o1;
        }
    }

    window.Base = Base;

    if( typeof module === 'object' ) {
        module.exports = Base;
    }
})();