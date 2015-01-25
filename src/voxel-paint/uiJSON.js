UI_JSON = {
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
                            },
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
                                'name': 'actions',
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
    };